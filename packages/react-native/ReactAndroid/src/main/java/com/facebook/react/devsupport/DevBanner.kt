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
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.PopupWindow
import android.widget.TextView
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.common.logging.FLog
import com.facebook.react.R
import com.facebook.react.common.ReactConstants

/**
 * A floating capsule at the top of the screen, in a popup window above the app, for messages shown
 * during development. It sits below the status bar, keeps clear of the side insets, and animates in
 * and out. Banners stack: while several are visible, each sits below those with a lower stack
 * level. The dev loading banner is one; each instance hosts one capsule at a time, and subclasses
 * shape theirs through the open members. UI thread only.
 */
internal open class DevBanner(private val reactInstanceDevHelper: ReactInstanceDevHelper) {
  /**
   * The space between the capsule's edges and its label, or its leading icon where there is one.
   */
  internal data class LabelPadding(
      val top: Float,
      val start: Float,
      val bottom: Float,
      val end: Float,
  )

  private var textView: TextView? = null
  private var popup: PopupWindow? = null
  private var pill: View? = null
  private var hideAnimator: Animator? = null
  private var showTimeMs = 0L
  // The capsule's own top offset, before any banner stacked above it pushes it down.
  private var topOffsetPx = 0

  /** Whether the capsule is on screen or animating out. */
  val isVisible: Boolean
    get() = popup?.isShowing == true

  // Hooks for subclasses, each with the loading banner's behavior by default.

  /** The window type of the banner's popup; sub panels sit above panels. */
  protected open val windowLayoutType: Int = WindowManager.LayoutParams.TYPE_APPLICATION_SUB_PANEL

  /** Whether the popup dims the app beneath the capsule and swallows touches on it. */
  protected open val dimsBackground: Boolean = false

  /** Banners with a lower level stack above those with a higher one. */
  open val stackLevel: Int = 1

  /** The capsule's minimum height. */
  protected open val minHeightDp: Float = MIN_HEIGHT_DP

  protected open val labelPaddingDp: LabelPadding = LabelPadding(10f, 14f, 10f, 14f)

  /** A drawable shown before the label, or 0 for none. */
  protected open val leadingIconRes: Int = 0

  protected open val leadingIconSizeDp: Float = 0f

  /** How the label's lines align within it. */
  protected open val messageGravity: Int = Gravity.CENTER

  /** The label's text for a message. */
  protected open fun formatMessage(pill: View, message: String, textColor: Int): CharSequence =
      message

  /** The capsule's content description, or null to expose its children instead. */
  protected open fun contentDescription(pill: View, message: String): CharSequence? = null

  /** What a tap on the capsule does. */
  protected open fun onTap() {
    hide()
  }

  /** Shows the message, replacing any capsule already on screen. */
  fun show(message: String, textColor: Int, backgroundColor: Int, dismissButton: Boolean) {
    // A new message replaces one that is still animating out.
    hideAnimator?.cancel()
    showTimeMs = SystemClock.uptimeMillis()

    val existingPopup = popup
    val existingPill = pill
    if (existingPopup?.isShowing == true && existingPill != null) {
      applyContent(existingPill, message, textColor, backgroundColor, dismissButton)
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
      applyContent(pill, message, textColor, backgroundColor, dismissButton)

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
      val iconView = pill.findViewById<View>(R.id.leading_icon)
      val dismissButtonWidth =
          if (dismissButton) {
            (dismissButtonView.layoutParams as ViewGroup.MarginLayoutParams).let {
              it.width + it.marginStart
            }
          } else {
            0
          }
      val iconWidth =
          if (leadingIconRes != 0) {
            (iconView.layoutParams as ViewGroup.MarginLayoutParams).let { it.width + it.marginEnd }
          } else {
            0
          }
      textView.maxWidth =
          decorView.width -
              2 * sideInset -
              pill.paddingStart -
              pill.paddingEnd -
              dismissButtonWidth -
              iconWidth

      pill.setOnClickListener { onTap() }
      dismissButtonView.setOnClickListener { hide() }

      topOffsetPx = if (topInset > 0) topInset + dpToPx(pill, 12f) else dpToPx(pill, 16f)
      val content: View =
          if (dimsBackground) {
            // Dims the app and swallows touches while the banner says it cannot respond to them.
            // The capsule sits inside, so it stays interactive.
            FrameLayout(currentActivity).apply {
              setBackgroundColor(DIMMING_COLOR)
              isClickable = true
              addView(
                  pill,
                  FrameLayout.LayoutParams(
                          ViewGroup.LayoutParams.WRAP_CONTENT,
                          ViewGroup.LayoutParams.WRAP_CONTENT,
                          Gravity.TOP or Gravity.CENTER_HORIZONTAL,
                      )
                      .apply { topMargin = topOffsetPx },
              )
            }
          } else {
            pill
          }
      val size =
          if (dimsBackground) ViewGroup.LayoutParams.MATCH_PARENT
          else ViewGroup.LayoutParams.WRAP_CONTENT
      val popup = PopupWindow(content, size, size)
      popup.windowLayoutType = windowLayoutType
      if (dimsBackground) {
        // The dimming covers the whole screen, system bars included, which also keeps the
        // capsule's top offset in screen coordinates like the other banners'.
        popup.isClippingEnabled = false
      }
      this.pill = pill
      popup.showAtLocation(
          decorView,
          Gravity.TOP or Gravity.CENTER_HORIZONTAL,
          0,
          if (dimsBackground) 0 else topOffsetPx + stackOffsetPx(),
      )
      // A new message resizes the window about its center. Without this, the system animates that
      // move, so the capsule grows from its old left edge and then slides back to center.
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val popupRoot = content.rootView
        (popupRoot.layoutParams as? WindowManager.LayoutParams)?.let {
          it.setCanPlayMoveAnimation(false)
          currentActivity.windowManager.updateViewLayout(popupRoot, it)
        }
      }
      this.textView = textView
      this.popup = popup
      visibleBanners.add(this)
      // The capsule's height is known once it has been laid out.
      pill.post { updateOtherBanners() }
      animateIn(pill)
      if (content !== pill) {
        content.alpha = 0f
        content.animate().alpha(1f).setDuration(ANIMATION_DURATION_MS).start()
      }

      // TODO T164786028: Find out the root cause of the BadTokenException exception here
    } catch (e: WindowManager.BadTokenException) {
      FLog.e(
          ReactConstants.TAG,
          "Unable to display loading message because react activity isn't active, message: $message",
      )
    }
  }

  /**
   * Replaces the text of the capsule on screen, for updates that arrive quickly such as progress.
   */
  fun updateMessage(message: CharSequence) {
    textView?.text = message
  }

  /** Animates the capsule out, after it has been on screen long enough to read. */
  fun hide() {
    val popup = popup ?: return
    val pill = pill ?: return
    if (!popup.isShowing || hideAnimator != null) {
      return
    }
    setHiddenPivot(pill)
    val animator =
        AnimatorSet().apply {
          val animators =
              mutableListOf<Animator>(
                  ObjectAnimator.ofFloat(pill, View.ALPHA, 0f),
                  ObjectAnimator.ofFloat(pill, View.SCALE_X, HIDDEN_SCALE),
                  ObjectAnimator.ofFloat(pill, View.SCALE_Y, HIDDEN_SCALE),
              )
          if (popup.contentView !== pill) {
            animators.add(ObjectAnimator.ofFloat(popup.contentView, View.ALPHA, 0f))
          }
          playTogether(animators)
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
                    popup.contentView.animate().alpha(1f).setDuration(ANIMATION_DURATION_MS).start()
                    return
                  }
                  if (popup.isShowing) {
                    popup.dismiss()
                  }
                  if (this@DevBanner.popup === popup) {
                    this@DevBanner.popup = null
                    textView = null
                    this@DevBanner.pill = null
                  }
                  visibleBanners.remove(this@DevBanner)
                  updateOtherBanners()
                }
              }
          )
        }
    hideAnimator = animator
    animator.start()
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
    pill.minimumHeight = dpToPx(pill, minHeightDp)
    val textView = pill.findViewById<TextView>(R.id.loading_text)
    textView.text = formatMessage(pill, message, textColor)
    textView.setTextColor(textColor)
    textView.gravity = messageGravity
    val padding = labelPaddingDp
    textView.setPadding(0, dpToPx(pill, padding.top), 0, dpToPx(pill, padding.bottom))

    val iconView = pill.findViewById<ImageView>(R.id.leading_icon)
    if (leadingIconRes != 0) {
      iconView.setImageResource(leadingIconRes)
      iconView.layoutParams =
          iconView.layoutParams.apply {
            width = dpToPx(pill, leadingIconSizeDp)
            height = dpToPx(pill, leadingIconSizeDp)
          }
      iconView.visibility = View.VISIBLE
    } else {
      iconView.visibility = View.GONE
    }
    pill.contentDescription = contentDescription(pill, message)

    val dismissButtonView = pill.findViewById<ImageView>(R.id.dismiss_button)
    dismissButtonView.visibility = if (dismissButton) View.VISIBLE else View.GONE
    // The round button sits closer to the capsule's end than the text would.
    pill.setPaddingRelative(
        dpToPx(pill, padding.start),
        pill.paddingTop,
        dpToPx(pill, if (dismissButton) 9f else padding.end),
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

  private fun stackOffsetPx(): Int {
    val pill = pill ?: return 0
    return visibleBanners.sumOf {
      val other = it.pill
      if (it !== this && other != null && it.stackLevel < stackLevel) {
        other.height + dpToPx(pill, STACK_SPACING_DP)
      } else {
        0
      }
    }
  }

  // Moves the capsule under the banners stacked above it. A dimming banner is never pushed down.
  private fun updatePlacement() {
    val popup = popup ?: return
    if (!popup.isShowing || dimsBackground) {
      return
    }
    popup.update(0, topOffsetPx + stackOffsetPx(), -1, -1)
  }

  private fun updateOtherBanners() {
    for (banner in visibleBanners.toList()) {
      if (banner !== this) {
        banner.updatePlacement()
      }
    }
  }

  private companion object {
    private const val ANIMATION_DURATION_MS = 200L
    private const val MIN_PRESENTED_TIME_MS = 600L
    private const val HIDDEN_SCALE = 0.85f
    // The hidden state scales about a point this fraction of the banner's height above its center.
    private const val HIDDEN_ANCHOR_OFFSET = 0.05f
    private const val MIN_HEIGHT_DP = 40f
    private const val STACK_SPACING_DP = 12f
    private val DIMMING_COLOR = Color.argb(51, 0, 0, 0)

    // The banners currently shown, so one can stack below another. Touched on the UI thread only.
    private val visibleBanners = mutableListOf<DevBanner>()

    private fun setHiddenPivot(pill: View) {
      pill.pivotX = pill.width / 2f
      pill.pivotY = pill.height * (0.5f - HIDDEN_ANCHOR_OFFSET)
    }

    private fun dpToPx(view: View, dp: Float): Int =
        TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, dp, view.resources.displayMetrics)
            .toInt()
  }
}
