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
import com.facebook.react.bridge.ReactContext
import com.facebook.react.devsupport.DoubleTapReloadRecognizer
import com.facebook.react.devsupport.ReleaseDevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.interfaces.fabric.ReactSurface
import com.facebook.react.modules.core.DefaultHardwareBackBtnHandler

/**
 * A delegate for handling React Application support. This delegate is unaware whether it is used in
 * an [Activity] or a [android.app.Fragment].
 */
public open class ReactDelegate
public constructor(
    private val activity: Activity,
    reactHost: ReactHost?,
    private val mainComponentName: String?,
    private var launchOptions: Bundle?,
) {
  private val doubleTapReloadRecognizer: DoubleTapReloadRecognizer = DoubleTapReloadRecognizer()

  public var reactHost: ReactHost? = reactHost
    private set

  private var reactSurface: ReactSurface? = null

  private val devSupportManager: DevSupportManager?
    get() = reactHost?.devSupportManager

  public fun onHostResume() {
    if (activity !is DefaultHardwareBackBtnHandler) {
      throw ClassCastException(
          "Host Activity `${activity.javaClass.simpleName}` does not implement DefaultHardwareBackBtnHandler"
      )
    }
    reactHost?.onHostResume(activity, activity as DefaultHardwareBackBtnHandler)
  }

  public fun onUserLeaveHint() {
    reactHost?.onHostLeaveHint(activity)
  }

  public fun onHostPause() {
    reactHost?.onHostPause(activity)
  }

  public fun onHostDestroy() {
    unloadApp()
    reactHost?.onHostDestroy(activity)
  }

  public fun onBackPressed(): Boolean = reactHost?.onBackPressed() == true

  public fun onNewIntent(intent: Intent): Boolean {
    val reactHost = reactHost ?: return false
    reactHost.onNewIntent(intent)
    return true
  }

  public fun onActivityResult(
      requestCode: Int,
      resultCode: Int,
      data: Intent?,
      shouldForwardToReactInstance: Boolean,
  ) {
    if (shouldForwardToReactInstance) {
      reactHost?.onActivityResult(activity, requestCode, resultCode, data)
    }
  }

  public fun onWindowFocusChanged(hasFocus: Boolean) {
    reactHost?.onWindowFocusChange(hasFocus)
  }

  public fun onConfigurationChanged(newConfig: Configuration?) {
    reactHost?.onConfigurationChanged(checkNotNull(activity))
  }

  public fun onKeyDown(keyCode: Int, event: KeyEvent): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD && reactHost?.devSupportManager != null) {
      event.startTracking()
      return true
    }
    return false
  }

  public fun onKeyLongPress(keyCode: Int): Boolean {
    if (keyCode == KeyEvent.KEYCODE_MEDIA_FAST_FORWARD || keyCode == KeyEvent.KEYCODE_BACK) {
      val devSupportManager = reactHost?.devSupportManager
      // onKeyLongPress is a Dev API and not supported in RELEASE mode.
      if (devSupportManager != null && devSupportManager !is ReleaseDevSupportManager) {
        devSupportManager.showDevOptionsDialog()
        return true
      }
    }
    return false
  }

  public fun reload() {
    val devSupportManager = devSupportManager ?: return

    // Reload in RELEASE mode
    if (devSupportManager is ReleaseDevSupportManager) {
      // Do not reload the bundle from JS as there is no bundler running in release mode.
      reactHost?.reload("ReactDelegate.reload()")
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
    val reactHost = reactHost
    if (reactSurface == null && reactHost != null) {
      reactSurface = reactHost.createSurface(activity, appKey, launchOptions)
    }
    reactSurface?.start()
  }

  /** Stop the React surface started with [ReactDelegate.loadApp]. */
  public fun unloadApp() {
    reactSurface?.stop()
    reactSurface = null
  }

  public fun setReactSurface(reactSurface: ReactSurface?) {
    this.reactSurface = reactSurface
  }

  public val reactRootView: ReactRootView?
    get() = reactSurface?.view as ReactRootView?

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
    val didDoubleTapR = doubleTapReloadRecognizer.didDoubleTapR(keyCode, activity.currentFocus)
    if (didDoubleTapR == true) {
      devSupportManager.handleReloadJS()
      return true
    }
    return false
  }

  /**
   * Get the current [ReactContext] from [ReactHost].
   *
   * Do not store a reference to this, if the React instance is reloaded or destroyed, this context
   * will no longer be valid.
   */
  public val currentReactContext: ReactContext?
    get() = reactHost?.currentReactContext
}
