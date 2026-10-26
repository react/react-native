/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.keyboardavoidingview

import android.content.Context
import android.view.View
import androidx.annotation.UiThread
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsAnimationCompat
import androidx.core.view.WindowInsetsCompat
import com.facebook.react.fabric.StateWrapperImpl
import com.facebook.react.uimanager.PixelUtil.pxToDp
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.views.view.ReactViewGroup

/**
 * Follows the keyboard with [WindowInsetsAnimationCompat] and sends the keyboard inset to the
 * shared animation backend on each frame. The shadow node applies the inset to its layout.
 */
internal class ReactKeyboardAvoidingView(context: Context) : ReactViewGroup(context) {

  internal enum class Behavior {
    NONE,
    HEIGHT,
    PADDING,
    POSITION,
  }

  internal var stateWrapper: StateWrapper? = null
    set(value) {
      field = value
      scheduleUpdate()
    }

  internal var behavior: Behavior = Behavior.NONE
    set(value) {
      if (field != value) {
        field = value
        scheduleUpdate()
      }
    }

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
  private var lastKeyboardHeight = 0f
  private var targetKeyboardHeight = 0f
  private var lastTargetHeight = 0f
  // Keyboard height and inset when the keyboard started to move to its target.
  private var startKeyboardHeight = 0f
  private var startInset = 0f
  private var restingHeight = 0f
  private var appliedInset = 0f
  private var appliedRestingHeight = 0f

  private val updateRunnable = Runnable {
    isUpdateScheduled = false
    if (!isAnimating) {
      val keyboardHeight = currentKeyboardHeight()
      onKeyboardFrame(keyboardHeight, keyboardHeight)
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
          if (animation.isImeAnimation()) {
            // Insets are already in their end state when the animation starts.
            targetKeyboardHeight = currentKeyboardHeight()
            onKeyboardFrame(lastKeyboardHeight, targetKeyboardHeight)
          }
          return bounds
        }

        override fun onProgress(
            insets: WindowInsetsCompat,
            runningAnimations: MutableList<WindowInsetsAnimationCompat>,
        ): WindowInsetsCompat {
          if (runningAnimations.any { it.isImeAnimation() }) {
            onKeyboardFrame(
                insets.getInsets(WindowInsetsCompat.Type.ime()).bottom.toFloat().pxToDp(),
                targetKeyboardHeight,
            )
          }
          return insets
        }

        override fun onEnd(animation: WindowInsetsAnimationCompat) {
          if (animation.isImeAnimation()) {
            isAnimating = false
            val keyboardHeight = currentKeyboardHeight()
            onKeyboardFrame(keyboardHeight, keyboardHeight)
          }
        }
      }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    ViewCompat.setWindowInsetsAnimationCallback(this, insetsAnimationCallback)
    ViewCompat.setOnApplyWindowInsetsListener(this) { _, insets ->
      scheduleUpdate()
      insets
    }
    scheduleUpdate()
  }

  override fun onDetachedFromWindow() {
    ViewCompat.setWindowInsetsAnimationCallback(this, null)
    ViewCompat.setOnApplyWindowInsetsListener(this, null)
    removeCallbacks(updateRunnable)
    isUpdateScheduled = false
    isAnimating = false
    super.onDetachedFromWindow()
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    // A commit can not start inside a mount, so the update runs on the next loop.
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

  /** Overlap between the view (at rest) and a keyboard of the given height, in dp. */
  private fun relativeKeyboardHeight(keyboardHeight: Float): Float {
    if (keyboardHeight <= 0f) {
      return 0f
    }
    // `position` moves a content container: measure the view that holds it.
    val frameView: View = if (behavior == Behavior.POSITION) parent as? View ?: return 0f else this
    val frameY = frameView.top.toFloat().pxToDp()
    val frameHeight =
        if (behavior == Behavior.HEIGHT) restingHeight else frameView.height.toFloat().pxToDp()
    val keyboardY = rootView.height.toFloat().pxToDp() - keyboardHeight - keyboardVerticalOffset
    return maxOf(frameY + frameHeight - keyboardY, 0f)
  }

  @UiThread
  private fun onKeyboardFrame(keyboardHeight: Float, targetHeight: Float) {
    lastKeyboardHeight = keyboardHeight
    if (targetHeight != lastTargetHeight) {
      lastTargetHeight = targetHeight
      startKeyboardHeight = keyboardHeight
      startInset = appliedInset
    }

    // The mounting manager destroys the state when it deletes the view.
    val stateWrapper = (stateWrapper as? StateWrapperImpl)?.takeIf { it.isValid } ?: return
    if (behavior == Behavior.NONE && appliedInset == 0f) {
      return
    }

    if (appliedInset == 0f) {
      restingHeight = height.toFloat().pxToDp()
    }

    val targetInset = relativeKeyboardHeight(targetHeight)
    val distance = targetHeight - startKeyboardHeight
    val progress =
        if (distance != 0f) ((keyboardHeight - startKeyboardHeight) / distance).coerceIn(0f, 1f)
        else 1f
    val isActive = isAvoidanceEnabled && behavior != Behavior.NONE
    val inset = if (isActive) startInset + (targetInset - startInset) * progress else 0f

    if (inset == appliedInset && (inset == 0f || restingHeight == appliedRestingHeight)) {
      return
    }

    appliedInset = inset
    appliedRestingHeight = restingHeight
    KeyboardAvoidingViewBinding.update(stateWrapper, inset, restingHeight)
  }
}
