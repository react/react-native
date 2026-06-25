/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.view

import android.app.Activity
import android.graphics.Color
import android.os.Build
import android.view.View
import android.view.Window
import android.view.WindowInsetsController
import android.view.WindowManager
import androidx.annotation.VisibleForTesting
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import com.facebook.react.util.AndroidVersion
import com.facebook.react.views.common.UiModeUtils

// The light scrim color used in the platform API 29+
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/java/com/android/internal/policy/DecorView.java;drc=6ef0f022c333385dba2c294e35b8de544455bf19;l=142
internal val LightNavigationBarColor = Color.argb(0xe6, 0xFF, 0xFF, 0xFF)

// The dark scrim color used in the platform.
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/res/color/system_bar_background_semi_transparent.xml
// https://cs.android.com/android/platform/superproject/+/master:frameworks/base/core/res/remote_color_resources_res/values/colors.xml;l=67
internal val DarkNavigationBarColor = Color.argb(0x80, 0x1b, 0x1b, 0x1b)

/**
 * This does not enable or apply edge-to-edge behavior, it simply tracks whether it has been flagged
 * as enabled elsewhere in the application.
 */
public var isEdgeToEdgeFeatureFlagOn: Boolean = false
  @VisibleForTesting internal set

public fun setEdgeToEdgeFeatureFlagOn() {
  isEdgeToEdgeFeatureFlagOn = true
}

internal fun updateEdgeToEdgeFeatureFlag(activity: Activity) {
  // When the app targets SDK 35+, edge-to-edge may be enforced by the OS even if the
  // feature flag wasn't explicitly set. In that case, turn the flag on to match.
  if (AndroidVersion.isAtLeastTargetSdk35(activity)) {
    if (Build.VERSION.SDK_INT >= AndroidVersion.VERSION_CODE_BAKLAVA) {
      // The device is running Android 16+ (where edge-to-edge is always enforced)
      isEdgeToEdgeFeatureFlagOn = true
    } else {
      val attributes = intArrayOf(AndroidVersion.ATTR_WINDOW_OPT_OUT_EDGE_TO_EDGE_ENFORCEMENT)
      val typedArray = activity.theme.obtainStyledAttributes(attributes)

      // The device is running Android 15 with / without opting out
      isEdgeToEdgeFeatureFlagOn =
          try {
            !typedArray.getBoolean(0, false)
          } finally {
            typedArray.recycle()
          }
    }
  }

  if (isEdgeToEdgeFeatureFlagOn) {
    activity.window.enableEdgeToEdge()
  }
}

@Suppress("DEPRECATION")
internal fun Window.setStatusBarTranslucency(isTranslucent: Boolean) {
  // If the status bar is translucent hook into the window insets calculations
  // and consume all the top insets so no padding will be added under the status bar.
  if (isTranslucent) {
    decorView.setOnApplyWindowInsetsListener { v, insets ->
      val defaultInsets = v.onApplyWindowInsets(insets)
      defaultInsets.replaceSystemWindowInsets(
          defaultInsets.systemWindowInsetLeft,
          0,
          defaultInsets.systemWindowInsetRight,
          defaultInsets.systemWindowInsetBottom,
      )
    }
  } else {
    decorView.setOnApplyWindowInsetsListener(null)
  }
  ViewCompat.requestApplyInsets(decorView)
}

internal fun Window.setStatusBarVisibility(isHidden: Boolean) {
  if (isHidden) {
    this.statusBarHide()
  } else {
    this.statusBarShow()
  }
}

@Suppress("DEPRECATION")
internal fun Window.setStatusBarStyle(style: String?) {
  if (Build.VERSION.SDK_INT > Build.VERSION_CODES.R) {
    if ("dark-content" == style) {
      // dark-content means dark icons on a light status bar
      insetsController?.setSystemBarsAppearance(
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
      )
    } else {
      insetsController?.setSystemBarsAppearance(
          0,
          WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS,
      )
    }
  } else {
    var systemUiVisibilityFlags = decorView.systemUiVisibility
    systemUiVisibilityFlags =
        if ("dark-content" == style) {
          systemUiVisibilityFlags or View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR
        } else {
          systemUiVisibilityFlags and View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR.inv()
        }
    decorView.systemUiVisibility = systemUiVisibilityFlags
  }
}

@Suppress("DEPRECATION")
private fun Window.statusBarHide() {
  if (isEdgeToEdgeFeatureFlagOn) {
    WindowInsetsControllerCompat(this, decorView).run {
      systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      hide(WindowInsetsCompat.Type.statusBars())
    }
  } else {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      // Ensure the content extends into the cutout area
      attributes.layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
      setDecorFitsSystemWindows(false)
    }
    addFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
    clearFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
  }
}

@Suppress("DEPRECATION")
private fun Window.statusBarShow() {
  if (isEdgeToEdgeFeatureFlagOn) {
    WindowInsetsControllerCompat(this, decorView).run {
      systemBarsBehavior = WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
      show(WindowInsetsCompat.Type.statusBars())
    }
  } else {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      attributes.layoutInDisplayCutoutMode =
          WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT
      setDecorFitsSystemWindows(true)
    }
    addFlags(WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN)
    clearFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN)
  }
}

@Suppress("DEPRECATION")
internal fun Window.enableEdgeToEdge() {
  WindowCompat.setDecorFitsSystemWindows(this, false)

  val insetsController = WindowInsetsControllerCompat(this, decorView)
  val isDarkMode = UiModeUtils.isDarkMode(context)

  statusBarColor = Color.TRANSPARENT

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
    navigationBarColor = Color.TRANSPARENT

    val attributes = intArrayOf(android.R.attr.enforceNavigationBarContrast)
    val typedArray = context.theme.obtainStyledAttributes(attributes)

    val enforceNavigationBarContrast =
        try {
          typedArray.getBoolean(0, true)
        } finally {
          typedArray.recycle()
        }

    isStatusBarContrastEnforced = false
    isNavigationBarContrastEnforced = enforceNavigationBarContrast

    if (enforceNavigationBarContrast) {
      insetsController.isAppearanceLightNavigationBars = !isDarkMode
    }
  } else {
    val isAppearanceLightNavigationBars =
        Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && !isDarkMode

    navigationBarColor =
        if (isAppearanceLightNavigationBars) LightNavigationBarColor else DarkNavigationBarColor
    insetsController.isAppearanceLightNavigationBars = isAppearanceLightNavigationBars
  }

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
    attributes.layoutInDisplayCutoutMode =
        when {
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.R ->
              WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_ALWAYS
          else -> WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
  }
}

internal fun Window.disableEdgeToEdge() {
  WindowCompat.setDecorFitsSystemWindows(this, true)
}
