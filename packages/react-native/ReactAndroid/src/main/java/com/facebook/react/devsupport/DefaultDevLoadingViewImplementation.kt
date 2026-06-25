/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.view.Gravity
import android.view.LayoutInflater
import android.view.ViewGroup
import android.view.WindowManager
import android.widget.PopupWindow
import android.widget.TextView
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import java.util.Locale

/**
 * Default implementation of Dev Loading View Manager to display loading messages on top of the
 * screen. All methods are thread safe.
 */
public class DefaultDevLoadingViewImplementation(
    private val reactInstanceDevHelper: ReactInstanceDevHelper
) : DevLoadingViewManager {
  private var devLoadingView: TextView? = null
  private var devLoadingPopup: PopupWindow? = null

  override fun showMessage(message: String) {
    showMessage(message, color = null, backgroundColor = null, dismissButton = false)
  }

  override fun showMessage(
      message: String,
      color: Double?,
      backgroundColor: Double?,
      dismissButton: Boolean?,
  ) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      showInternal(message, color, backgroundColor, dismissButton ?: false)
    }
  }

  override fun updateProgress(status: String?, done: Int?, total: Int?, percent: Int?) {
    if (!isEnabled) {
      return
    }
    UiThreadUtil.runOnUiThread {
      val percentage =
          if (percent != null) String.format(Locale.getDefault(), " %d%%", percent)
          else if (done != null && total != null && total > 0)
              String.format(Locale.getDefault(), " %.1f%%", done.toFloat() / total * 100)
          else ""
      devLoadingView?.text =
          "${status ?: "Loading"}${percentage}\u2026" // `...` character at the end
    }
  }

  public override fun hide() {
    if (isEnabled) {
      UiThreadUtil.runOnUiThread { hideInternal() }
    }
  }

  private fun showInternal(
      message: String,
      color: Double?,
      backgroundColor: Double?,
      dismissButton: Boolean,
  ) {
    if (devLoadingPopup?.isShowing == true) {
      // already showing
      return
    }
    val currentActivity = reactInstanceDevHelper.currentActivity
    if (currentActivity == null) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react " + "activity isn't available",
      )
      return
    }

    // PopupWindow#showAtLocation uses absolute screen position. In order for
    // loading view to be placed below status bar (if the status bar is present) we need to pass
    // an appropriate Y offset.
    try {
      val rectangle = Rect()
      currentActivity.window.decorView.getWindowVisibleDisplayFrame(rectangle)
      val topOffset = rectangle.top
      val inflater =
          currentActivity.getSystemService(Context.LAYOUT_INFLATER_SERVICE) as LayoutInflater
      val rootView = inflater.inflate(R.layout.dev_loading_view, null) as ViewGroup
      val textView = rootView.findViewById<TextView>(R.id.loading_text)
      textView.text = message

      val dismissButtonView = rootView.findViewById<android.widget.Button>(R.id.dismiss_button)

      if (dismissButton) {
        dismissButtonView.visibility = android.view.View.VISIBLE
      } else {
        dismissButtonView.visibility = android.view.View.GONE
      }

      // Use provided colors or defaults (matching iOS behavior)
      val textColor = color?.toInt() ?: Color.WHITE
      val bgColor = backgroundColor?.toInt() ?: Color.rgb(64, 64, 64) // Default grey

      textView.setTextColor(textColor)
      rootView.setBackgroundColor(bgColor)

      if (dismissButton) {
        dismissButtonView.setTextColor(textColor)

        // Darken the background color for the button
        val red = (Color.red(bgColor) * 0.7).toInt()
        val green = (Color.green(bgColor) * 0.7).toInt()
        val blue = (Color.blue(bgColor) * 0.7).toInt()
        val darkerColor = Color.rgb(red, green, blue)

        // Create rounded drawable for button
        val drawable = android.graphics.drawable.GradientDrawable()
        drawable.setColor(darkerColor)
        drawable.cornerRadius = 15 * rootView.resources.displayMetrics.density
        dismissButtonView.background = drawable

        dismissButtonView.setOnClickListener { hideInternal() }
      }

      // Allow tapping anywhere on the banner to dismiss
      rootView.setOnClickListener { hideInternal() }

      val popup =
          PopupWindow(
              rootView,
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.WRAP_CONTENT,
          )
      popup.showAtLocation(currentActivity.window.decorView, Gravity.NO_GRAVITY, 0, topOffset)
      devLoadingView = textView // Store the TextView for updateProgress()
      devLoadingPopup = popup

      // TODO T164786028: Find out the root cause of the BadTokenException exception here
    } catch (e: WindowManager.BadTokenException) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react activity isn't active, message: $message",
      )
    }
  }

  private fun hideInternal() {
    val popup = devLoadingPopup ?: return
    if (popup.isShowing == true) {
      popup.dismiss()
      devLoadingPopup = null
      devLoadingView = null
    }
  }

  public companion object {
    private var isEnabled = true

    public fun setDevLoadingEnabled(enabled: Boolean) {
      isEnabled = enabled
    }
  }
}
