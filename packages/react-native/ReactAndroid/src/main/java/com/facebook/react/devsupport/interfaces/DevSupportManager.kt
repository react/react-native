/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport.interfaces

import android.app.Activity
import android.util.Pair
import android.view.View
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import java.io.File

/**
 * Interface for accessing and interacting with development features. In dev mode, use the
 * implementation [com.facebook.react.devsupport.BridgelessDevSupportManager]. In production mode,
 * use the dummy implementation [com.facebook.react.devsupport.ReleaseDevSupportManager].
 */
public interface DevSupportManager : JSExceptionHandler {

  public val devSettings: DeveloperSettings?
  public val redBoxHandler: RedBoxHandler?
  public val sourceMapUrl: String?
  public val sourceUrl: String?
  public val downloadedJSBundleFile: String?
  public val lastErrorTitle: String?
  public val lastErrorStack: Array<StackFrame>?
  public val lastErrorType: ErrorType?
  public val lastErrorCookie: Int
  public val currentActivity: Activity?
  public val currentReactContext: ReactContext?

  public var devMenuEnabled: Boolean
    get() = true
    set(value) = Unit

  public var shakeGestureEnabled: Boolean
    get() = true
    set(value) = Unit

  public var keyboardShortcutsEnabled: Boolean
    get() = true
    set(value) = Unit

  public var bundleFilePath: String?
    get() = null
    set(value) = Unit

  public var devSupportEnabled: Boolean

  public fun showNewJavaError(message: String?, e: Throwable)

  public fun addCustomDevOption(optionName: String, optionHandler: DevOptionHandler)

  public fun createRootView(appKey: String): View?

  public fun destroyRootView(rootView: View?)

  public fun showNewJSError(message: String?, details: ReadableArray?, errorCookie: Int)

  public fun hideRedboxDialog()

  public fun showDevOptionsDialog()

  public fun startInspector()

  public fun stopInspector()

  public fun onNewReactContextCreated(reactContext: ReactContext)

  public fun onReactInstanceDestroyed(reactContext: ReactContext)

  public fun hasUpToDateJSBundleInCache(): Boolean

  public fun reloadSettings()

  public fun handleReloadJS()

  public fun reloadJSFromServer(bundleURL: String, callback: BundleLoadCallback)

  public fun isPackagerRunning(callback: PackagerStatusCallback)

  public fun setHotModuleReplacementEnabled(isHotModuleReplacementEnabled: Boolean)

  public fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean)

  public fun toggleElementInspector()

  public fun downloadBundleResourceFromUrlSync(resourceURL: String, outputFile: File): File?

  public fun registerErrorCustomizer(errorCustomizer: ErrorCustomizer)

  public fun processErrorCustomizers(
      errorInfo: Pair<String, Array<StackFrame>>,
  ): Pair<String, Array<StackFrame>>

  public fun setPackagerLocationCustomizer(packagerLocationCustomizer: PackagerLocationCustomizer)

  /**
   * Create the surface delegate that the provided module should use to interact with
   *
   * @param moduleName the module name that helps decide which surface it should interact with
   * @return a [SurfaceDelegate] instance
   */
  public fun createSurfaceDelegate(moduleName: String): SurfaceDelegate?

  /**
   * Attempt to open the JS debugger on the host machine.
   *
   * @param panel Optionally provide a destination panel name. This can be a value of
   *   [DebuggerFrontendPanelName] or a custom string. If omitted, the debugger will open on the
   *   last used panel (default behaviour).
   */
  public fun openDebugger(panel: String? = null)

  /** Shows the "paused in debugger" overlay with the given message. */
  public fun showPausedInDebuggerOverlay(
      message: String,
      listener: PausedInDebuggerOverlayCommandListener,
  )

  /** Hides the "paused in debugger" overlay, if currently shown. */
  public fun hidePausedInDebuggerOverlay()

  /** Add an option to send to packager when requesting JS bundle. */
  public fun setAdditionalOptionForPackager(name: String, value: String)

  /**
   * The PackagerLocationCustomizer allows you to have a dynamic packager location that is
   * determined right before loading the packager. Your customizer must call |callback|, as loading
   * will be blocked waiting for it to resolve.
   */
  public fun interface PackagerLocationCustomizer {
    public fun run(callback: Runnable?)
  }

  public interface PausedInDebuggerOverlayCommandListener {
    public fun onResume()
  }
}
