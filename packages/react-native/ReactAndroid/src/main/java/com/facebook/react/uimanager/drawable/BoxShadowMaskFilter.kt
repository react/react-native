/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.BlurMaskFilter
import com.facebook.react.uimanager.FilterHelper

// "the resulting shadow must approximate {...} a Gaussian blur with a standard deviation equal
// to half the blur radius"
// https://www.w3.org/TR/css-backgrounds-3/#shadow-blur
private const val BLUR_RADIUS_SIGMA_SCALE = 0.5f

/** The mask filter that blurs a box shadow by [blurRadius], or null when no blur shows. */
internal fun createBoxShadowMaskFilter(blurRadius: Float): BlurMaskFilter? {
  val convertedBlurRadius = FilterHelper.sigmaToRadius(blurRadius * BLUR_RADIUS_SIGMA_SCALE)
  return if (convertedBlurRadius > 0) {
    BlurMaskFilter(convertedBlurRadius, BlurMaskFilter.Blur.NORMAL)
  } else {
    null
  }
}
