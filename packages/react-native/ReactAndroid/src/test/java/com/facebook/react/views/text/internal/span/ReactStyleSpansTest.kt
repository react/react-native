/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.graphics.Color
import android.text.ParcelableSpan
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.BackgroundColorSpan
import android.text.style.ForegroundColorSpan
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class ReactStyleSpansTest {
  @Test
  fun `style spans are not platform parcelable spans`() {
    assertThat(ReactForegroundColorSpan(Color.RED)).isNotInstanceOf(ParcelableSpan::class.java)
    assertThat(ReactBackgroundColorSpan(Color.BLUE)).isNotInstanceOf(ParcelableSpan::class.java)
    assertThat(ReactAbsoluteSizeSpan(34)).isNotInstanceOf(ParcelableSpan::class.java)
  }

  @Test
  fun `foreground color matches the platform span`() {
    val span = ReactForegroundColorSpan(Color.RED)
    val paint = TextPaint()
    val platformPaint = TextPaint()

    span.updateDrawState(paint)
    ForegroundColorSpan(Color.RED).updateDrawState(platformPaint)

    assertThat(paint.color).isEqualTo(platformPaint.color)
    assertThat(span.foregroundColor).isEqualTo(Color.RED)
  }

  @Test
  fun `background color matches the platform span`() {
    val span = ReactBackgroundColorSpan(Color.BLUE)
    val paint = TextPaint()
    val platformPaint = TextPaint()

    span.updateDrawState(paint)
    BackgroundColorSpan(Color.BLUE).updateDrawState(platformPaint)

    assertThat(paint.bgColor).isEqualTo(platformPaint.bgColor)
    assertThat(span.backgroundColor).isEqualTo(Color.BLUE)
  }

  @Test
  fun `absolute size matches the platform span for drawing and measurement`() {
    val span = ReactAbsoluteSizeSpan(34)
    val platformSpan = AbsoluteSizeSpan(34)
    val paint = TextPaint().apply { density = 2f }
    val platformPaint = TextPaint().apply { density = 2f }

    span.updateDrawState(paint)
    platformSpan.updateDrawState(platformPaint)
    assertThat(paint.textSize).isEqualTo(platformPaint.textSize)

    paint.textSize = 12f
    platformPaint.textSize = 12f
    span.updateMeasureState(paint)
    platformSpan.updateMeasureState(platformPaint)
    assertThat(paint.textSize).isEqualTo(platformPaint.textSize)
    assertThat(span.size).isEqualTo(34)
  }
}
