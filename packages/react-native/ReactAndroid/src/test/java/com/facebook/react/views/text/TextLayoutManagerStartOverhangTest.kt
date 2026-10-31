/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.graphics.RectF
import android.graphics.text.LineBreakConfig
import android.text.Layout
import android.text.SpannableString
import android.text.TextPaint
import android.text.TextUtils
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
class TextLayoutManagerStartOverhangTest {

  @Test
  @Config(sdk = [35])
  fun `EXACTLY mode enables Android 15 start overhang support`() {
    val layout = createLayout(YogaMeasureMode.EXACTLY)

    assertThat(getBooleanLayoutProperty(layout, "getUseBoundsForWidth")).isTrue()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isTrue()
  }

  @Test
  @Config(sdk = [35])
  fun `AT_MOST mode keeps advance based width measurement`() {
    val layout = createLayout(YogaMeasureMode.AT_MOST)

    assertThat(getBooleanLayoutProperty(layout, "getUseBoundsForWidth")).isFalse()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isFalse()
  }

  @Test
  @Config(sdk = [35])
  fun `EXACTLY mode keeps advance based width measurement for LTR text`() {
    val layout =
        createLayout(
            YogaMeasureMode.EXACTLY,
            text = SpannableString("Just listed"),
            ellipsizeMode = TextUtils.TruncateAt.END,
            maxNumberOfLines = 1,
        )

    assertThat(getBooleanLayoutProperty(layout, "getUseBoundsForWidth")).isFalse()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isFalse()
  }

  @Test
  @Config(sdk = [35])
  fun `EXACTLY mode enables start overhang support for mixed LTR and RTL text`() {
    val layout = createLayout(YogaMeasureMode.EXACTLY, text = SpannableString("Hello שלום"))

    assertThat(getBooleanLayoutProperty(layout, "getUseBoundsForWidth")).isTrue()
  }

  @Test
  @Config(sdk = [35])
  fun `RTL right overhang is rounded up to reserve whole pixels`() {
    val layout = mock<Layout>()
    whenever(layout.lineCount).thenReturn(2)
    whenever(layout.width).thenReturn(200)
    whenever(layout.getParagraphDirection(any())).thenReturn(Layout.DIR_RIGHT_TO_LEFT)
    whenever(layout.computeDrawingBoundingBox()).thenReturn(RectF(10f, 0f, 207.1f, 40f))

    assertThat(TextLayoutManager.getRtlRightOverhang(layout)).isEqualTo(8)
  }

  @Test
  @Config(sdk = [35])
  fun `RTL overhang reservation preserves max lines and ellipsis`() {
    val initialLayout = mock<Layout>()
    whenever(initialLayout.lineCount).thenReturn(2)
    whenever(initialLayout.width).thenReturn(LAYOUT_WIDTH.toInt())
    whenever(initialLayout.getParagraphDirection(any())).thenReturn(Layout.DIR_RIGHT_TO_LEFT)
    whenever(initialLayout.computeDrawingBoundingBox())
        .thenReturn(RectF(10f, 0f, LAYOUT_WIDTH + 7.1f, 40f))
    var rebuiltWidth = 0

    val layout =
        TextLayoutManager.adjustLayoutForRtlRightOverhang(
            initialLayout,
            LAYOUT_WIDTH.toInt(),
        ) { adjustedWidth ->
          rebuiltWidth = adjustedWidth
          createLayout(
              YogaMeasureMode.EXACTLY,
              text =
                  SpannableString(
                      listOf(
                              "\u200Ffirst paragraph",
                              "\u200Fsecond paragraph",
                              "\u200Fthird paragraph",
                          )
                          .joinToString("\n"),
                  ),
              layoutWidth = adjustedWidth.toFloat(),
              ellipsizeMode = TextUtils.TruncateAt.END,
              maxNumberOfLines = 2,
          )
        }

    assertThat(rebuiltWidth).isEqualTo(192)
    assertThat(layout.width).isEqualTo(rebuiltWidth)
    assertThat(layout.lineCount).isEqualTo(2)
    assertThat(layout.getEllipsisCount(layout.lineCount - 1)).isGreaterThan(0)
  }

  @Test
  @Config(sdk = [35])
  fun `mixed direction text does not reserve RTL right overhang`() {
    val initialLayout = mock<Layout>()
    whenever(initialLayout.lineCount).thenReturn(2)
    whenever(initialLayout.width).thenReturn(200)
    whenever(initialLayout.getParagraphDirection(0)).thenReturn(Layout.DIR_RIGHT_TO_LEFT)
    whenever(initialLayout.getParagraphDirection(1)).thenReturn(Layout.DIR_LEFT_TO_RIGHT)
    whenever(initialLayout.computeDrawingBoundingBox()).thenReturn(RectF(10f, 0f, 208f, 40f))

    val layout =
        TextLayoutManager.adjustLayoutForRtlRightOverhang(initialLayout, 200) {
          throw AssertionError("Mixed-direction text must not be rebuilt")
        }

    assertThat(layout).isSameAs(initialLayout)
  }

  @Test
  @Config(sdk = [35])
  fun `mixed paragraph directions disable the start overhang drawing shift`() {
    // The blank line between the RTL paragraphs has no strong character, so it is laid out LTR.
    val layout =
        createLayout(
            YogaMeasureMode.EXACTLY,
            text = SpannableString("שלום\n\nעולם"),
            maxNumberOfLines = 0,
        )

    assertThat(TextLayoutManager.hasMixedParagraphDirections(layout)).isTrue()
    assertThat(getBooleanLayoutProperty(layout, "getUseBoundsForWidth")).isTrue()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isFalse()
  }

  @Test
  @Config(sdk = [35])
  fun `mixed paragraph directions support requested line breaking styles`() {
    val layout =
        createLayout(
            YogaMeasureMode.EXACTLY,
            text = SpannableString("שלום\n\nעולם"),
            maxNumberOfLines = 0,
            lineBreakStyle = LineBreakConfig.LINE_BREAK_STYLE_STRICT,
            lineBreakWordStyle = LineBreakConfig.LINE_BREAK_WORD_STYLE_PHRASE,
        )

    assertThat(TextLayoutManager.hasMixedParagraphDirections(layout)).isTrue()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isFalse()
  }

  @Test
  @Config(sdk = [35])
  fun `single paragraph direction keeps the start overhang drawing shift`() {
    val layout =
        createLayout(
            YogaMeasureMode.EXACTLY,
            text = SpannableString("שלום\nעולם"),
            maxNumberOfLines = 0,
        )

    assertThat(TextLayoutManager.hasMixedParagraphDirections(layout)).isFalse()
    assertThat(getBooleanLayoutProperty(layout, "getShiftDrawingOffsetForStartOverhang")).isTrue()
  }

  @Test
  @Config(sdk = [34])
  fun `EXACTLY mode remains supported before Android 15`() {
    val layout = createLayout(YogaMeasureMode.EXACTLY)

    assertThat(layout.width).isEqualTo(LAYOUT_WIDTH.toInt())
  }

  private fun createLayout(
      widthMode: YogaMeasureMode,
      text: SpannableString =
          SpannableString("\u0622\u064a\u0629 \u0627\u0644\u0643\u0631\u0633\u064a"),
      layoutWidth: Float = LAYOUT_WIDTH,
      ellipsizeMode: TextUtils.TruncateAt? = null,
      maxNumberOfLines: Int = 2,
      paint: TextPaint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f },
      lineBreakStyle: Int = LineBreakConfig.LINE_BREAK_STYLE_NONE,
      lineBreakWordStyle: Int = LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
  ): Layout =
      TextLayoutManager.createLayout(
          text,
          /* boring = */ null,
          layoutWidth,
          widthMode,
          /* includeFontPadding = */ false,
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
          lineBreakStyle,
          lineBreakWordStyle,
          Layout.Alignment.ALIGN_NORMAL,
          /* justificationMode = */ 0,
          /* ellipsizeMode = */ ellipsizeMode,
          /* maxNumberOfLines = */ maxNumberOfLines,
          paint,
      )

  private fun getBooleanLayoutProperty(layout: Layout, methodName: String): Boolean =
      layout.javaClass.getMethod(methodName).invoke(layout) as Boolean

  private companion object {
    const val LAYOUT_WIDTH = 200f
  }
}
