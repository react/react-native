/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react

import android.app.Activity
import android.app.Application
import android.content.Context
import com.facebook.common.logging.FLog
import com.facebook.hermes.reactexecutor.HermesExecutor
import com.facebook.hermes.reactexecutor.HermesExecutorFactory
import com.facebook.react.ReactInstanceManager.initializeSoLoaderIfNecessary
import com.facebook.react.bridge.JSBundleLoader
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.JavaScriptExecutorFactory
import com.facebook.react.bridge.UIManagerProvider
import com.facebook.react.common.LifecycleState
import com.facebook.react.common.SurfaceDelegateFactory
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.devsupport.DefaultDevSupportManagerFactory
import com.facebook.react.devsupport.DevSupportManagerFactory
import com.facebook.react.devsupport.interfaces.DevBundleDownloadListener
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.PausedInDebuggerOverlayManager
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.internal.ChoreographerProvider
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler
import com.facebook.react.modules.systeminfo.AndroidInfoHelpers
import com.facebook.react.packagerconnection.RequestHandler

/** Builder class for [ReactInstanceManager]. */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated(
    message = "This class is part of Legacy Architecture and will be removed in a future release",
    level = DeprecationLevel.WARNING,
)
public class ReactInstanceManagerBuilder {
  private val packages: MutableList<ReactPackage> = mutableListOf()
  private var jsBundleAssetUrl: String? = null
  private var jsBundleLoader: JSBundleLoader? = null
  private var jsMainModulePath: String? = null
  private var application: Application? = null
  private var useDeveloperSupport = false
  private var devSupportManagerFactory: DevSupportManagerFactory? = null
  private var requireActivity = false
  private var keepActivity = false
  private var initialLifecycleState: LifecycleState? = null
  private var jsExceptionHandler: JSExceptionHandler? = null
  private var currentActivity: Activity? = null
  private var defaultHardwareBackBtnHandler: DefaultHardwareBackBtnHandler? = null
  private var redBoxHandler: RedBoxHandler? = null
  private var lazyViewManagersEnabled = false
  private var devBundleDownloadListener: DevBundleDownloadListener? = null
  private var javaScriptExecutorFactory: JavaScriptExecutorFactory? = null
  private var minNumShakes = 1
  private var minTimeLeftInFrameForNonBatchedOperationMs = -1
  private var uiManagerProvider: UIManagerProvider? = null
  private var customPackagerCommandHandlers: Map<String, RequestHandler>? = null
  private var tmmDelegateBuilder: ReactPackageTurboModuleManagerDelegate.Builder? = null
  private var surfaceDelegateFactory: SurfaceDelegateFactory? = null
  private var devLoadingViewManager: DevLoadingViewManager? = null
  private var choreographerProvider: ChoreographerProvider? = null
  private var pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager? = null

  /** Factory for desired implementation of JavaScriptExecutor. */
  public fun setJavaScriptExecutorFactory(
      javaScriptExecutorFactory: JavaScriptExecutorFactory?
  ): ReactInstanceManagerBuilder {
    this.javaScriptExecutorFactory = javaScriptExecutorFactory
    return this
  }

  public fun setUIManagerProvider(
      uiManagerProvider: UIManagerProvider?
  ): ReactInstanceManagerBuilder {
    this.uiManagerProvider = uiManagerProvider
    return this
  }

  /**
   * Name of the JS bundle file to be loaded from application's raw assets.
   *
   * Example: `"index.android.js"`
   */
  public fun setBundleAssetName(bundleAssetName: String?): ReactInstanceManagerBuilder {
    jsBundleAssetUrl = if (bundleAssetName == null) null else "assets://$bundleAssetName"
    jsBundleLoader = null
    return this
  }

  /**
   * Path to the JS bundle file to be loaded from the file system.
   *
   * Example: `"assets://index.android.js"` or `"/sdcard/main.jsbundle"`
   */
  public fun setJSBundleFile(jsBundleFile: String): ReactInstanceManagerBuilder {
    if (jsBundleFile.startsWith("assets://")) {
      jsBundleAssetUrl = jsBundleFile
      jsBundleLoader = null
      return this
    }
    return setJSBundleLoader(JSBundleLoader.createFileLoader(jsBundleFile))
  }

  /**
   * Bundle loader to use when setting up JS environment. This supersedes prior invocations of
   * [setJSBundleFile] and [setBundleAssetName].
   *
   * Example: `JSBundleLoader.createFileLoader(application, bundleFile)`
   */
  public fun setJSBundleLoader(jsBundleLoader: JSBundleLoader): ReactInstanceManagerBuilder {
    this.jsBundleLoader = jsBundleLoader
    jsBundleAssetUrl = null
    return this
  }

  /**
   * Path to your app's main module on Metro. This is used when reloading JS during development. All
   * paths are relative to the root folder the packager is serving files from. Examples:
   * `"index.android"` or `"subdirectory/index.android"`
   */
  public fun setJSMainModulePath(jsMainModulePath: String): ReactInstanceManagerBuilder {
    this.jsMainModulePath = jsMainModulePath
    return this
  }

  public fun addPackage(reactPackage: ReactPackage): ReactInstanceManagerBuilder {
    packages.add(reactPackage)
    return this
  }

  public fun addPackages(reactPackages: List<ReactPackage>): ReactInstanceManagerBuilder {
    packages.addAll(reactPackages)
    return this
  }

  /** Required. This must be your `Application` instance. */
  public fun setApplication(application: Application): ReactInstanceManagerBuilder {
    this.application = application
    return this
  }

  public fun setCurrentActivity(activity: Activity): ReactInstanceManagerBuilder {
    currentActivity = activity
    return this
  }

  public fun setDefaultHardwareBackBtnHandler(
      defaultHardwareBackBtnHandler: DefaultHardwareBackBtnHandler
  ): ReactInstanceManagerBuilder {
    this.defaultHardwareBackBtnHandler = defaultHardwareBackBtnHandler
    return this
  }

  /**
   * When `true`, developer options such as JS reloading and debugging are enabled. Note you still
   * have to call [showDevOptionsDialog] to show the dev menu, e.g. when the device Menu button is
   * pressed.
   */
  public fun setUseDeveloperSupport(useDeveloperSupport: Boolean): ReactInstanceManagerBuilder {
    this.useDeveloperSupport = useDeveloperSupport
    return this
  }

  /**
   * Set the custom [DevSupportManagerFactory]. If not set, will use
   * [DefaultDevSupportManagerFactory].
   */
  public fun setDevSupportManagerFactory(
      devSupportManagerFactory: DevSupportManagerFactory?
  ): ReactInstanceManagerBuilder {
    this.devSupportManagerFactory = devSupportManagerFactory
    return this
  }

  /**
   * When `false`, indicates that correct usage of React Native will NOT involve an Activity. For
   * the vast majority of Android apps in the ecosystem, this will not need to change. Unless you
   * really know what you're doing, you should probably not change this!
   */
  public fun setRequireActivity(requireActivity: Boolean): ReactInstanceManagerBuilder {
    this.requireActivity = requireActivity
    return this
  }

  public fun setKeepActivity(keepActivity: Boolean): ReactInstanceManagerBuilder {
    this.keepActivity = keepActivity
    return this
  }

  /**
   * When the [SurfaceDelegateFactory] is provided, it will be used for native modules to get a
   * [SurfaceDelegate] to interact with the platform specific surface that they that needs to be
   * rendered in. For mobile platform this is default to be null so that these modules will need to
   * provide a default surface delegate. One example of such native module is [LogBoxModule], which
   * is rendered in mobile platform with [LogBoxDialog], while in VR platform with custom layer
   * provided by runtime.
   */
  public fun setSurfaceDelegateFactory(
      surfaceDelegateFactory: SurfaceDelegateFactory?
  ): ReactInstanceManagerBuilder {
    this.surfaceDelegateFactory = surfaceDelegateFactory
    return this
  }

  /** Sets the Dev Loading View Manager. */
  public fun setDevLoadingViewManager(
      devLoadingViewManager: DevLoadingViewManager?
  ): ReactInstanceManagerBuilder {
    this.devLoadingViewManager = devLoadingViewManager
    return this
  }

  public fun setPausedInDebuggerOverlayManager(
      pausedInDebuggerOverlayManager: PausedInDebuggerOverlayManager?
  ): ReactInstanceManagerBuilder {
    this.pausedInDebuggerOverlayManager = pausedInDebuggerOverlayManager
    return this
  }

  /**
   * Sets the initial lifecycle state of the host. For example, if the host is already resumed at
   * creation time, we wouldn't expect an onResume call until we get an onPause call.
   */
  public fun setInitialLifecycleState(
      initialLifecycleState: LifecycleState
  ): ReactInstanceManagerBuilder {
    this.initialLifecycleState = initialLifecycleState
    return this
  }

  /**
   * Set the exception handler for all native module calls. If not set, the default
   * [DevSupportManager] will be used, which shows a redbox in dev mode and rethrows (crashes the
   * app) in prod mode.
   */
  public fun setJSExceptionHandler(handler: JSExceptionHandler?): ReactInstanceManagerBuilder {
    jsExceptionHandler = handler
    return this
  }

  public fun setRedBoxHandler(redBoxHandler: RedBoxHandler?): ReactInstanceManagerBuilder {
    this.redBoxHandler = redBoxHandler
    return this
  }

  public fun setLazyViewManagersEnabled(
      lazyViewManagersEnabled: Boolean
  ): ReactInstanceManagerBuilder {
    this.lazyViewManagersEnabled = lazyViewManagersEnabled
    return this
  }

  public fun setDevBundleDownloadListener(
      listener: DevBundleDownloadListener?
  ): ReactInstanceManagerBuilder {
    devBundleDownloadListener = listener
    return this
  }

  public fun setMinNumShakes(minNumShakes: Int): ReactInstanceManagerBuilder {
    this.minNumShakes = minNumShakes
    return this
  }

  public fun setMinTimeLeftInFrameForNonBatchedOperationMs(
      minTimeLeftInFrameForNonBatchedOperationMs: Int
  ): ReactInstanceManagerBuilder {
    this.minTimeLeftInFrameForNonBatchedOperationMs = minTimeLeftInFrameForNonBatchedOperationMs
    return this
  }

  public fun setCustomPackagerCommandHandlers(
      customPackagerCommandHandlers: Map<String, RequestHandler>?
  ): ReactInstanceManagerBuilder {
    this.customPackagerCommandHandlers = customPackagerCommandHandlers
    return this
  }

  public fun setReactPackageTurboModuleManagerDelegateBuilder(
      builder: ReactPackageTurboModuleManagerDelegate.Builder?
  ): ReactInstanceManagerBuilder {
    tmmDelegateBuilder = builder
    return this
  }

  public fun setChoreographerProvider(
      choreographerProvider: ChoreographerProvider?
  ): ReactInstanceManagerBuilder {
    this.choreographerProvider = choreographerProvider
    return this
  }

  /**
   * Instantiates a new [ReactInstanceManager]. Before calling [build], the following must be
   * called:
   * * [setApplication]
   * * [setCurrentActivity] if the activity has already resumed
   * * [setDefaultHardwareBackBtnHandler] if the activity has already resumed
   * * [setJSBundleFile] or [setJSMainModulePath]
   */
  public fun build(): ReactInstanceManager {
    val application =
        checkNotNull(this.application) { "Application property has not been set with this builder" }

    if (initialLifecycleState == LifecycleState.RESUMED) {
      checkNotNull(currentActivity) {
        "Activity needs to be set if initial lifecycle state is resumed"
      }
    }

    check(useDeveloperSupport || jsBundleAssetUrl != null || jsBundleLoader != null) {
      "JS Bundle File or Asset URL has to be provided when dev support is disabled"
    }

    check(jsMainModulePath != null || jsBundleAssetUrl != null || jsBundleLoader != null) {
      "Either MainModulePath or JS Bundle File needs to be provided"
    }

    // We use the name of the device and the app for debugging & metrics
    val appName = application.packageName
    val deviceName: String = AndroidInfoHelpers.getFriendlyDeviceName()
    val safeJSBundleAssetUrl = jsBundleAssetUrl

    return ReactInstanceManager(
        application,
        currentActivity,
        defaultHardwareBackBtnHandler,
        javaScriptExecutorFactory
            ?: getDefaultJSExecutorFactory(appName, deviceName, application.applicationContext),
        if ((jsBundleLoader == null && safeJSBundleAssetUrl != null))
            JSBundleLoader.createAssetLoader(
                application,
                safeJSBundleAssetUrl,
                loadSynchronously = false,
            )
        else jsBundleLoader,
        jsMainModulePath,
        packages,
        useDeveloperSupport,
        devSupportManagerFactory ?: DefaultDevSupportManagerFactory(),
        requireActivity,
        keepActivity,
        checkNotNull(initialLifecycleState) { "Initial lifecycle state was not set" },
        jsExceptionHandler,
        redBoxHandler,
        lazyViewManagersEnabled,
        devBundleDownloadListener,
        minNumShakes,
        minTimeLeftInFrameForNonBatchedOperationMs,
        uiManagerProvider,
        customPackagerCommandHandlers,
        tmmDelegateBuilder,
        surfaceDelegateFactory,
        devLoadingViewManager,
        choreographerProvider,
        pausedInDebuggerOverlayManager,
    )
  }

  private fun getDefaultJSExecutorFactory(
      appName: String,
      deviceName: String,
      applicationContext: Context,
  ): JavaScriptExecutorFactory? {
    ReactInstanceManager.initializeSoLoaderIfNecessary(applicationContext)
    // Hermes has been enabled by default in OSS since React Native 0.70.
    try {
      HermesExecutor.loadLibrary()
      return HermesExecutorFactory()
    } catch (error: UnsatisfiedLinkError) {
      FLog.e(
          TAG,
          "Unable to load Hermes. Your application is not built correctly and will fail to execute",
      )
      return null
    }
  }

  private companion object {
    private val TAG: String = ReactInstanceManagerBuilder::class.java.simpleName

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "ReactInstanceManagerBuilder",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
