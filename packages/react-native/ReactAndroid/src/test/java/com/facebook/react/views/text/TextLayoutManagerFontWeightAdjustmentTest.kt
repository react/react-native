/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.TextPaint
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34])
class TextLayoutManagerFontWeightAdjustmentTest {

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun `plain text paint applies Android font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    TextLayoutManager.updateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT,
    )

    assertThat(paint.typeface).isNotNull
  }

  @Test
  fun `plain text paint keeps default typeface unset without font weight adjustment`() {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG)
    val textAttributes = TextAttributeProps.fromReadableMap(ReactStylesDiffMap(JavaOnlyMap()))

    TextLayoutManager.updateTextPaint(
        paint,
        textAttributes,
        RuntimeEnvironment.getApplication().assets,
        0,
    )

    assertThat(paint.typeface).isNull()
  }

  private companion object {
    const val FONT_WEIGHT_ADJUSTMENT_BOLD_TEXT = 300
  }
}
