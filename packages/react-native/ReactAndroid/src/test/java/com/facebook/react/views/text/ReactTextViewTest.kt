/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.view.Gravity
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/**
 * Covers [ReactTextView.verticalGravityOffset], the offset that keeps CanvasEffectSpan decorations
 * (underline, strikethrough) tracking the glyphs when `textAlignVertical` shifts the text within a
 * taller box.
 */
@RunWith(RobolectricTestRunner::class)
class ReactTextViewTest {

  @Test
  fun topGravityNeverShifts() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.TOP, 200, 40)).isEqualTo(0)
  }

  @Test
  fun centerGravityShiftsByHalfTheSlack() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.CENTER_VERTICAL, 200, 40)).isEqualTo(80)
  }

  @Test
  fun bottomGravityShiftsByFullSlack() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.BOTTOM, 200, 40)).isEqualTo(160)
  }

  @Test
  fun centerGravityFloorsOddSlack() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.CENTER_VERTICAL, 101, 40)).isEqualTo(30)
  }

  @Test
  fun fullBoxDoesNotShift() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.CENTER_VERTICAL, 200, 200)).isEqualTo(0)
  }

  @Test
  fun overflowDoesNotShift() {
    assertThat(ReactTextView.verticalGravityOffset(Gravity.BOTTOM, 200, 260)).isEqualTo(0)
  }
}
