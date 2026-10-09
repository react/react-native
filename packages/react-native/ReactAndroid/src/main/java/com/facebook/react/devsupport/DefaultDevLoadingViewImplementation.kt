/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.devsupport

import android.animation.Animator
import android.animation.AnimatorListenerAdapter
import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.SystemClock
import android.util.TypedValue
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.WindowManager
import android.view.animation.AccelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.widget.ImageView
import android.widget.PopupWindow
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.ReactConstants
import com.facebook.react.devsupport.interfaces.DevLoadingViewManager
import java.util.Locale

/**
 * Default implementation of Dev Loading View Manager to display loading messages in a capsule at
 * the top of the screen. All methods are thread safe.
 */
public class DefaultDevLoadingViewImplementation(
    private val reactInstanceDevHelper: ReactInstanceDevHelper,
) : DevLoadingViewManager {
  private var devLoadingView: TextView? = null
  private var devLoadingPopup: PopupWindow? = null
  private var hideAnimator: Animator? = null
  private var showTimeMs = 0L

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
    // A new message replaces one that is still animating out.
    hideAnimator?.cancel()
    showTimeMs = SystemClock.uptimeMillis()

    val textColor = color?.toInt() ?: Color.WHITE
    val bgColor = backgroundColor?.toInt() ?: Color.rgb(64, 64, 64) // Default grey

    val existingPopup = devLoadingPopup
    if (existingPopup?.isShowing == true) {
      applyContent(existingPopup.contentView, message, textColor, bgColor, dismissButton)
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

    try {
      val decorView = currentActivity.window.decorView
      val inflater = LayoutInflater.from(currentActivity)
      val pill = inflater.inflate(R.layout.dev_loading_view, null) as ViewGroup
      applyContent(pill, message, textColor, bgColor, dismissButton)

      // Sits 12dp below a top inset such as the status bar, or 16dp from the top edge without one,
      // centered and kept clear of the side insets with a 16dp margin.
      val insets =
          ViewCompat.getRootWindowInsets(decorView)
              ?.getInsets(
                  WindowInsetsCompat.Type.systemBars() or WindowInsetsCompat.Type.displayCutout()
              )
      val topInset = insets?.top ?: 0
      val sideInset = maxOf(insets?.left ?: 0, insets?.right ?: 0) + dpToPx(pill, 16f)
      val textView = pill.findViewById<TextView>(R.id.loading_text)
      val dismissButtonView = pill.findViewById<View>(R.id.dismiss_button)
      val dismissButtonWidth =
          if (dismissButton) {
            (dismissButtonView.layoutParams as ViewGroup.MarginLayoutParams).let {
              it.width + it.marginStart
            }
          } else {
            0
          }
      textView.maxWidth =
          decorView.width - 2 * sideInset - pill.paddingStart - pill.paddingEnd - dismissButtonWidth

      pill.setOnClickListener { hideInternal() }
      dismissButtonView.setOnClickListener { hideInternal() }

      val popup =
          PopupWindow(
              pill,
              ViewGroup.LayoutParams.WRAP_CONTENT,
              ViewGroup.LayoutParams.WRAP_CONTENT,
          )
      popup.showAtLocation(
          decorView,
          Gravity.TOP or Gravity.CENTER_HORIZONTAL,
          0,
          if (topInset > 0) topInset + dpToPx(pill, 12f) else dpToPx(pill, 16f),
      )
      // A new message resizes the window about its center. Without this, the system animates that
      // move, so the capsule grows from its old left edge and then slides back to center.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val popupRoot = pill.rootView
        (popupRoot.layoutParams as? WindowManager.LayoutParams)?.let {
          it.setCanPlayMoveAnimation(false)
          currentActivity.windowManager.updateViewLayout(popupRoot, it)
        }
      }
      devLoadingView = textView
      devLoadingPopup = popup
      animateIn(pill)

      // TODO T164786028: Find out the root cause of the BadTokenException exception here
    } catch (e: WindowManager.BadTokenException) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react activity isn't active, message: $message",
      )
    }
  }

  private fun applyContent(
      pill: View,
      message: String,
      textColor: Int,
      bgColor: Int,
      dismissButton: Boolean,
  ) {
    pill.background =
        GradientDrawable().apply {
          setColor(bgColor)
          // Larger than any banner height, so the corners always form a capsule.
          cornerRadius = dpToPx(pill, 1000f).toFloat()
        }
    val textView = pill.findViewById<TextView>(R.id.loading_text)
    textView.text = message
    textView.setTextColor(textColor)

    val dismissButtonView = pill.findViewById<ImageView>(R.id.dismiss_button)
    dismissButtonView.visibility = if (dismissButton) View.VISIBLE else View.GONE
    // The round button sits closer to the capsule's end than the text would.
    pill.setPaddingRelative(
        pill.paddingStart,
        pill.paddingTop,
        dpToPx(pill, if (dismissButton) 9f else 14f),
        pill.paddingBottom,
    )
    dismissButtonView.setColorFilter(textColor)
    dismissButtonView.background =
        GradientDrawable().apply {
          shape = GradientDrawable.OVAL
          setColor(
              Color.argb(51, Color.red(textColor), Color.green(textColor), Color.blue(textColor))
          )
        }
  }

  private fun animateIn(pill: View) {
    pill.alpha = 0f
    pill.scaleX = HIDDEN_SCALE
    pill.scaleY = HIDDEN_SCALE
    pill.post {
      setHiddenPivot(pill)
      pill
          .animate()
          .alpha(1f)
          .scaleX(1f)
          .scaleY(1f)
          .setDuration(ANIMATION_DURATION_MS)
          .setInterpolator(DecelerateInterpolator())
          .start()
    }
  }

  private fun hideInternal() {
    val popup = devLoadingPopup ?: return
    if (!popup.isShowing || hideAnimator != null) {
      return
    }
    val pill = popup.contentView
    setHiddenPivot(pill)
    val animator =
        AnimatorSet().apply {
          playTogether(
              ObjectAnimator.ofFloat(pill, View.ALPHA, 0f),
              ObjectAnimator.ofFloat(pill, View.SCALE_X, HIDDEN_SCALE),
              ObjectAnimator.ofFloat(pill, View.SCALE_Y, HIDDEN_SCALE),
          )
          // Keeps a message that is shown and hidden in quick succession, such as a fast refresh,
          // on screen long enough to read.
          startDelay = maxOf(0L, MIN_PRESENTED_TIME_MS - (SystemClock.uptimeMillis() - showTimeMs))
          duration = ANIMATION_DURATION_MS
          interpolator = AccelerateInterpolator()
          addListener(
              object : AnimatorListenerAdapter() {
                private var canceled = false

                override fun onAnimationCancel(animation: Animator) {
                  canceled = true
                }

                override fun onAnimationEnd(animation: Animator) {
                  hideAnimator = null
                  // A new message canceled the hide, so the banner stays and returns to full size.
                  if (canceled) {
                    pill
                        .animate()
                        .alpha(1f)
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(ANIMATION_DURATION_MS)
                        .setInterpolator(DecelerateInterpolator())
                        .start()
                    return
                  }
                  if (popup.isShowing) {
                    popup.dismiss()
                  }
                  if (devLoadingPopup === popup) {
                    devLoadingPopup = null
                    devLoadingView = null
                  }
                }
              }
          )
        }
    hideAnimator = animator
    animator.start()
  }

  public companion object {
    private const val ANIMATION_DURATION_MS = 200L
    private const val MIN_PRESENTED_TIME_MS = 600L
    private const val HIDDEN_SCALE = 0.85f
    // The hidden state scales about a point this fraction of the banner's height above its center.
    private const val HIDDEN_ANCHOR_OFFSET = 0.05f

    private var isEnabled = true

    public fun setDevLoadingEnabled(enabled: Boolean) {
      isEnabled = enabled
    }

    private fun setHiddenPivot(pill: View) {
      pill.pivotX = pill.width / 2f
      pill.pivotY = pill.height * (0.5f - HIDDEN_ANCHOR_OFFSET)
    }

    private fun dpToPx(view: View, dp: Float): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, view.resources.displayMetrics)
            .toInt()
  }
}
