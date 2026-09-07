/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react

import android.app.Activity
import android.content.Intent
import android.content.res.Configuration
import android.os.Bundle
import android.view.KeyEvent
import androidx.activity.ComponentActivity
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactMarker
import com.facebook.react.bridge.ReactMarkerConstants
import com.facebook.react.bridge.UiThreadUtil.runOnUiThread
import com.facebook.react.devsupport.DoubleTapReloadRecognizer
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.internal.featureflags.ReactNativeNewArchitectureFeatureFlags
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an [Activity] or a [android.app.Fragment].
 */
@Suppress("DEPRECATION")
public open class ReactDelegate {
  private val activity: Activity
  private var internalReactRootView: ReactRootView? = null
  private val mainComponentName: String?
  private var launchOptions: Bundle?
  private var doubleTapReloadRecognizer: DoubleTapReloadRecognizer?

  @Deprecated(
      "You should not use ReactNativeHost directly in the New Architecture. Use ReactHost instead.",
      ReplaceWith("reactHost"),
  )
  private var reactNativeHost: ReactNativeHost? = null
  public var reactHost: ReactHost? = null
    private set

  private var reactSurface: ReactSurface? = null

  /**
   * Override this method if you wish to selectively toggle Fabric for a specific surface. This will
   * also control if Concurrent Root (React 18) should be enabled or not.
   *
   * @return true if Fabric is enabled for this Activity, false otherwise.
   */
  protected val isFabricEnabled: Boolean = true

  /**
   * Controls whether this delegate reports the host [Activity] as fully drawn once the initial
   * content of the React surface has appeared.
   *
   * When enabled (the default) and the host [Activity] is a [ComponentActivity], a reporter is
   * added to the activity's [androidx.activity.FullyDrawnReporter] when the surface starts loading
   * and removed once the first view of the surface is mounted, which calls
   * [Activity.reportFullyDrawn] after the next frame is drawn. Android uses this signal to bound
   * the startup window for profile guided compilation (Android 12+) and to report
   * time-to-fully-drawn in Android vitals.
   *
   * Apps that consider themselves fully drawn only later (e.g. once their initial data has been
   * rendered) can keep this enabled and additionally register their own reporter on the activity's
   * [androidx.activity.FullyDrawnReporter] before the content appears.
   *
   * Must be set before [loadApp] to take effect.
   */
  public var isFullyDrawnReportingEnabled: Boolean = true

  private var fullyDrawnMarkerListener: ReactMarker.MarkerListener? = null

  /**
   * Do not use this constructor as it's not accounting for New Architecture at all. You should use
   * [ReactDelegate(Activity, ReactNativeHost, String, Bundle, boolean)] as it's the constructor
   * used for New Architecture.
   */
  @Deprecated(
      "Use one of the other constructors instead to account for New Architecture. Deprecated since 0.75.0",
  )
  public constructor(
      activity: Activity,
      reactNativeHost: ReactNativeHost?,
      appKey: String?,
      launchOptions: Bundle?,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactNativeHost = reactNativeHost
  }

  public constructor(
      activity: Activity,
      reactHost: ReactHost?,
      appKey: String?,
      launchOptions: Bundle?,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactHost = reactHost
  }

  @Deprecated("Deprecated since 0.81.0, use one of the other constructors instead.")
  public constructor(
      activity: Activity,
      reactNativeHost: ReactNativeHost?,
      appKey: String?,
      launchOptions: Bundle?,
      fabricEnabled: Boolean,
  ) {
    this.activity = activity
    this.mainComponentName = appKey
    this.launchOptions = launchOptions
    this.doubleTapReloadRecognizer = DoubleTapReloadRecognizer()
    this.reactNativeHost = reactNativeHost
  }

  private val devSupportManager: DevSupportManager?
    get() =
        if (
            ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
                reactHost?.devSupportManager != null
        ) {
          reactHost?.devSupportManager
        } else if (
            reactNativeHost?.hasInstance() == true && reactNativeHost?.reactInstanceManager != null
        ) {
          reactNativeHost?.reactInstanceManager?.devSupportManager
        } else {
          null
        }

  public fun onHostResume() {
    if (activity !is DefaultHardwareBackBtnHandler) {
      throw ClassCastException(
          "Host Activity `${activity.javaClass.simpleName}` does not implement DefaultHardwareBackBtnHandler",
      )
    }
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onHostResume(activity, activity as DefaultHardwareBackBtnHandler)
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost
            ?.reactInstanceManager
            ?.onHostResume(activity, activity as DefaultHardwareBackBtnHandler)
      }
    }
  }

  public fun onUserLeaveHint() {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onHostLeaveHint(activity)
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost?.reactInstanceManager?.onUserLeaveHint(activity)
      }
    }
  }

  public fun onHostPause() {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onHostPause(activity)
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost?.reactInstanceManager?.onHostPause(activity)
      }
    }
  }

  public fun onHostDestroy() {
    unloadApp()
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onHostDestroy(activity)
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost?.reactInstanceManager?.onHostDestroy(activity)
      }
    }
  }

  public fun onBackPressed(): Boolean {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      return reactHost?.onBackPressed() == true
    } else if (reactNativeHost?.hasInstance() == true) {
      reactNativeHost?.reactInstanceManager?.onBackPressed()
      return true
    }
    return false
  }

  public fun onNewIntent(intent: Intent): Boolean {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onNewIntent(intent)
      return true
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost?.reactInstanceManager?.onNewIntent(intent)
        return true
      }
    }
    return false
  }

  public fun onActivityResult(
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
      shouldForwardToReactInstance: Boolean,
  ) {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
            reactHost != null &&
            shouldForwardToReactInstance
    ) {
      reactHost?.onActivityResult(activity, requestCode, resultCode, data)
    } else {
      if (reactNativeHost?.hasInstance() == true && shouldForwardToReactInstance) {
        reactNativeHost
            ?.reactInstanceManager
            ?.onActivityResult(activity, requestCode, resultCode, data)
      }
    }
  }

  public fun onWindowFocusChanged(hasFocus: Boolean) {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onWindowFocusChange(hasFocus)
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        reactNativeHost?.reactInstanceManager?.onWindowFocusChange(hasFocus)
      }
    }
  }

  public fun onConfigurationChanged(newConfig: Configuration?) {
    if (
        ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
    ) {
      reactHost?.onConfigurationChanged(checkNotNull(activity))
    } else {
      if (reactNativeHost?.hasInstance() == true) {
        getReactInstanceManager().onConfigurationChanged(checkNotNull(activity), newConfig)
      }
    }
  }

  public fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (
        keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD &&
            ((ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() &&
                reactHost?.devSupportManager != null) ||
                (reactNativeHost?.hasInstance() == true &&
                    reactNativeHost?.getUseDeveloperSupport() == true))
    ) {
      event.startTracking()
      return true
    }
    return false
  }

  public fun onKeyLongPress(keyCode: Int): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || keyCode == KeyEvent.KEYCODE_BACK) {
      if (
          ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture() && reactHost != null
      ) {
        val devSupportManager = reactHost?.devSupportManager
        // onKeyLongPress is a Dev API and not supported in RELEASE mode.
        if (devSupportManager != null && devSupportManager !is ReleaseDevSupportManager) {
          devSupportManager.showDevOptionsDialog()
          return true
        }
      } else {
        if (
            reactNativeHost?.hasInstance() == true &&
                reactNativeHost?.getUseDeveloperSupport() == true
        ) {
          reactNativeHost?.reactInstanceManager?.showDevOptionsDialog()
          return true
        }
      }
    }
    return false
  }

  public fun reload() {
    val devSupportManager = devSupportManager ?: return

    // Reload in RELEASE mode
    if (devSupportManager is ReleaseDevSupportManager) {
      // Do not reload the bundle from JS as there is no bundler running in release mode.
      if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
        reactHost?.reload("ReactDelegate.reload()")
      } else {
        runOnUiThread {
          if (
              reactNativeHost?.hasInstance() == true &&
                  reactNativeHost?.reactInstanceManager != null
          ) {
            reactNativeHost?.reactInstanceManager?.recreateReactContextInBackground()
          }
        }
      }
      return
    }

    // Reload in DEBUG mode
    devSupportManager.handleReloadJS()
  }

  /** Start the React surface with the app key supplied in the [ReactDelegate] constructor. */
  public fun loadApp() {
    val name = requireNotNull(mainComponentName) { "Cannot loadApp without a main component name." }
    loadApp(name)
  }

  /**
   * Start the React surface for the given app key.
   *
   * @param appKey The ID of the app to load into the surface.
   */
  public fun loadApp(appKey: String) {
    if (isFullyDrawnReportingEnabled) {
      reportFullyDrawnWhenContentAppears(appKey)
    }
    // With Bridgeless enabled, create and start the surface
    if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
      val reactHost = reactHost
      if (reactSurface == null && reactHost != null) {
        reactSurface = reactHost.createSurface(activity, appKey, launchOptions)
      }
      reactSurface?.start()
    } else {
      check(internalReactRootView == null) { "Cannot loadApp while app is already running." }
      internalReactRootView = createRootView()
      if (reactNativeHost != null) {
        internalReactRootView?.startReactApplication(
            reactNativeHost?.reactInstanceManager,
            appKey,
            launchOptions,
        )
      }
    }
  }

  /** Stop the React surface started with [ReactDelegate.loadApp]. */
  public fun unloadApp() {
    cancelFullyDrawnReporting()
    if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
      reactSurface?.stop()
      reactSurface = null
    } else {
      if (internalReactRootView != null) {
        internalReactRootView?.unmountReactApplication()
        internalReactRootView = null
      }
    }
  }

  private fun reportFullyDrawnWhenContentAppears(appKey: String) {
    if (fullyDrawnMarkerListener != null) {
      return
    }
    val fullyDrawnReporter = (activity as? ComponentActivity)?.fullyDrawnReporter ?: return
    if (fullyDrawnReporter.isFullyDrawnReported) {
      return
    }
    fullyDrawnReporter.addReporter()
    val listener =
        object : ReactMarker.MarkerListener {
          override fun logMarker(name: ReactMarkerConstants, tag: String?, instanceKey: Int) {
            if (name == ReactMarkerConstants.CONTENT_APPEARED && tag == appKey) {
              // CONTENT_APPEARED is logged on the UI thread, so this cannot race with
              // cancelFullyDrawnReporting or a second loadApp.
              if (fullyDrawnMarkerListener !== this) {
                return
              }
              fullyDrawnMarkerListener = null
              ReactMarker.removeListener(this)
              fullyDrawnReporter.removeReporter()
            }
          }
        }
    fullyDrawnMarkerListener = listener
    ReactMarker.addListener(listener)
  }

  private fun cancelFullyDrawnReporting() {
    val listener = fullyDrawnMarkerListener ?: return
    fullyDrawnMarkerListener = null
    ReactMarker.removeListener(listener)
    (activity as? ComponentActivity)?.fullyDrawnReporter?.removeReporter()
  }

  public fun setReactSurface(reactSurface: ReactSurface?) {
    this.reactSurface = reactSurface
  }

  public var reactRootView: ReactRootView?
    get() {
      return if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
        if (reactSurface != null) {
          reactSurface?.view as ReactRootView?
        } else {
          null
        }
      } else {
        internalReactRootView
      }
    }
    set(reactRootView) {
      internalReactRootView = reactRootView
    }

  // Not used in bridgeless
  protected open fun createRootView(): ReactRootView? {
    val reactRootView = ReactRootView(activity)
    reactRootView.setIsFabric(isFabricEnabled)
    return reactRootView
  }

  /**
   * Handles delegating the [Activity.onKeyUp] method to determine whether the application should
   * show the developer menu or should reload the React Application.
   *
   * @return true if we consume the event and either show the develop menu or reloaded the
   *   application.
   */
  public fun shouldShowDevMenuOrReload(keyCode: Int, event: KeyEvent?): Boolean {
    val devSupportManager = devSupportManager
    // shouldShowDevMenuOrReload is a Dev API and not supported in RELEASE mode.
    if (
        devSupportManager == null ||
            !devSupportManager.keyboardShortcutsEnabled ||
            devSupportManager is ReleaseDevSupportManager
    ) {
      return false
    }

    if (keyCode == KeyEvent.KEYCODE_MENU) {
      devSupportManager.showDevOptionsDialog()
      return true
    }
    val didDoubleTapR = doubleTapReloadRecognizer?.didDoubleTapR(keyCode, activity.currentFocus)
    if (didDoubleTapR == true) {
      devSupportManager.handleReloadJS()
      return true
    }
    return false
  }

  @Deprecated(
      "Do not access [ReactInstanceManager] directly. This class is going away in the New Architecture. You should use [ReactHost] instead.",
  )
  public fun getReactInstanceManager(): ReactInstanceManager {
    val nonNullReactNativeHost =
        checkNotNull(reactNativeHost) {
          "Cannot get ReactInstanceManager without a ReactNativeHost."
        }
    return nonNullReactNativeHost.reactInstanceManager
  }

  /**
   * Get the current [ReactContext] from [ReactHost] or [ReactInstanceManager]
   *
   * Do not store a reference to this, if the React instance is reloaded or destroyed, this context
   * will no longer be valid.
   */
  public val currentReactContext: ReactContext?
    get() {
      return if (ReactNativeNewArchitectureFeatureFlags.enableBridgelessArchitecture()) {
        if (reactHost != null) {
          reactHost?.currentReactContext
        } else {
          null
        }
      } else {
        getReactInstanceManager().currentReactContext
      }
    }
}
