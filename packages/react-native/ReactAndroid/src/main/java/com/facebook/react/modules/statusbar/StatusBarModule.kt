/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.statusbar

import android.view.Window
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeStatusBarManagerAndroidSpec
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.interfaces.ExtraWindowEventListener
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder.getStatusBarHeightPx
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.setStatusBarStyle
import com.facebook.react.views.view.setStatusBarVisibility
import java.util.Collections
import java.util.WeakHashMap

/** [NativeModule] that allows changing the appearance of the status bar. */
@ReactModule(name = NativeStatusBarManagerAndroidSpec.NAME)
internal class StatusBarModule(reactContext: ReactApplicationContext?) :
    NativeStatusBarManagerAndroidSpec(reactContext), ExtraWindowEventListener {

  init {
    reactApplicationContext.addExtraWindowEventListener(this)
  }

  override fun invalidate() {
    super.invalidate()
    reactApplicationContext.removeExtraWindowEventListener(this)
  }

  override fun onExtraWindowCreate(window: Window) {
    extraWindows.add(window)

    reactApplicationContext.currentActivity?.window?.let { activityWindow ->
      val controller = WindowCompat.getInsetsController(activityWindow, activityWindow.decorView)
      val insets = ViewCompat.getRootWindowInsets(activityWindow.decorView)
      val style = if (controller.isAppearanceLightStatusBars) "dark-content" else "light-content"
      val visible = insets?.isVisible(WindowInsetsCompat.Type.statusBars()) ?: true

      window.setStatusBarStyle(style)
      window.setStatusBarVisibility(!visible)
    }
  }

  override fun onExtraWindowDestroy(window: Window) {
    extraWindows.remove(window)
  }

  override fun getTypedExportedConstants(): Map<String, Any> {
    val currentActivity = reactApplicationContext.currentActivity
    return mapOf(
        HEIGHT_KEY to PixelUtil.toDIPFromPixel(getStatusBarHeightPx(currentActivity).toFloat()),
    )
  }

  override fun setHidden(hidden: Boolean) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    UiThreadUtil.runOnUiThread {
      if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
      activity.window?.setStatusBarVisibility(hidden)
      extraWindows.forEach { it.setStatusBarVisibility(hidden) }
    }
  }

  override fun setStyle(style: String?) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    UiThreadUtil.runOnUiThread {
      if (activity.isFinishing || activity.isDestroyed) return@runOnUiThread
      activity.window?.setStatusBarStyle(style)
      extraWindows.forEach { it.setStatusBarStyle(style) }
    }
  }

  companion object {
    private const val HEIGHT_KEY = "HEIGHT"
    const val NAME: String = NativeStatusBarManagerAndroidSpec.NAME
    private val extraWindows = Collections.newSetFromMap<Window>(WeakHashMap())
  }
}
