/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shell

import android.annotation.SuppressLint
import com.facebook.react.BaseReactPackage
import com.facebook.react.ViewManagerOnDemandReactPackage
import com.facebook.react.animated.NativeAnimatedModule
import com.facebook.react.bridge.ModuleSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.common.ClassFinder
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfo.Companion.classIsTurboModule
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.modules.accessibilityinfo.AccessibilityInfoModule
import com.facebook.react.modules.appearance.AppearanceModule
import com.facebook.react.modules.appstate.AppStateModule
import com.facebook.react.modules.blob.BlobModule
import com.facebook.react.modules.blob.FileReaderModule
import com.facebook.react.modules.camera.ImageStoreManager
import com.facebook.react.modules.clipboard.ClipboardModule
import com.facebook.react.modules.devloading.DevLoadingModule
import com.facebook.react.modules.devtoolsruntimesettings.ReactDevToolsRuntimeSettingsModule
import com.facebook.react.modules.dialog.DialogModule
import com.facebook.react.modules.fresco.FrescoModule
import com.facebook.react.modules.i18nmanager.I18nManagerModule
import com.facebook.react.modules.image.ImageLoaderModule
import com.facebook.react.modules.intent.IntentModule
import com.facebook.react.modules.network.NetworkingModule
import com.facebook.react.modules.permissions.PermissionsModule
import com.facebook.react.modules.reactdevtoolssettings.ReactDevToolsSettingsManagerModule
import com.facebook.react.modules.share.ShareModule
import com.facebook.react.modules.sound.SoundManagerModule
import com.facebook.react.modules.statusbar.StatusBarModule
import com.facebook.react.modules.toast.ToastModule
import com.facebook.react.modules.vibration.VibrationModule
import com.facebook.react.modules.websocket.WebSocketModule
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.views.drawer.ReactDrawerLayoutManager
import com.facebook.react.views.image.ReactImageManager
import com.facebook.react.views.modal.ReactModalHostManager
import com.facebook.react.views.progressbar.ReactProgressBarViewManager
import com.facebook.react.views.safeareaview.ReactSafeAreaViewManager
import com.facebook.react.views.scroll.ReactHorizontalScrollContainerViewManager
import com.facebook.react.views.scroll.ReactHorizontalScrollViewManager
import com.facebook.react.views.scroll.ReactNestedScrollViewManager
import com.facebook.react.views.scroll.ReactScrollViewManager
import com.facebook.react.views.swiperefresh.SwipeRefreshLayoutManager
import com.facebook.react.views.switchview.ReactSwitchManager
import com.facebook.react.views.text.PreparedLayoutTextViewManager
import com.facebook.react.views.text.ReactTextViewManager
import com.facebook.react.views.text.SelectableTextViewManager
import com.facebook.react.views.textinput.ReactTextInputManager
import com.facebook.react.views.unimplementedview.ReactUnimplementedViewManager
import com.facebook.react.views.view.ReactViewManager
import com.facebook.react.views.virtual.view.ReactVirtualViewManager

/**
 * Package defining basic modules and view managers.
 *
 * @param config configuration for the Main package.
 */
@ReactModuleList(
    nativeModules =
        [
            AccessibilityInfoModule::class,
            AppearanceModule::class,
            AppStateModule::class,
            BlobModule::class,
            DevLoadingModule::class,
            FileReaderModule::class,
            ClipboardModule::class,
            DialogModule::class,
            FrescoModule::class,
            I18nManagerModule::class,
            ImageLoaderModule::class,
            ImageStoreManager::class,
            IntentModule::class,
            NativeAnimatedModule::class,
            NetworkingModule::class,
            PermissionsModule::class,
            ReactDevToolsSettingsManagerModule::class,
            ReactDevToolsRuntimeSettingsModule::class,
            ShareModule::class,
            SoundManagerModule::class,
            StatusBarModule::class,
            ToastModule::class,
            VibrationModule::class,
            WebSocketModule::class,
        ]
)
@OptIn(UnstableReactNativeAPI::class)
public class MainReactPackage
@JvmOverloads
constructor(private val config: MainPackageConfig? = null) :
    BaseReactPackage(), ViewManagerOnDemandReactPackage {

  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? =
      when (name) {
        AccessibilityInfoModule.NAME -> AccessibilityInfoModule(reactContext)
        AppearanceModule.NAME -> AppearanceModule(reactContext)
        AppStateModule.NAME -> AppStateModule(reactContext)
        BlobModule.NAME -> BlobModule(reactContext)
        DevLoadingModule.NAME -> DevLoadingModule(reactContext)
        FileReaderModule.NAME -> FileReaderModule(reactContext)
        ClipboardModule.NAME -> ClipboardModule(reactContext)
        DialogModule.NAME -> DialogModule(reactContext)
        FrescoModule.NAME -> FrescoModule(reactContext, true, config?.frescoConfig)
        I18nManagerModule.NAME -> I18nManagerModule(reactContext)
        ImageLoaderModule.NAME -> ImageLoaderModule(reactContext)
        ImageStoreManager.NAME -> ImageStoreManager(reactContext)
        IntentModule.NAME -> IntentModule(reactContext)
        NativeAnimatedModule.NAME ->
            if (ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) null
            else NativeAnimatedModule(reactContext)
        NetworkingModule.NAME -> NetworkingModule(reactContext)
        PermissionsModule.NAME -> PermissionsModule(reactContext)
        ShareModule.NAME -> ShareModule(reactContext)
        StatusBarModule.NAME -> StatusBarModule(reactContext)
        SoundManagerModule.NAME -> SoundManagerModule(reactContext)
        ToastModule.NAME -> ToastModule(reactContext)
        VibrationModule.NAME -> VibrationModule(reactContext)
        WebSocketModule.NAME -> WebSocketModule(reactContext)
        ReactDevToolsSettingsManagerModule.NAME -> ReactDevToolsSettingsManagerModule(reactContext)
        ReactDevToolsRuntimeSettingsModule.NAME -> ReactDevToolsRuntimeSettingsModule(reactContext)
        else -> null
      }

  @Suppress("DEPRECATION")
  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
      listOf(
          ReactDrawerLayoutManager(),
          ReactHorizontalScrollViewManager(),
          ReactHorizontalScrollContainerViewManager(),
          ReactProgressBarViewManager(),
          if (ReactNativeFeatureFlags.useNestedScrollViewAndroid()) ReactNestedScrollViewManager()
          else ReactScrollViewManager(),
          ReactSwitchManager(),
          ReactSafeAreaViewManager(),
          SwipeRefreshLayoutManager(),
          // Native equivalents
          ReactImageManager(),
          ReactModalHostManager(),
          ReactTextInputManager(),
          if (ReactNativeFeatureFlags.enablePreparedTextLayout()) PreparedLayoutTextViewManager()
          else ReactTextViewManager(),
          SelectableTextViewManager(),
          ReactViewManager(),
          ReactVirtualViewManager(),
          ReactUnimplementedViewManager(),
      )

  /**
   * A map of view managers that should be registered with
   * [com.facebook.react.uimanager.UIManagerModule]
   */
  @Suppress("DEPRECATION")
  @SuppressLint("VisibleForTests")
  public val viewManagersMap: Map<String, ModuleSpec> =
      mapOf(
          ReactDrawerLayoutManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactDrawerLayoutManager() },
          ReactHorizontalScrollViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactHorizontalScrollViewManager() },
          ReactHorizontalScrollContainerViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactHorizontalScrollContainerViewManager() },
          ReactProgressBarViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactProgressBarViewManager() },
          ReactSafeAreaViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactSafeAreaViewManager() },
          ReactScrollViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec {
                if (ReactNativeFeatureFlags.useNestedScrollViewAndroid())
                    ReactNestedScrollViewManager()
                else ReactScrollViewManager()
              },
          ReactSwitchManager.REACT_CLASS to ModuleSpec.viewManagerSpec { ReactSwitchManager() },
          SwipeRefreshLayoutManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { SwipeRefreshLayoutManager() },
          ReactImageManager.REACT_CLASS to ModuleSpec.viewManagerSpec { ReactImageManager() },
          ReactModalHostManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactModalHostManager() },
          ReactTextInputManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactTextInputManager() },
          ReactTextViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec {
                if (ReactNativeFeatureFlags.enablePreparedTextLayout())
                    PreparedLayoutTextViewManager()
                else ReactTextViewManager()
              },
          SelectableTextViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { SelectableTextViewManager() },
          ReactViewManager.REACT_CLASS to ModuleSpec.viewManagerSpec { ReactViewManager() },
          ReactVirtualViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactVirtualViewManager() },
          ReactUnimplementedViewManager.REACT_CLASS to
              ModuleSpec.viewManagerSpec { ReactUnimplementedViewManager() },
      )

  public override fun getViewManagers(reactContext: ReactApplicationContext): List<ModuleSpec> =
      viewManagersMap.values.toList()

  override fun getViewManagerNames(reactContext: ReactApplicationContext): Collection<String> =
      viewManagersMap.keys

  override fun createViewManager(
      reactContext: ReactApplicationContext,
      viewManagerName: String,
  ): ViewManager<*, *>? {
    val spec = viewManagersMap[viewManagerName]
    return spec?.provider?.get() as? ViewManager<*, *>
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    if (!ClassFinder.canLoadClassesFromAnnotationProcessors()) {
      return fallbackForMissingClass()
    }
    try {
      val reactModuleInfoProviderClass =
          ClassFinder.findClass(
              "com.facebook.react.shell.MainReactPackage$\$ReactModuleInfoProvider"
          )
      @Suppress("DEPRECATION")
      return reactModuleInfoProviderClass?.newInstance() as? ReactModuleInfoProvider
          ?: fallbackForMissingClass()
    } catch (e: ClassNotFoundException) {
      return fallbackForMissingClass()
    } catch (e: InstantiationException) {
      throw RuntimeException(
          "No ReactModuleInfoProvider for MainReactPackage$\$ReactModuleInfoProvider",
          e,
      )
    } catch (e: IllegalAccessException) {
      throw RuntimeException(
          "No ReactModuleInfoProvider for MainReactPackage$\$ReactModuleInfoProvider",
          e,
      )
    }
  }

  private fun fallbackForMissingClass(): ReactModuleInfoProvider {
    // In the OSS case, the annotation processor does not run.
    // We fall back to creating this by hand
    val moduleList: Array<Class<*>> =
        arrayOf(
                AccessibilityInfoModule::class.java,
                AppearanceModule::class.java,
                AppStateModule::class.java,
                BlobModule::class.java,
                DevLoadingModule::class.java,
                FileReaderModule::class.java,
                ClipboardModule::class.java,
                DialogModule::class.java,
                FrescoModule::class.java,
                I18nManagerModule::class.java,
                ImageLoaderModule::class.java,
                ImageStoreManager::class.java,
                IntentModule::class.java,
                if (ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()) null
                else NativeAnimatedModule::class.java,
                NetworkingModule::class.java,
                PermissionsModule::class.java,
                ReactDevToolsSettingsManagerModule::class.java,
                ReactDevToolsRuntimeSettingsModule::class.java,
                ShareModule::class.java,
                StatusBarModule::class.java,
                SoundManagerModule::class.java,
                ToastModule::class.java,
                VibrationModule::class.java,
                WebSocketModule::class.java,
            )
            .filterNotNull()
            .toTypedArray()

    val moduleMap =
        moduleList
            .filter { it.isAnnotationPresent(ReactModule::class.java) }
            .associate { moduleClass ->
              val reactModule = checkNotNull(moduleClass.getAnnotation(ReactModule::class.java))
              reactModule.name to
                  ReactModuleInfo(
                      reactModule.name,
                      moduleClass.name,
                      reactModule.canOverrideExistingModule,
                      reactModule.needsEagerInit,
                      reactModule.isCxxModule,
                      classIsTurboModule(moduleClass),
                  )
            }
    return ReactModuleInfoProvider { moduleMap }
  }
}
