/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.react.BaseReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.ClassFinder
import com.facebook.react.devsupport.LogBoxModule
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.ExceptionsManagerModule
import com.facebook.react.modules.core.HeadlessJsTaskSupportModule
import com.facebook.react.modules.debug.DevMenuModule
import com.facebook.react.modules.debug.DevSettingsModule
import com.facebook.react.modules.debug.SourceCodeModule
import com.facebook.react.modules.deviceinfo.DeviceInfoModule
import com.facebook.react.modules.systeminfo.AndroidInfoModule
import java.util.HashMap

@ReactModuleList(
    nativeModules =
        [
            AndroidInfoModule::class,
            DeviceInfoModule::class,
            DevMenuModule::class,
            DevSettingsModule::class,
            SourceCodeModule::class,
            LogBoxModule::class,
            DeviceEventManagerModule::class,
            ExceptionsManagerModule::class,
            HeadlessJsTaskSupportModule::class,
        ]
)
internal class CoreReactPackage(
    private val devSupportManager: DevSupportManager,
    private val hardwareBackBtnHandler: DefaultHardwareBackBtnHandler,
) : BaseReactPackage() {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      when (name) {
        AndroidInfoModule.NAME -> AndroidInfoModule(reactContext)
        DeviceInfoModule.NAME -> DeviceInfoModule(reactContext)
        SourceCodeModule.NAME -> SourceCodeModule(reactContext)
        DevMenuModule.NAME -> DevMenuModule(reactContext, devSupportManager)
        DevSettingsModule.NAME -> DevSettingsModule(reactContext, devSupportManager)
        DeviceEventManagerModule.NAME ->
            DeviceEventManagerModule(reactContext, hardwareBackBtnHandler)

        LogBoxModule.NAME -> LogBoxModule(reactContext, devSupportManager)
        ExceptionsManagerModule.NAME -> ExceptionsManagerModule(devSupportManager)
        HeadlessJsTaskSupportModule.NAME -> HeadlessJsTaskSupportModule(reactContext)
        else -> null
      }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass()
    }
    try {
      val reactModuleInfoProviderClass =
          ClassFinder.findClass("${CoreReactPackage::class.java.name}$\$ReactModuleInfoProvider")
      @Suppress("DEPRECATION")
      return reactModuleInfoProviderClass?.newInstance() as? ReactModuleInfoProvider
          ?: fallbackForMissingClass()
    } catch (e: Exception) {
      when (e) {
        is ClassNotFoundException -> return fallbackForMissingClass()
        is InstantiationException,
        is IllegalAccessException ->
            throw RuntimeException(
                "No ReactModuleInfoProvider for ${CoreReactPackage::class.java.name}$\$ReactModuleInfoProvider",
                e,
            )
        else -> throw e
      }
    }
  }

  private fun fallbackForMissingClass(): ReactModuleInfoProvider {
    // In OSS case, the annotation processor does not run. We fall back on creating this byhand
    val moduleList: Array<Class<out NativeModule>> =
        arrayOf<Class<out NativeModule>>(
            AndroidInfoModule::class.java,
            DeviceInfoModule::class.java,
            SourceCodeModule::class.java,
            DevMenuModule::class.java,
            DevSettingsModule::class.java,
            DeviceEventManagerModule::class.java,
            LogBoxModule::class.java,
            ExceptionsManagerModule::class.java,
            HeadlessJsTaskSupportModule::class.java,
        )
    val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = HashMap()
    for (moduleClass in moduleList) {
      val reactModule = moduleClass.getAnnotation(ReactModule::class.java)
      if (reactModule != null) {
        reactModuleInfoMap[reactModule.name] =
            ReactModuleInfo(
                reactModule.name,
                moduleClass.name,
                reactModule.canOverrideExistingModule,
                reactModule.needsEagerInit,
                reactModule.isCxxModule,
                ReactModuleInfo.classIsTurboModule(moduleClass),
            )
      }
    }
    return ReactModuleInfoProvider { reactModuleInfoMap }
  }
}
