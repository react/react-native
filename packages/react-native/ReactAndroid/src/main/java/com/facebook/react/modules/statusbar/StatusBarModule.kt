/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.modules.statusbar

import android.animation.ArgbEvaluator
import android.animation.ValueAnimator
import android.view.Window
import android.view.WindowManager
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.fbreact.specs.NativeStatusBarManagerAndroidSpec
import com.facebook.react.bridge.GuardedRunnable
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.interfaces.ExtraWindowEventListener
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.DisplayMetricsHolder.getStatusBarHeightPx
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.views.view.isEdgeToEdgeFeatureFlagOn
import com.facebook.react.views.view.setStatusBarStyle
import com.facebook.react.views.view.setStatusBarTranslucency
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

  @Suppress("DEPRECATION")
  override fun getTypedExportedConstants(): Map<String, Any> {
    val currentActivity = reactApplicationContext.currentActivity
    val statusBarColor =
        currentActivity?.window?.statusBarColor?.let { color ->
          String.format("#%06X", 0xFFFFFF and color)
        } ?: "black"
    return mapOf(
        HEIGHT_KEY to PixelUtil.toDIPFromPixel(getStatusBarHeightPx(currentActivity).toFloat()),
        DEFAULT_BACKGROUND_COLOR_KEY to statusBarColor,
    )
  }

  @Suppress("DEPRECATION")
  override fun setColor(colorDouble: Double, animated: Boolean) {
    val color = colorDouble.toInt()
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    if (isEdgeToEdgeFeatureFlagOn) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is edge-to-edge.",
      )
      return
    }
    UiThreadUtil.runOnUiThread(
        object : GuardedRunnable(reactApplicationContext) {
          override fun runGuarded() {
            val window = activity.window ?: return
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS)
            if (animated) {
              val curColor = window.statusBarColor
              val colorAnimation = ValueAnimator.ofObject(ArgbEvaluator(), curColor, color)
              colorAnimation.addUpdateListener { animator ->
                activity.window?.statusBarColor = (animator.animatedValue as Int)
              }
              colorAnimation.setDuration(300).startDelay = 0
              colorAnimation.start()
            } else {
              window.statusBarColor = color
            }
          }
        }
    )
  }

  override fun setTranslucent(translucent: Boolean) {
    val activity = reactApplicationContext.getCurrentActivity()
    if (activity == null) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is null.",
      )
      return
    }
    if (isEdgeToEdgeFeatureFlagOn) {
      FLog.w(
          ReactConstants.TAG,
          "StatusBarModule: Ignored status bar change, current activity is edge-to-edge.",
      )
      return
    }
    UiThreadUtil.runOnUiThread(
        object : GuardedRunnable(reactApplicationContext) {
          override fun runGuarded() {
            activity.window?.setStatusBarTranslucency(translucent)
          }
        }
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
    private const val DEFAULT_BACKGROUND_COLOR_KEY = "DEFAULT_BACKGROUND_COLOR"
    const val NAME: String = NativeStatusBarManagerAndroidSpec.NAME
    private val extraWindows = Collections.newSetFromMap<Window>(WeakHashMap())
  }
}
