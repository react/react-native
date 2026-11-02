/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.os.Build
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import android.text.TextUtils
import androidx.annotation.RequiresApi
import androidx.core.graphics.createBitmap
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.verifyNoInteractions
import org.mockito.kotlin.any
import org.mockito.kotlin.eq
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import org.robolectric.annotation.TextLayoutMode

@RequiresApi(Build.VERSION_CODES.Q)
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [Build.VERSION_CODES.UPSIDE_DOWN_CAKE, Build.VERSION_CODES.VANILLA_ICE_CREAM])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@TextLayoutMode(TextLayoutMode.Mode.REALISTIC)
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
    val y = baseline + layout.paint.underlineThickness + 1f
    val canvas = mock<Canvas>()

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

    verify(canvas).drawLine(eq(x1), eq(y), eq(x2), eq(y), any())
  }

  @Test
  fun drawSpannedDecorationSkipsSpanEntirelyPastTailEllipsis() {
    val layout = buildTailEllipsizedLayout()
    val visibleEnd = layout.getLineStart(0) + layout.getEllipsisStart(0)

    for (style in TextDecorationStyle.entries) {
      val canvas = mock<Canvas>()
      drawSpannedDecoration(visibleEnd, TAIL_TEXT.length, canvas, layout, Color.BLACK, style) {
          _,
          lineBaseline,
          thickness ->
        lineBaseline + thickness + 1f
      }
      verifyNoInteractions(canvas)
    }
  }

  @Test
  fun skipsDecorationsOutsideTruncatedLayout() {
    val text =
        "Visible first line\n\nThird paragraph\n\nHidden decorated text: decorated text outside the one-line layout"
    val layout = buildLayout(text, text.indexOf('\n'))
    val start = text.indexOf("decorated text outside")
    assertThat(layout.lineCount).isEqualTo(1)
    assertThat(layout.text.length).isEqualTo(text.length)
    assertThat(layout.getLineEnd(0)).isLessThan(start)

    for (style in TextDecorationStyle.entries) {
      assertThat(drawDecoration(start, text.length, layout, style)).isZero()
    }
  }

  @Test
  fun clipsDecorationsCrossingTruncatedLayout() {
    val text = "Visible first line\nHidden decorated text"
    val layout = buildLayout(text, text.indexOf('\n'))
    assertThat(layout.getLineEnd(0)).isLessThan(text.length)

    for (style in TextDecorationStyle.entries) {
      assertThat(drawDecoration(8, text.length, layout, style)).isEqualTo(1)
    }
  }

  @Test
  fun keepsVisibleDecorations() {
    val layout = buildLayout("Visible first line")

    for (style in TextDecorationStyle.entries) {
      assertThat(drawDecoration(0, 7, layout, style)).isEqualTo(1)
    }
  }

  @Test
  fun skipsEmptyDecorations() {
    val layout = buildLayout("Visible first line")
    assertThat(drawDecoration(0, 0, layout, TextDecorationStyle.SOLID)).isZero()
  }

  @Test
  fun skipsZeroLineLayout() {
    val layout = mock<Layout>()
    assertThat(drawDecoration(0, 1, layout, TextDecorationStyle.SOLID)).isZero()
  }

  @Test
  fun keepsUntruncatedDecorations() {
    val text = "Visible first line\nHidden decorated text"
    val layout = buildLayout(text)

    for (style in TextDecorationStyle.entries) {
      assertThat(drawDecoration(8, text.length, layout, style)).isEqualTo(2)
    }
  }

  private fun buildLayout(text: String, end: Int = text.length): StaticLayout =
      StaticLayout.Builder.obtain(text, 0, end, TextPaint().apply { textSize = 20f }, 400).build()

  private fun drawDecoration(
      start: Int,
      end: Int,
      layout: Layout,
      style: TextDecorationStyle,
  ): Int {
    val canvas = Canvas(createBitmap(400, 200, Bitmap.Config.ARGB_8888))
    var drawnLines = 0
    drawSpannedDecoration(start, end, canvas, layout, Color.BLACK, style) { _, baseline, _ ->
      drawnLines++
      baseline
    }
    return drawnLines
  }

  /**
   * A single line, tail-ellipsized right after "Hello" because the paragraph break in [TAIL_TEXT]
   * hides everything after it once `maxLines` is reached.
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
