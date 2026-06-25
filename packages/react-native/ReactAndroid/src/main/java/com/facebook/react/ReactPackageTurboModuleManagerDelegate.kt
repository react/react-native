/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import com.facebook.jni.HybridData
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.internal.turbomodule.core.TurboModuleManagerDelegate
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.turbomodule.core.interfaces.TurboModule

public abstract class ReactPackageTurboModuleManagerDelegate : TurboModuleManagerDelegate {
  internal fun interface ModuleProvider {
    fun getModule(moduleName: String): NativeModule?
  }

  private val moduleProviders = mutableListOf<ModuleProvider>()
  private val packageModuleInfos = mutableMapOf<ModuleProvider, Map<String, ReactModuleInfo>>()
  private val shouldEnableLegacyModuleInterop =
      ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
          ReactNativeNewArchitectureFeatureFlags.useTurboModuleInterop()

  protected constructor(
      reactApplicationContext: ReactApplicationContext,
      packages: List<ReactPackage>,
  ) : super() {
    initialize(reactApplicationContext, packages)
  }

  protected constructor(
      reactApplicationContext: ReactApplicationContext,
      packages: List<ReactPackage>,
      hybridData: HybridData,
  ) : super(hybridData) {
    initialize(reactApplicationContext, packages)
  }

  private fun initialize(
      reactApplicationContext: ReactApplicationContext,
      packages: List<ReactPackage>,
  ) {
    val applicationContext: ReactApplicationContext = reactApplicationContext
    for (reactPackage in packages) {
      if (reactPackage is BaseReactPackage) {
        val moduleProvider = ModuleProvider { moduleName: String ->
          reactPackage.getModule(moduleName, applicationContext)
        }
        moduleProviders.add(moduleProvider)
        packageModuleInfos[moduleProvider] =
            reactPackage.getReactModuleInfoProvider().getReactModuleInfos()
        continue
      }

      if (shouldSupportLegacyPackages()) {
        // TODO(T145105887): Output warnings that ReactPackage was used
        @Suppress("DEPRECATION")
        val nativeModules = reactPackage.createNativeModules(reactApplicationContext)

        val moduleMap: MutableMap<String, NativeModule> = mutableMapOf()
        val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = mutableMapOf()

        for (module in nativeModules) {
          val moduleClass: Class<out NativeModule> = module.javaClass
          val reactModule = moduleClass.getAnnotation(ReactModule::class.java)

          val moduleName = reactModule?.name ?: module.name

          @Suppress("DEPRECATION")
          val moduleInfo: ReactModuleInfo =
              if (reactModule != null)
                  ReactModuleInfo(
                      moduleName,
                      moduleClass.name,
                      reactModule.canOverrideExistingModule,
                      true,
                      false,
                      ReactModuleInfo.classIsTurboModule(moduleClass),
                  )
              else
                  ReactModuleInfo(
                      moduleName,
                      moduleClass.name,
                      module.canOverrideExistingModule(),
                      true,
                      false,
                      ReactModuleInfo.classIsTurboModule(moduleClass),
                  )

          reactModuleInfoMap[moduleName] = moduleInfo
          moduleMap[moduleName] = module
        }

        val moduleProvider = ModuleProvider { module -> moduleMap[module] }

        moduleProviders.add(moduleProvider)
        packageModuleInfos[moduleProvider] = reactModuleInfoMap
      }
    }
  }

  override fun getModule(moduleName: String): TurboModule? {
    var resolvedModule: NativeModule? = null

    for (moduleProvider in moduleProviders) {
      val moduleInfo: ReactModuleInfo? = packageModuleInfos[moduleProvider]?.get(moduleName)
      if (
          moduleInfo?.isTurboModule == true &&
              (resolvedModule == null || moduleInfo.canOverrideExistingModule)
      ) {
        val module = moduleProvider.getModule(moduleName)
        if (module != null) {
          resolvedModule = module
        }
      }
    }

    // Skip TurboModule-incompatible modules
    val isLegacyModule = resolvedModule !is TurboModule
    if (isLegacyModule) {
      return null
    }

    return resolvedModule as TurboModule
  }

  override fun unstable_isModuleRegistered(moduleName: String): Boolean {
    for (moduleProvider in moduleProviders) {
      val moduleInfo: ReactModuleInfo? = packageModuleInfos[moduleProvider]?.get(moduleName)
      if (moduleInfo?.isTurboModule == true) {
        return true
      }
    }
    return false
  }

  override fun unstable_isLegacyModuleRegistered(moduleName: String): Boolean {
    for (moduleProvider in moduleProviders) {
      val moduleInfo: ReactModuleInfo? = packageModuleInfos[moduleProvider]?.get(moduleName)
      if (moduleInfo?.isTurboModule == false) {
        return true
      }
    }
    return false
  }

  override fun getLegacyModule(moduleName: String): NativeModule? {
    if (!shouldEnableLegacyModuleInterop) {
      return null
    }

    var resolvedModule: NativeModule? = null

    for (moduleProvider in moduleProviders) {
      val moduleInfo: ReactModuleInfo? = packageModuleInfos[moduleProvider]?.get(moduleName)
      if (
          moduleInfo?.isTurboModule == false &&
              (resolvedModule == null || moduleInfo.canOverrideExistingModule)
      ) {
        val module = moduleProvider.getModule(moduleName)
        if (module != null) {
          resolvedModule = module
        }
      }
    }

    // Skip TurboModule-compatible modules
    val isLegacyModule = resolvedModule !is TurboModule
    if (!isLegacyModule) {
      return null
    }

    return resolvedModule
  }

  override fun getEagerInitModuleNames(): List<String> = buildList {
    for (moduleProvider in moduleProviders) {
      for (moduleInfo in packageModuleInfos[moduleProvider]?.values ?: emptyList()) {
        if (moduleInfo.isTurboModule && moduleInfo.needsEagerInit) {
          add(moduleInfo.name)
        }
      }
    }
  }

  private fun shouldSupportLegacyPackages(): Boolean = shouldEnableLegacyModuleInterop

  public abstract class Builder {
    private var packages: List<ReactPackage>? = null
    private var context: ReactApplicationContext? = null

    public fun setPackages(packages: List<ReactPackage>): Builder {
      this.packages = packages.toList()
      return this
    }

    public fun setReactApplicationContext(context: ReactApplicationContext?): Builder {
      this.context = context
      return this
    }

    protected abstract fun build(
        context: ReactApplicationContext,
        packages: List<ReactPackage>,
    ): ReactPackageTurboModuleManagerDelegate

    public fun build(): ReactPackageTurboModuleManagerDelegate {
      val nonNullContext =
          requireNotNull(context) {
            "The ReactApplicationContext must be provided to create ReactPackageTurboModuleManagerDelegate"
          }
      val nonNullPackages =
          requireNotNull(packages) {
            "A set of ReactPackages must be provided to create ReactPackageTurboModuleManagerDelegate"
          }
      return build(nonNullContext, nonNullPackages)
    }
  }
}
