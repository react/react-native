/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.internal.turbomodule.core

import androidx.annotation.GuardedBy
import com.facebook.common.logging.FLog
import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.RuntimeExecutor
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.internal.turbomodule.core.interfaces.TurboModuleRegistry
import com.facebook.react.turbomodule.core.CallInvokerHolderImpl
import com.facebook.react.turbomodule.core.NativeMethodCallInvokerHolderImpl
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder
import com.facebook.react.turbomodule.core.interfaces.NativeMethodCallInvokerHolder
import com.facebook.react.turbomodule.core.interfaces.TurboModule
import com.facebook.soloader.SoLoader
import kotlin.concurrent.Volatile

/**
 * This is the main class and entry point for TurboModules. Note that this is a hybrid class, and
 * has a C++ counterpart This class installs the JSI bindings. It also implements the method to get
 * a Java module, that the C++ counterpart calls.
 */
@OptIn(FrameworkAPI::class)
public class TurboModuleManager(
    runtimeExecutor: RuntimeExecutor,
    private val delegate: TurboModuleManagerDelegate?,
    jsCallInvokerHolder: CallInvokerHolder,
    nativeMethodCallInvokerHolder: NativeMethodCallInvokerHolder,
) : TurboModuleRegistry {

  public override val eagerInitModuleNames: List<String>
  private val turboModuleProvider: ModuleProvider
  private val legacyModuleProvider: ModuleProvider

  // Prevents the creation of new TurboModules once cleanup as been initiated.
  private val moduleCleanupLock = Object()

  @GuardedBy("moduleCleanupLock") private var moduleCleanupStarted = false

  // List of TurboModules that have been, or are currently being, instantiated
  @GuardedBy("moduleCleanupLock") private val moduleHolders = mutableMapOf<String, ModuleHolder>()

  @Suppress("NoHungarianNotation")
  @DoNotStrip
  private val mHybridData: HybridData =
      initHybrid(
          jsCallInvokerHolder as CallInvokerHolderImpl,
          nativeMethodCallInvokerHolder as NativeMethodCallInvokerHolderImpl,
          delegate,
      )

  init {

    dispatchJSBindingInstall(runtimeExecutor)

    eagerInitModuleNames = delegate?.getEagerInitModuleNames() ?: emptyList()

    val nullProvider = ModuleProvider { _: String -> null }

    turboModuleProvider =
        if (delegate == null) nullProvider
        else
            ModuleProvider { moduleName: String -> delegate.getModule(moduleName) as NativeModule? }

    legacyModuleProvider =
        if (delegate == null) nullProvider
        else
            ModuleProvider { moduleName: String ->
              val nativeModule = delegate.getLegacyModule(moduleName)
              if (nativeModule != null) {
                // TurboModuleManagerDelegate.getLegacyModule must never return a TurboModule
                require(nativeModule !is TurboModule) {
                  "NativeModule \"$moduleName\" is a TurboModule"
                }
                return@ModuleProvider nativeModule
              }
              null
            }
  }

  private fun isTurboModule(moduleName: String): Boolean =
      delegate?.unstable_isModuleRegistered(moduleName) == true

  private fun isLegacyModule(moduleName: String): Boolean =
      delegate?.unstable_isLegacyModuleRegistered(moduleName) == true

  // used from TurboModuleManager.cpp
  @Suppress("unused")
  @DoNotStrip
  private fun getLegacyJavaModule(moduleName: String): NativeModule? {
    /*
     * This API is invoked from global.nativeModuleProxy.
     * Only call getModule if the native module is a legacy module.
     */
    if (!isLegacyModule(moduleName)) {
      return null
    }

    val module = getModule(moduleName)
    return if (module !is TurboModule) module else null
  }

  // used from TurboModuleManager.cpp
  @Suppress("unused")
  @DoNotStrip
  private fun getTurboJavaModule(moduleName: String): TurboModule? {
    /*
     * This API is invoked from global.__turboModuleProxy.
     * Only call getModule if the native module is a turbo module.
     */
    if (!isTurboModule(moduleName)) {
      return null
    }

    val module = getModule(moduleName)
    return if (module is TurboModule) module else null
  }

  /**
   * Return the NativeModule instance that corresponds to the provided moduleName.
   *
   * This method: - Creates and initializes the module if it doesn't already exist. - Returns null
   * after TurboModuleManager has been torn down.
   */
  override fun getModule(moduleName: String): NativeModule? {
    val moduleHolder: ModuleHolder?

    synchronized(moduleCleanupLock) {
      if (moduleCleanupStarted) {
        /*
         * Always return null after cleanup has started, so that getNativeModule(moduleName) returns null.
         */
        FLog.e(
            TAG,
            "getModule(): Tried to get module \"%s\", but TurboModuleManager was tearing down (legacy: %b, turbo: %b)",
            moduleName,
            isLegacyModule(moduleName),
            isTurboModule(moduleName),
        )
        return null
      }
      /*
       * TODO(T64619790): Should we populate moduleHolders ahead of time, to avoid having
       * * to control concurrent access to it?
       */
      if (!moduleHolders.containsKey(moduleName)) {
        moduleHolders[moduleName] = ModuleHolder()
      }
      moduleHolder = moduleHolders[moduleName]
    }

    if (moduleHolder == null) {
      FLog.e(TAG, "getModule(): Tried to get module \"%s\", but moduleHolder was null", moduleName)
      return null
    }

    TurboModulePerfLogger.moduleCreateStart(moduleName, moduleHolder.moduleId)
    val module = getOrCreateModule(moduleName, moduleHolder, true)

    if (module != null) {
      TurboModulePerfLogger.moduleCreateEnd(moduleName, moduleHolder.moduleId)
    } else {
      TurboModulePerfLogger.moduleCreateFail(moduleName, moduleHolder.moduleId)
    }

    return module
  }

  /**
   * Given a ModuleHolder, and the TurboModule's moduleName, return the TurboModule instance.
   *
   * Use the ModuleHolder to ensure that if n threads race to create TurboModule x, then only the
   * first thread creates x. All n - 1 other threads wait until the x is created and initialized.
   */
  private fun getOrCreateModule(
      moduleName: String,
      moduleHolder: ModuleHolder,
      shouldPerfLog: Boolean,
  ): NativeModule? {
    var shouldCreateModule = false

    synchronized(moduleHolder) {
      if (moduleHolder.isDoneCreatingModule) {
        if (shouldPerfLog) {
          TurboModulePerfLogger.moduleCreateCacheHit(moduleName, moduleHolder.moduleId)
        }

        return moduleHolder.module
      }
      if (!moduleHolder.isCreatingModule) {
        // Only one thread gets here
        shouldCreateModule = true
        moduleHolder.startCreatingModule()
      }
    }

    if (shouldCreateModule) {
      TurboModulePerfLogger.moduleCreateConstructStart(moduleName, moduleHolder.moduleId)
      var nativeModule = turboModuleProvider.getModule(moduleName)

      if (nativeModule == null) {
        nativeModule = legacyModuleProvider.getModule(moduleName)
      }

      TurboModulePerfLogger.moduleCreateConstructEnd(moduleName, moduleHolder.moduleId)
      TurboModulePerfLogger.moduleCreateSetUpStart(moduleName, moduleHolder.moduleId)

      if (nativeModule != null) {
        synchronized(moduleHolder) { moduleHolder.module = nativeModule }

        /*
         * TurboModuleManager is initialized after ReactApplicationContext has been set up.
         * NativeModules should be initialized after ReactApplicationContext has been set up.
         * Therefore, we should initialize on the TurboModule now.
         */
        nativeModule.initialize()
      } else {
        FLog.e(
            TAG,
            "getOrCreateModule(): Unable to create module \"%s\" (legacy: %b, turbo: %b)",
            moduleName,
            isLegacyModule(moduleName),
            isTurboModule(moduleName),
        )
      }

      TurboModulePerfLogger.moduleCreateSetUpEnd(moduleName, moduleHolder.moduleId)
      synchronized(moduleHolder) {
        moduleHolder.endCreatingModule()
        (moduleHolder as Object).notifyAll()
      }

      return nativeModule
    }

    synchronized(moduleHolder) {
      var wasInterrupted = false
      while (moduleHolder.isCreatingModule) {
        try {
          // Wait until TurboModule is created and initialized
          (moduleHolder as Object).wait()
        } catch (e: InterruptedException) {
          wasInterrupted = true
        }
      }

      if (wasInterrupted) {
        /*
         * TurboModules should ideally be quick to create and initialize. Therefore,
         * we wait until the TurboModule is done initializing before re-interrupting the
         * current thread.
         */
        Thread.currentThread().interrupt()
      }
      return moduleHolder.module
    }
  }

  public override val modules: Collection<NativeModule>
    get() {
      val holders = synchronized(moduleCleanupLock) { this.moduleHolders.values.toList() }
      val moduleList = holders.mapNotNull { holder -> synchronized(holders) { holder.module } }
      return moduleList
    }

  override fun hasModule(moduleName: String): Boolean {
    val moduleHolder = synchronized(moduleCleanupLock) { moduleHolders[moduleName] ?: return false }
    return synchronized(moduleHolder) { moduleHolder.module != null }
  }

  private external fun initHybrid(
      jsCallInvokerHolder: CallInvokerHolderImpl,
      nativeMethodCallInvoker: NativeMethodCallInvokerHolderImpl,
      tmmDelegate: TurboModuleManagerDelegate?,
  ): HybridData

  private external fun dispatchJSBindingInstall(runtimeExecutor: RuntimeExecutor)

  override fun invalidate() {
    /*
     * Halt the production of new TurboModules.
     *
     * <p>After this point, mModuleHolders will not be accessed by TurboModuleManager.
     * Therefore, it won't be modified.
     *
     * <p>The ModuleHolders in mModuleHolders, however, can still be populated with newly
     * created TurboModules.
     */
    synchronized(moduleCleanupLock) { moduleCleanupStarted = true }

    for ((moduleName, moduleHolder) in moduleHolders) {
      /**
       * ReactNative could start tearing down before this particular TurboModule has been fully
       * initialized. In this case, we should wait for initialization to complete, before destroying
       * the TurboModule.
       */
      val nativeModule = getOrCreateModule(moduleName, moduleHolder, false)

      nativeModule?.invalidate()
    }

    moduleHolders.clear()

    // Delete the native part of this hybrid class.
    mHybridData.resetNative()
  }

  private class ModuleHolder {
    @Volatile var module: NativeModule? = null

    @Volatile
    var isCreatingModule: Boolean = false
      private set

    @Volatile
    var isDoneCreatingModule: Boolean = false
      private set

    @Volatile
    var moduleId: Int
      private set

    init {
      moduleId = holderCount
      holderCount += 1
    }

    fun startCreatingModule() {
      isCreatingModule = true
    }

    fun endCreatingModule() {
      isCreatingModule = false
      isDoneCreatingModule = true
    }

    companion object {
      @Volatile private var holderCount = 0
    }
  }

  private fun interface ModuleProvider {
    fun getModule(name: String): NativeModule?
  }

  public companion object {
    private const val TAG = "TurboModuleManager"

    init {
      SoLoader.loadLibrary("turbomodulejsijni")
    }

    // used from TurboModuleManager.cpp
    @JvmStatic
    @Suppress("unused")
    @DoNotStrip
    private fun getMethodDescriptorsFromModule(
        module: NativeModule
    ): List<TurboModuleInteropUtils.MethodDescriptor> =
        TurboModuleInteropUtils.getMethodDescriptorsFromModule(module)
  }
}
