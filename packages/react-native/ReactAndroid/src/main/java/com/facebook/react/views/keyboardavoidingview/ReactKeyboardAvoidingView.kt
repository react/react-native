/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import android.content.Context
import android.view.ViewTreeObserver
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.bridge.ReactContext
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.views.view.ReactViewGroup

internal class ReactKeyboardAvoidingView(context: Context) : ReactViewGroup(context) {

  internal var isAvoidanceEnabled: Boolean = true
    set(value) {
      if (field != value) {
        field = value
        scheduleUpdate()
      }
    }

  /** In dp. */
  internal var keyboardVerticalOffset: Float = 0f
    set(value) {
      if (field != value) {
        field = value
        scheduleUpdate()
      }
    }

  private var isAnimating = false
  private var isUpdateScheduled = false

  // All values below are in dp.
  private var keyboardInset = 0f
  // Changes once per keyboard animation: at its end, or at the start of a hide.
  private var settledInset = 0f
  // `height` shrinks this view, so measure it while the keyboard doesn't overlap.
  private var heightWithoutKeyboard = 0f

  private val updateRunnable = Runnable {
    isUpdateScheduled = false
    if (!isAnimating) {
      updateKeyboardInset(currentKeyboardHeight())
    }
  }

  // An insets change lays out the window, even when an ancestor consumes the insets.
  private val globalLayoutListener =
      ViewTreeObserver.OnGlobalLayoutListener {
        if (!isAnimating) {
          scheduleUpdate()
        }
      }

  private val insetsAnimationCallback =
      object : WindowInsetsAnimationCompat.Callback(DISPATCH_MODE_CONTINUE_ON_SUBTREE) {
        override fun onPrepare(animation: WindowInsetsAnimationCompat) {
          if (animation.isImeAnimation()) {
            isAnimating = true
          }
        }

        override fun onStart(
            animation: WindowInsetsAnimationCompat,
            bounds: WindowInsetsAnimationCompat.BoundsCompat,
        ): WindowInsetsAnimationCompat.BoundsCompat {
          // Root insets hold the end value.
          if (
              animation.isImeAnimation() &&
                  settledInset != 0f &&
                  (!isAvoidanceEnabled || keyboardOverlap(currentKeyboardHeight()) == 0f)
          ) {
            dispatchInsetChange(keyboardInset, 0f)
          }
          return bounds
        }

        override fun onProgress(
            insets: WindowInsetsCompat,
            runningAnimations: MutableList<WindowInsetsAnimationCompat>,
        ): WindowInsetsCompat {
          if (runningAnimations.any { it.isImeAnimation() }) {
            updateKeyboardInset(
                insets.getInsets(WindowInsetsCompat.Type.ime()).bottom.toFloat().pxToDp()
            )
          }
          return insets
        }

        override fun onEnd(animation: WindowInsetsAnimationCompat) {
          if (animation.isImeAnimation()) {
            isAnimating = false
            updateKeyboardInset(currentKeyboardHeight())
          }
        }
      }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    ViewCompat.setWindowInsetsAnimationCallback(this, insetsAnimationCallback)
    viewTreeObserver.addOnGlobalLayoutListener(globalLayoutListener)
    scheduleUpdate()
  }

  override fun onDetachedFromWindow() {
    ViewCompat.setWindowInsetsAnimationCallback(this, null)
    viewTreeObserver.removeOnGlobalLayoutListener(globalLayoutListener)
    removeCallbacks(updateRunnable)
    isAnimating = false
    isUpdateScheduled = false
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    // Can't commit inside a mount.
    if (changed) {
      scheduleUpdate()
    }
  }

  private fun scheduleUpdate() {
    if (!isUpdateScheduled && isAttachedToWindow) {
      isUpdateScheduled = true
      post(updateRunnable)
    }
  }

  private fun WindowInsetsAnimationCompat.isImeAnimation(): Boolean =
      (typeMask and WindowInsetsCompat.Type.ime()) != 0

  private fun currentKeyboardHeight(): Float {
    val insets = ViewCompat.getRootWindowInsets(this) ?: return 0f
    return insets.getInsets(WindowInsetsCompat.Type.ime()).bottom.toFloat().pxToDp()
  }

  private fun keyboardOverlap(keyboardHeight: Float): Float {
    if (keyboardHeight <= 0f) {
      return 0f
    }

    val frameY = top.toFloat().pxToDp()
    val keyboardY = rootView.height.toFloat().pxToDp() - keyboardHeight - keyboardVerticalOffset
    return maxOf(frameY + heightWithoutKeyboard - keyboardY, 0f)
  }

  @UiThread
  private fun updateKeyboardInset(keyboardHeight: Float) {
    if (keyboardInset == 0f) {
      heightWithoutKeyboard = height.toFloat().pxToDp()
    }

    val inset = if (isAvoidanceEnabled) keyboardOverlap(keyboardHeight) else 0f
    dispatchInsetChange(inset, if (!isAnimating || inset == 0f) inset else settledInset)
  }

  @UiThread
  private fun dispatchInsetChange(inset: Float, settled: Float) {
    if (inset == keyboardInset && settled == settledInset) {
      return
    }

    val reactContext = context as? ReactContext ?: return
    val eventDispatcher = UIManagerHelper.getEventDispatcher(reactContext) ?: return

    keyboardInset = inset
    settledInset = settled

    val maxHeight =
        if (inset > 0f) maxOf(heightWithoutKeyboard - inset, 0f) else Float.POSITIVE_INFINITY

    eventDispatcher.dispatchEvent(
        KeyboardInsetChangeEvent(
            UIManagerHelper.getSurfaceId(this),
            id,
            inset,
            maxHeight,
            settled,
        )
    )
  }
}
