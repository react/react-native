/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.net.Uri
import android.provider.Settings
import android.view.WindowManager
import android.widget.FrameLayout
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants

/**
 * Helper class for controlling overlay view with FPS and JS FPS info that gets added directly to
 * [WindowManager] instance.
 */
internal class DebugOverlayController(private val reactContext: ReactContext) {
  private val windowManager = reactContext.getSystemService(Context.WINDOW_SERVICE) as WindowManager

  private var fpsDebugViewContainer: FrameLayout? = null

  fun setFpsDebugViewVisible(fpsDebugViewVisible: Boolean) {
    UiThreadUtil.runOnUiThread(
        Runnable {
          if (fpsDebugViewVisible && fpsDebugViewContainer == null) {
            if (!permissionCheck(reactContext)) {
              FLog.d(ReactConstants.TAG, "Wait for overlay permission to be set")
              return@Runnable
            }
            fpsDebugViewContainer = FpsView(reactContext)
            val params =
                WindowManager.LayoutParams(
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowManager.LayoutParams.MATCH_PARENT,
                    WindowOverlayCompat.TYPE_SYSTEM_OVERLAY,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                        WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE,
                    PixelFormat.TRANSLUCENT,
                )
            windowManager.addView(fpsDebugViewContainer, params)
          } else if (!fpsDebugViewVisible && fpsDebugViewContainer != null) {
            fpsDebugViewContainer?.removeAllViews()
            windowManager.removeView(fpsDebugViewContainer)
            fpsDebugViewContainer = null
          }
        }
    )
  }

  companion object {
    @JvmStatic
    fun requestPermission(context: Context) {
      // Get permission to show debug overlay in dev builds.
      if (!Settings.canDrawOverlays(context)) {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:" + context.packageName),
        )
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        FLog.w(
            ReactConstants.TAG,
            "Overlay permissions needs to be granted in order for react native apps to run in dev mode",
        )
        if (canHandleIntent(context, intent)) {
          context.startActivity(intent)
        }
      }
    }

    private fun permissionCheck(context: Context): Boolean {
      // Get permission to show debug overlay in dev builds.
      // overlay permission not yet granted
      return Settings.canDrawOverlays(context)
    }

    private fun canHandleIntent(context: Context, intent: Intent): Boolean {
      val packageManager = context.packageManager
      return packageManager != null && intent.resolveActivity(packageManager) != null
    }
  }
}
