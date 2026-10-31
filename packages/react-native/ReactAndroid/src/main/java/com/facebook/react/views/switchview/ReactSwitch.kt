/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.content.Context
import android.content.res.ColorStateList
import android.graphics.PorterDuff
import android.graphics.PorterDuffColorFilter
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.Drawable
import android.graphics.drawable.RippleDrawable
import androidx.appcompat.widget.SwitchCompat
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable

/**
 * Switch that has its value controlled by JS. Whenever the value of the switch changes, we do not
 * allow any other changes to that switch until JS sets a value explicitly. This stops the Switch
 * from changing its value multiple times, when those changes have not been processed by JS first.
 */
internal class ReactSwitch(context: Context) : SwitchCompat(context) {

  private var allowChange = true
  private var trackColorForFalse: Int? = null
  private var trackColorForTrue: Int? = null
  private var rippleColor: Int? = null

  override fun setChecked(checked: Boolean) {
    if (allowChange && isChecked != checked) {
      allowChange = false
      super.setChecked(checked)
      setTrackColor(checked)
    } else {
      // Even if mAllowChange is set to false or the checked value hasn't changed, we still must
      // call the super method, since it will make sure the thumb is moved back to the correct edge.
      // Without calling the super method, the thumb might stuck in the middle of the switch.
      super.setChecked(isChecked)
    }
  }

  override fun setBackgroundColor(color: Int) {
    val ripple =
        RippleDrawable(
            createRippleDrawableColorStateList(rippleColor ?: color),
            ColorDrawable(color),
            null,
        )
    // Keep the outline, box shadows and other styles layered over the background by
    // BackgroundStyleApplicator, which may have been applied before the background color.
    val composite = background as? CompositeBackgroundDrawable
    background = composite?.withNewOriginalBackground(ripple) ?: ripple
  }

  fun setColor(drawable: Drawable, color: Int?) {
    if (color == null) {
      drawable.clearColorFilter()
    } else {
      drawable.colorFilter = PorterDuffColorFilter(color, PorterDuff.Mode.MULTIPLY)
    }
  }

  fun setTrackColor(color: Int?) {
    setColor(super.getTrackDrawable(), color)
  }

  fun setThumbColor(color: Int?) {
    setColor(super.getThumbDrawable(), color)

    // Set the ripple color if the background is, or is wrapped around, a RippleDrawable
    val currentBackground = super.getBackground()
    val ripple =
        (currentBackground as? CompositeBackgroundDrawable)?.originalBackground as? RippleDrawable
            ?: currentBackground as? RippleDrawable
    rippleColor = color
    if (color != null && ripple != null) {
      ripple.setColor(createRippleDrawableColorStateList(color))
    }
  }

  fun setOn(on: Boolean) {
    // If the switch has a different value than the value sent by JS, we must change it.
    if (isChecked != on) {
      super.setChecked(on)
      setTrackColor(on)
    }
    allowChange = true
  }

  fun setTrackColorForTrue(color: Int?) {
    if (color == trackColorForTrue) {
      return
    }
    trackColorForTrue = color
    if (isChecked) {
      setTrackColor(trackColorForTrue)
    }
  }

  fun setTrackColorForFalse(color: Int?) {
    if (color == trackColorForFalse) {
      return
    }
    trackColorForFalse = color
    if (!isChecked) {
      setTrackColor(trackColorForFalse)
    }
  }

  private fun setTrackColor(checked: Boolean) {
    if (trackColorForTrue != null || trackColorForFalse != null) {
      // Update the track color to reflect the new value. We only want to do this if these
      // props were actually set from JS; otherwise we'll just reset the color to the default.
      val currentTrackColor = if (checked) trackColorForTrue else trackColorForFalse
      setTrackColor(currentTrackColor)
    }
  }

  private fun createRippleDrawableColorStateList(color: Int): ColorStateList =
      ColorStateList(arrayOf(intArrayOf(android.R.attr.state_pressed)), intArrayOf(color))
}
