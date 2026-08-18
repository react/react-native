/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.app.Activity
import android.util.Pair
import android.view.View
import com.facebook.react.bridge.DefaultJSExceptionHandler
import com.facebook.react.bridge.JSExceptionHandler
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.SurfaceDelegate
import com.facebook.react.devsupport.interfaces.BundleLoadCallback
import com.facebook.react.devsupport.interfaces.DevOptionHandler
import com.facebook.react.devsupport.interfaces.DevSupportManager
import com.facebook.react.devsupport.interfaces.DevSupportManager.PackagerLocationCustomizer
import com.facebook.react.devsupport.interfaces.DevSupportManager.PausedInDebuggerOverlayCommandListener
import com.facebook.react.devsupport.interfaces.ErrorCustomizer
import com.facebook.react.devsupport.interfaces.ErrorType
import com.facebook.react.devsupport.interfaces.PackagerStatusCallback
import com.facebook.react.devsupport.interfaces.RedBoxHandler
import com.facebook.react.devsupport.interfaces.StackFrame
import com.facebook.react.modules.debug.interfaces.DeveloperSettings
import java.io.File

/**
 * A dummy implementation of [DevSupportManager] to be used in production mode where development
 * features aren't needed.
 */
public open class ReleaseDevSupportManager : DevSupportManager {

  private val defaultJSExceptionHandler: JSExceptionHandler = DefaultJSExceptionHandler()

  public override fun showNewJavaError(message: String?, e: Throwable): Unit = Unit

  public override fun addCustomDevOption(
      optionName: String,
      optionHandler: DevOptionHandler,
  ): Unit = Unit

  public override fun showNewJSError(
      message: String?,
      details: ReadableArray?,
      errorCookie: Int,
  ): Unit = Unit

  public override fun createRootView(appKey: String): View? = null

  public override fun destroyRootView(rootView: View?): Unit = Unit

  public override fun hideRedboxDialog(): Unit = Unit

  public override fun showDevOptionsDialog(): Unit = Unit

  public override fun startInspector(): Unit = Unit

  public override fun stopInspector(): Unit = Unit

  public override fun setHotModuleReplacementEnabled(isHotModuleReplacementEnabled: Boolean): Unit =
      Unit

  public override fun setFpsDebugEnabled(isFpsDebugEnabled: Boolean): Unit = Unit

  public override fun toggleElementInspector(): Unit = Unit

  public override var devSupportEnabled: Boolean
    get() = false
    @Suppress("UNUSED_PARAMETER") set(value): Unit = Unit

  public override var devMenuEnabled: Boolean
    get() = false
    @Suppress("UNUSED_PARAMETER") set(value): Unit = Unit

  public override var shakeGestureEnabled: Boolean
    get() = false
    @Suppress("UNUSED_PARAMETER") set(value): Unit = Unit

  public override var keyboardShortcutsEnabled: Boolean
    get() = false
    @Suppress("UNUSED_PARAMETER") set(value): Unit = Unit

  public override val devSettings: DeveloperSettings?
    get() = null

  public override val redBoxHandler: RedBoxHandler?
    get() = null

  public override fun onNewReactContextCreated(reactContext: ReactContext): Unit = Unit

  public override fun onReactInstanceDestroyed(reactContext: ReactContext): Unit = Unit

  public override val sourceMapUrl: String?
    get() = null

  public override val sourceUrl: String?
    get() = null

  public override val downloadedJSBundleFile: String?
    get() = null

  public override fun hasUpToDateJSBundleInCache(): Boolean = false

  public override fun reloadSettings(): Unit = Unit

  public override fun handleReloadJS(): Unit = Unit

  public override fun reloadJSFromServer(bundleURL: String, callback: BundleLoadCallback): Unit =
      Unit

  public override fun isPackagerRunning(callback: PackagerStatusCallback) {
    callback.onPackagerStatusFetched(false)
  }

  public override fun downloadBundleResourceFromUrlSync(
      resourceURL: String,
      outputFile: File,
  ): File? = null

  public override val lastErrorTitle: String?
    get() = null

  public override val lastErrorStack: Array<StackFrame>?
    get() = null

  public override val lastErrorType: ErrorType?
    get() = null

  public override val lastErrorCookie: Int = 0

  public override fun registerErrorCustomizer(errorCustomizer: ErrorCustomizer): Unit = Unit

  public override fun processErrorCustomizers(
      errorInfo: Pair<String, Array<StackFrame>>,
  ): Pair<String, Array<StackFrame>> = errorInfo

  public override fun setPackagerLocationCustomizer(
      packagerLocationCustomizer: PackagerLocationCustomizer,
  ): Unit = Unit

  public override fun handleException(e: Exception) {
    defaultJSExceptionHandler.handleException(e)
  }

  public override val currentActivity: Activity?
    get() = null

  public override val currentReactContext: ReactContext?
    get() = null

  public override fun createSurfaceDelegate(moduleName: String): SurfaceDelegate? = null

  public override fun openDebugger(panel: String?): Unit = Unit

  public override fun showPausedInDebuggerOverlay(
      message: String,
      listener: PausedInDebuggerOverlayCommandListener,
  ): Unit = Unit

  public override fun hidePausedInDebuggerOverlay(): Unit = Unit

  public override fun setAdditionalOptionForPackager(name: String, value: String): Unit = Unit
}
