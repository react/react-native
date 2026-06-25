/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react

import android.annotation.SuppressLint
import android.app.Application
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.internal.ChoreographerProvider

/**
 * Simple class that holds an instance of [ReactInstanceManager]. This can be used in your
 * [Application] class (see [ReactApplication]), or as a static field.
 *
 * @deprecated This class will be replaced by com.facebook.react.ReactHost in the New Architecture.
 */
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@SuppressLint("DeprecatedClass", "DeprecatedInterface")
public abstract class ReactNativeHost protected constructor(private val mApplication: Application) {

  private var mReactInstanceManager: ReactInstanceManager? = null

  /**
   * Get the current [ReactInstanceManager] instance, or create one.
   *
   * NOTE: Care must be taken when storing this reference outside of the ReactNativeHost lifecycle.
   * The ReactInstanceManager will be invalidated during [clear], and may not be used again
   * afterwards.
   */
  public open val reactInstanceManager: ReactInstanceManager
    @Synchronized
    get() {
      if (mReactInstanceManager == null) {
        ReactMarker.logMarker(ReactMarkerConstants.INIT_REACT_RUNTIME_START)
        ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_START)
        mReactInstanceManager = createReactInstanceManager()
        ReactMarker.logMarker(ReactMarkerConstants.GET_REACT_INSTANCE_MANAGER_END)
      }
      return mReactInstanceManager!!
    }

  /**
   * Get whether this holder contains a [ReactInstanceManager] instance, or not. I.e. if
   * [getReactInstanceManager] has been called at least once since this object was created or
   * [clear] was called.
   */
  @Synchronized public open fun hasInstance(): Boolean = mReactInstanceManager != null

  /**
   * Destroy the current instance and invalidate the internal ReactInstanceManager, reclaiming its
   * resources and preventing it from being reused.
   */
  @Synchronized
  public open fun clear() {
    mReactInstanceManager?.invalidate()
    mReactInstanceManager = null
  }

  protected open fun createReactInstanceManager(): ReactInstanceManager {
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_START)
    val builder = getBaseReactInstanceManagerBuilder()
    ReactMarker.logMarker(ReactMarkerConstants.BUILD_REACT_INSTANCE_MANAGER_END)
    return builder.build()
  }

  protected open fun getBaseReactInstanceManagerBuilder(): ReactInstanceManagerBuilder {
    val builder =
        ReactInstanceManager.builder()
            .setApplication(mApplication)
            .setJSMainModulePath(getJSMainModuleName())
            .setUseDeveloperSupport(getUseDeveloperSupport())
            .setDevSupportManagerFactory(getDevSupportManagerFactory())
            .setDevLoadingViewManager(getDevLoadingViewManager())
            .setRequireActivity(getShouldRequireActivity())
            .setSurfaceDelegateFactory(getSurfaceDelegateFactory())
            .setJSExceptionHandler(getJSExceptionHandler())
            .setLazyViewManagersEnabled(getLazyViewManagersEnabled())
            .setRedBoxHandler(getRedBoxHandler())
            .setJavaScriptExecutorFactory(getJavaScriptExecutorFactory())
            .setUIManagerProvider(getUIManagerProvider())
            .setInitialLifecycleState(LifecycleState.BEFORE_CREATE)
            .setReactPackageTurboModuleManagerDelegateBuilder(
                getReactPackageTurboModuleManagerDelegateBuilder()
            )
            .setChoreographerProvider(getChoreographerProvider())
            .setPausedInDebuggerOverlayManager(getPausedInDebuggerOverlayManager())

    for (reactPackage in getPackages()) {
      builder.addPackage(reactPackage)
    }

    val jsBundleFile = getJSBundleFile()
    if (jsBundleFile != null) {
      builder.setJSBundleFile(jsBundleFile)
    } else {
      builder.setBundleAssetName(
          com.facebook.infer.annotation.Assertions.assertNotNull(getBundleAssetName())
      )
    }
    return builder
  }

  /** Get the [RedBoxHandler] to send RedBox-related callbacks to. */
  protected open fun getRedBoxHandler(): RedBoxHandler? = null

  protected open fun getJSExceptionHandler(): JSExceptionHandler? = null

  /** Get the [JavaScriptExecutorFactory]. Override this to use a custom Executor. */
  protected open fun getJavaScriptExecutorFactory(): JavaScriptExecutorFactory? = null

  protected open fun getReactPackageTurboModuleManagerDelegateBuilder():
      ReactPackageTurboModuleManagerDelegate.Builder? = null

  protected fun getApplication(): Application = mApplication

  protected open fun getUIManagerProvider(): UIManagerProvider? = UIManagerProvider { null }

  /** Returns whether or not to treat it as normal if Activity is null. */
  public open fun getShouldRequireActivity(): Boolean = true

  /**
   * Returns whether view managers should be created lazily. See [ViewManagerOnDemandReactPackage]
   * for details.
   *
   * @experimental
   */
  public open fun getLazyViewManagersEnabled(): Boolean = false

  /**
   * Return the [SurfaceDelegateFactory] used by NativeModules to get access to a SurfaceDelegate to
   * interact with a surface. By default in the mobile platform the SurfaceDelegate it returns is
   * null, and the NativeModule needs to implement its own SurfaceDelegate to decide how it would
   * interact with its own container surface.
   */
  public open fun getSurfaceDelegateFactory(): SurfaceDelegateFactory = SurfaceDelegateFactory {
    null
  }

  /** Get the [DevLoadingViewManager]. Override this to use a custom dev loading view manager. */
  protected open fun getDevLoadingViewManager(): DevLoadingViewManager? = null

  protected open fun getPausedInDebuggerOverlayManager(): PausedInDebuggerOverlayManager? = null

  /**
   * Returns the name of the main module. Determines the URL used to fetch the JS bundle from Metro.
   * It is only used when dev support is enabled. This is the first file to be executed once the
   * [ReactInstanceManager] is created. e.g. "index.android"
   */
  protected open fun getJSMainModuleName(): String = "index.android"

  /**
   * Returns a custom path of the bundle file. This is used in cases the bundle should be loaded
   * from a custom path. By default it is loaded from Android assets, from a path specified by
   * [getBundleAssetName]. e.g. "file://sdcard/myapp_cache/index.android.bundle"
   */
  protected open fun getJSBundleFile(): String? = null

  /**
   * Returns the name of the bundle in assets. If this is null, and no file path is specified for
   * the bundle, the app will only work with [getUseDeveloperSupport] enabled and will always try to
   * load the JS bundle from Metro. e.g. "index.android.bundle"
   */
  protected open fun getBundleAssetName(): String? = "index.android.bundle"

  /** Returns whether dev mode should be enabled. This enables e.g. the dev menu. */
  public abstract fun getUseDeveloperSupport(): Boolean

  /** Get the [DevSupportManagerFactory]. Override this to use a custom dev support manager. */
  protected open fun getDevSupportManagerFactory(): DevSupportManagerFactory? = null

  /**
   * Returns a list of [ReactPackage] used by the app. You'll most likely want to return at least
   * the `MainReactPackage`. If your app uses additional views or modules besides the default ones,
   * you'll want to include more packages here.
   */
  protected abstract fun getPackages(): List<ReactPackage>

  /**
   * Returns a custom implementation of ChoreographerProvider to be used this host. If null - React
   * will use default direct android.view.Choreographer-based provider.
   */
  protected open fun getChoreographerProvider(): ChoreographerProvider? = null

  private companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactNativeHost",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
