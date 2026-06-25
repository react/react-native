/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.bridge

import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.infer.annotation.Assertions
import com.facebook.infer.annotation.ThreadConfined
import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.react.bridge.queue.ReactQueueConfiguration
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.annotations.VisibleForTesting
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.turbomodule.core.interfaces.CallInvokerHolder

/**
 * This is the bridge-specific concrete subclass of ReactContext. ReactContext has many methods that
 * delegate to the react instance. This subclass implements those methods, by delegating to the
 * CatalystInstance. If you need to create a ReactContext within an "bridge context", please create
 * BridgeReactContext.
 *
 * @deprecated This class is deprecated in the New Architecture and will be replaced by
 *   [com.facebook.react.runtime.BridgelessReactContext]
 */
@VisibleForTesting
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    "This class is part of Legacy Architecture and will be removed in a future release",
    replaceWith = ReplaceWith("BridgelessReactContext"),
)
@Suppress("DEPRECATION")
public open class BridgeReactContext(context: Context) : ReactApplicationContext(context) {

  /** Interface for emitting device events to JavaScript. */
  @DoNotStrip
  public interface RCTDeviceEventEmitter : JavaScriptModule {
    /** Emits an event with the given name and data to JavaScript. */
    public fun emit(eventName: String, data: Any?)
  }

  @Volatile private var mDestroyed: Boolean = false
  private var mCatalystInstance: CatalystInstance? = null

  /** Set and initialize CatalystInstance for this Context. This should be called exactly once. */
  public fun initializeWithInstance(catalystInstance: CatalystInstance) {
    requireNotNull(catalystInstance) { "CatalystInstance cannot be null." }
    if (mCatalystInstance != null) {
      throw IllegalStateException("ReactContext has been already initialized")
    }
    if (mDestroyed) {
      ReactSoftExceptionLogger.logSoftException(
          TAG,
          IllegalStateException("Cannot initialize ReactContext after it has been destroyed."),
      )
    }

    mCatalystInstance = catalystInstance

    val queueConfig: ReactQueueConfiguration = catalystInstance.reactQueueConfiguration
    initializeMessageQueueThreads(queueConfig)
    initializeInteropModules()
  }

  private fun raiseCatalystInstanceMissingException() {
    throw IllegalStateException(
        if (mDestroyed) LATE_NATIVE_MODULE_EXCEPTION_MESSAGE
        else EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE
    )
  }

  /**
   * Returns a handle to the specified JS module for the CatalystInstance associated with this
   * Context.
   */
  override fun <T : JavaScriptModule> getJSModule(jsInterface: Class<T>): T? {
    if (mCatalystInstance == null) {
      if (mDestroyed) {
        throw IllegalStateException(LATE_JS_ACCESS_EXCEPTION_MESSAGE)
      }
      throw IllegalStateException(EARLY_JS_ACCESS_EXCEPTION_MESSAGE)
    }
    mInteropModuleRegistry?.let { registry ->
      val jsModule = registry.getInteropModule(jsInterface)
      if (jsModule != null) {
        return jsModule
      }
    }
    return checkNotNull(mCatalystInstance).getJSModule(jsInterface)
  }

  override fun <T : NativeModule> hasNativeModule(nativeModuleInterface: Class<T>): Boolean {
    val catalystInstance =
        mCatalystInstance
            ?: run {
              raiseCatalystInstanceMissingException()
              error("unreachable")
            }
    return catalystInstance.hasNativeModule(nativeModuleInterface)
  }

  override fun getNativeModules(): Collection<NativeModule> {
    val catalystInstance =
        mCatalystInstance
            ?: run {
              raiseCatalystInstanceMissingException()
              error("unreachable")
            }
    return catalystInstance.nativeModules
  }

  /** Returns the instance of the specified module interface associated with this ReactContext. */
  override fun <T : NativeModule> getNativeModule(nativeModuleInterface: Class<T>): T? {
    val catalystInstance =
        mCatalystInstance
            ?: run {
              raiseCatalystInstanceMissingException()
              error("unreachable")
            }
    return catalystInstance.getNativeModule(nativeModuleInterface)
  }

  override fun getNativeModule(moduleName: String): NativeModule? {
    val catalystInstance =
        mCatalystInstance
            ?: run {
              raiseCatalystInstanceMissingException()
              error("unreachable")
            }
    return catalystInstance.getNativeModule(moduleName)
  }

  override fun getCatalystInstance(): CatalystInstance {
    return Assertions.assertNotNull(mCatalystInstance)
  }

  /**
   * This API has been deprecated due to naming consideration, please use [hasActiveReactInstance]
   * instead.
   */
  @Deprecated("Use hasActiveReactInstance() instead")
  override fun hasActiveCatalystInstance(): Boolean {
    return hasActiveReactInstance()
  }

  /** Returns true if there is a non-null, alive react native instance. */
  override fun hasActiveReactInstance(): Boolean {
    return mCatalystInstance?.isDestroyed == false
  }

  /**
   * This API has been deprecated due to naming consideration, please use [hasReactInstance]
   * instead.
   */
  @Deprecated("Use hasReactInstance() instead")
  override fun hasCatalystInstance(): Boolean {
    return mCatalystInstance != null
  }

  override fun hasReactInstance(): Boolean {
    return mCatalystInstance != null
  }

  /** Destroy this instance, making it unusable. */
  @ThreadConfined(ThreadConfined.UI)
  override fun destroy() {
    UiThreadUtil.assertOnUiThread()

    mDestroyed = true
    mCatalystInstance?.destroy()
  }

  /**
   * Passes the given exception to the current [JSExceptionHandler] if one exists, rethrowing
   * otherwise.
   */
  override fun handleException(e: Exception) {
    val catalystInstanceVariableExists = mCatalystInstance != null
    val isCatalystInstanceAlive = mCatalystInstance?.isDestroyed == false
    val jsExceptionHandler = getJSExceptionHandler()

    if (isCatalystInstanceAlive && jsExceptionHandler != null) {
      jsExceptionHandler.handleException(e)
    } else {
      FLog.e(
          ReactConstants.TAG,
          "Unable to handle Exception - catalystInstanceVariableExists: " +
              catalystInstanceVariableExists +
              " - isCatalystInstanceAlive: " +
              isCatalystInstanceAlive +
              " - hasExceptionHandler: " +
              (jsExceptionHandler != null),
          e,
      )
      throw IllegalStateException(e)
    }
  }

  /** @deprecated DO NOT USE, this method will be removed in the near future. */
  @Deprecated("DO NOT USE, this method will be removed in the near future.")
  override fun isBridgeless(): Boolean {
    return false
  }

  /**
   * Get the C pointer (as a long) to the JavaScriptCore context associated with this instance. Use
   * the following pattern to ensure that the JS context is not cleared while you are using it:
   * JavaScriptContextHolder jsContext = reactContext.getJavaScriptContextHolder()
   * synchronized(jsContext) { nativeThingNeedingJsContext(jsContext.get()); }
   */
  @FrameworkAPI
  @UnstableReactNativeAPI
  override fun getJavaScriptContextHolder(): JavaScriptContextHolder? {
    return mCatalystInstance?.javaScriptContextHolder
  }

  /**
   * Returns a hybrid object that contains a pointer to a JS CallInvoker, which is used to schedule
   * work on the JS Thread.
   */
  override fun getJSCallInvokerHolder(): CallInvokerHolder? {
    return mCatalystInstance?.jsCallInvokerHolder
  }

  /**
   * Get the UIManager for Fabric from the CatalystInstance.
   *
   * @return The UIManager when CatalystInstance is active.
   * @deprecated Do not use this method. Instead use [com.facebook.react.uimanager.UIManagerHelper]
   *   method [getUIManager] to get the UIManager instance from the current ReactContext.
   */
  @Deprecated("Use UIManagerHelper.getUIManager() instead")
  override fun getFabricUIManager(): UIManager? {
    return checkNotNull(mCatalystInstance).getFabricUIManager()
  }

  /**
   * Get the sourceURL for the JS bundle from the CatalystInstance. This method is needed for
   * compatibility with bridgeless mode, which has no CatalystInstance.
   *
   * @return The JS bundle URL set when the bundle was loaded
   */
  override fun getSourceURL(): String? {
    return mCatalystInstance?.sourceURL
  }

  /**
   * Register a JS segment after loading it from cache or server, make sure mCatalystInstance is
   * properly initialised and not null before calling.
   */
  override fun registerSegment(segmentId: Int, path: String, callback: Callback) {
    Assertions.assertNotNull(mCatalystInstance).registerSegment(segmentId, path)
    Assertions.assertNotNull(callback).invoke()
  }

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "BridgeReactContext",
          LegacyArchitectureLogLevel.ERROR,
      )
    }

    private const val TAG: String = "BridgeReactContext"

    private const val EARLY_JS_ACCESS_EXCEPTION_MESSAGE: String =
        "Tried to access a JS module before the React instance was fully set up. Calls to " +
            "ReactContext#getJSModule should only happen once initialize() has been called on your " +
            "native module."
    private const val LATE_JS_ACCESS_EXCEPTION_MESSAGE: String =
        "Tried to access a JS module after the React instance was destroyed."
    private const val EARLY_NATIVE_MODULE_EXCEPTION_MESSAGE: String =
        "Trying to call native module before CatalystInstance has been set!"
    private const val LATE_NATIVE_MODULE_EXCEPTION_MESSAGE: String =
        "Trying to call native module after CatalystInstance has been destroyed!"
  }

  override fun getRuntimeExecutor(): RuntimeExecutor? = mCatalystInstance?.runtimeExecutor
}
