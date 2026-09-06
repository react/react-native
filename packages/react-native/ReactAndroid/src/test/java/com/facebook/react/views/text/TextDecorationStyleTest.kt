/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Canvas
import android.graphics.Color
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner

@RunWith(RobolectricTestRunner::class)
class TextDecorationStyleTest {
  @Test
  fun fromStringSolid() {
    assertThat(TextDecorationStyle.fromString("solid")).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringDouble() {
    assertThat(TextDecorationStyle.fromString("double")).isEqualTo(TextDecorationStyle.DOUBLE)
  }

  @Test
  fun fromStringDotted() {
    assertThat(TextDecorationStyle.fromString("dotted")).isEqualTo(TextDecorationStyle.DOTTED)
  }

  @Test
  fun fromStringDashed() {
    assertThat(TextDecorationStyle.fromString("dashed")).isEqualTo(TextDecorationStyle.DASHED)
  }

  @Test
  fun fromStringWavy() {
    assertThat(TextDecorationStyle.fromString("wavy")).isEqualTo(TextDecorationStyle.WAVY)
  }

  @Test
  fun fromStringNullDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString(null)).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringUnknownDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString("unknown")).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun fromStringEmptyDefaultsToSolid() {
    assertThat(TextDecorationStyle.fromString("")).isEqualTo(TextDecorationStyle.SOLID)
  }

  @Test
  fun drawSpannedDecorationClampsSpanPastTailEllipsis() {
    val layout = buildTailEllipsizedLayout()
    val visibleEnd = layout.getLineStart(0) + layout.getEllipsisStart(0)
    val baseline = layout.getLineBaseline(0).toFloat()
    val x1 = layout.getPrimaryHorizontal(0)
    val x2 = layout.getPrimaryHorizontal(visibleEnd)
    val canvas = mock<Canvas>()

    // The span covers the whole string, well past what survived the ellipsis; pre-fix this
    // called layout.getPrimaryHorizontal(TAIL_TEXT.length) and crashed with
    // IndexOutOfBoundsException, since the ellipsized layout only resolves up to visibleEnd.
    drawSpannedDecoration(
        0,
        TAIL_TEXT.length,
        canvas,
        layout,
        Color.BLACK,
        TextDecorationStyle.SOLID,
    ) { _, lineBaseline, thickness ->
      lineBaseline + thickness + 1f
    }

    verify(canvas).drawLine(eq(x1), eq(baseline + 1f), eq(x2), eq(baseline + 1f), any())
  }

  @Test
  fun drawSpannedDecorationSkipsSpanEntirelyPastTailEllipsis() {
    val layout = buildTailEllipsizedLayout()
    val visibleEnd = layout.getLineStart(0) + layout.getEllipsisStart(0)
    val baseline = layout.getLineBaseline(0).toFloat()
    val x = layout.getPrimaryHorizontal(visibleEnd)
    val canvas = mock<Canvas>()

    // The whole span (e.g. a nested Text) starts after the ellipsis, fully hidden: it must
    // collapse to a zero-length line at the visible boundary, not draw anything past it.
    drawSpannedDecoration(
        visibleEnd,
        TAIL_TEXT.length,
        canvas,
        layout,
        Color.BLACK,
        TextDecorationStyle.SOLID,
    ) { _, lineBaseline, thickness ->
      lineBaseline + thickness + 1f
    }

    verify(canvas).drawLine(eq(x), eq(baseline + 1f), eq(x), eq(baseline + 1f), any())
  }

  /**
   * A single line, tail-ellipsized right after "Hello" because the paragraph break in
   * [TAIL_TEXT] hides everything after it once `maxLines` is reached.
   */
  private fun buildTailEllipsizedLayout(): StaticLayout {
    val paint = TextPaint().apply { textSize = 32f }
    val layout =
        StaticLayout.Builder.obtain(TAIL_TEXT, 0, TAIL_TEXT.length, paint, 400)
            .setMaxLines(1)
            .setEllipsize(TextUtils.TruncateAt.END)
            .build()
    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.getEllipsisCount(0)).isGreaterThan(0)
    return layout
  }

  private companion object {
    const val TAIL_TEXT = "Hello\ndecorated world"
  }
}
