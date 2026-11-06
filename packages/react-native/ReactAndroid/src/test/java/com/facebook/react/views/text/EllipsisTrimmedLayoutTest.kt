/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:OptIn(UnstableReactNativeAPI::class)

package com.facebook.react.views.text

import android.annotation.SuppressLint
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.Typeface
import android.graphics.text.LineBreakConfig
import android.text.Layout
import android.text.Spannable
import android.text.SpannableString
import android.text.TextPaint
import android.text.TextUtils
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.ReplacementSpan
import android.text.style.StyleSpan
import android.view.View
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.StatefulSpan
import com.facebook.react.views.text.internal.span.TextEffectSpan
import com.facebook.react.views.text.internal.span.TextInlineViewPlaceholderSpan
import com.facebook.react.views.text.internal.span.TouchableSpan
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode

@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
@Config(sdk = [28, 30, 34, 35])
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class EllipsisTrimmedLayoutTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private val longText = (1..40).joinToString(" ") { "word$it" }

  @Test
  fun `one ellipsized line keeps only the text up to the ellipsis`() {
    val text = SpannableString(longText)
    val layout = createLayout(text, maxLines = 1)

    val trimmed = checkNotNull(trim(layout, text))

    assertThat(trimmed.text.length).isEqualTo(layout.getEllipsisStart(0) + 1)
    assertThat(trimmed.text[trimmed.text.length - 1]).isEqualTo('…')
    assertThat(EllipsisTrimmedLayout.untrimmedText(trimmed)).isSameAs(layout.text)
    assertThat(EllipsisTrimmedLayout.untrimmedText(layout)).isSameAs(layout.text)
    assertSameLayout(trimmed, layout)
  }

  @Test
  fun `several ellipsized lines with styled text crossing the ellipsis draw the same`() {
    val text = SpannableString(longText)
    text.setSpan(StyleSpan(Typeface.BOLD), 20, text.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(
        ForegroundColorSpan(Color.RED),
        40,
        text.length - 10,
        Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    val layout = createLayout(text, maxLines = 3)

    val trimmed = checkNotNull(trim(layout, text))

    assertThat(trimmed.text.length).isLessThan(text.length)
    assertSameLayout(trimmed, layout)
  }

  @Test
  fun `hidden text with line breaks draws the same`() {
    val text = SpannableString(longText + "\n" + longText + "\n" + longText)
    val layout = createLayout(text, maxLines = 2)

    val trimmed = checkNotNull(trim(layout, text))

    assertThat(trimmed.text.length).isLessThan(text.length)
    assertSameLayout(trimmed, layout)
  }

  @Test
  fun `centered and end-aligned text draws the same`() {
    for (alignment in listOf(Layout.Alignment.ALIGN_CENTER, Layout.Alignment.ALIGN_OPPOSITE)) {
      val text = SpannableString(longText)
      val layout = createLayout(text, maxLines = 2, alignment = alignment)

      val trimmed = checkNotNull(trim(layout, text))

      assertSameLayout(trimmed, layout)
    }
  }

  @Test
  fun `text with letter spacing is kept`() {
    // Before Android 15, letter spacing also spaces the hidden characters.
    for (alignment in listOf(Layout.Alignment.ALIGN_NORMAL, Layout.Alignment.ALIGN_CENTER)) {
      val spanned = SpannableString(longText)
      spanned.setSpan(
          CustomLetterSpacingSpan(0.1f),
          spanned.length - 5,
          spanned.length,
          Spannable.SPAN_EXCLUSIVE_EXCLUSIVE,
      )
      val spannedLayout = createLayout(spanned, maxLines = 2, alignment = alignment)
      assertThat(trim(spannedLayout, spanned)).isNull()

      val text = SpannableString(longText)
      val layout = createLayout(text, maxLines = 2, alignment = alignment, textPaint = spacedPaint)
      assertThat(trim(layout, text)).isNull()
    }
  }

  @Test
  fun `justified or hyphenated text is kept`() {
    val text = SpannableString(longText)
    val layout = createLayout(text, maxLines = 2)

    assertThat(trim(layout, text)).isNotNull()
    assertThat(trim(layout, text, justificationMode = Layout.JUSTIFICATION_MODE_INTER_WORD))
        .isNull()
    assertThat(trim(layout, text, hyphenationFrequency = Layout.HYPHENATION_FREQUENCY_NORMAL))
        .isNull()
  }

  @Test
  fun `text that is not ellipsized is kept`() {
    val text = SpannableString("word1 word2")
    val layout = createLayout(text, maxLines = 1)

    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `text whose ellipsis hides nothing else is kept`() {
    val text = SpannableString("word1\nword2")
    val layout = createLayout(text, maxLines = 1)

    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `text ellipsized in the middle is kept`() {
    val text = SpannableString(longText)
    val layout = createLayout(text, maxLines = 1, ellipsizeMode = TextUtils.TruncateAt.MIDDLE)

    assertThat(layout.getEllipsisCount(0)).isGreaterThan(1)
    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `right-to-left text is kept`() {
    val text = SpannableString((1..40).joinToString(" ") { "שלום$it" })
    val layout = createLayout(text, maxLines = 1)

    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `right-to-left text inside an isolate is kept`() {
    // TextDirectionHeuristics.ANYRTL_LTR skips isolates, but their runs are still reordered.
    val text = SpannableString("From \u2068محمد 2024 السعيد\u2069 $longText")
    val layout = createLayout(text, maxLines = 1)

    assertThat(layout.getEllipsisCount(0)).isGreaterThan(1)
    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `right-to-left characters only in the hidden text keep the whole text`() {
    // Android 15+ draws text with right-to-left characters anywhere with bounds-based width.
    val text = SpannableString("$longText\n${(1..10).joinToString(" ") { "שלום$it" }}")
    val layout = createLayout(text, maxLines = 1)

    assertThat(layout.getEllipsisCount(0)).isGreaterThan(1)
    assertThat(trim(layout, text)).isNull()
  }

  @Test
  fun `a link in the visible text is kept and one in the hidden text keeps the whole text`() {
    val visible = SpannableString(longText)
    visible.setSpan(ClickableLink(), 0, 5, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    val trimmed = checkNotNull(trim(createLayout(visible, maxLines = 1), visible))
    val trimmedText = trimmed.text as Spannable
    assertThat(trimmedText.getSpans(0, trimmedText.length, ClickableLink::class.java)).hasSize(1)

    assertHiddenSpanKeepsText(ClickableLink())

    // A link that starts in the visible text and continues into the hidden text.
    val crossing = SpannableString(longText)
    crossing.setSpan(ClickableLink(), 5, crossing.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    assertThat(trim(createLayout(crossing, maxLines = 1), crossing)).isNull()
  }

  @Test
  fun `an inline view in the hidden text keeps the whole text`() {
    assertHiddenSpanKeepsText(
        TextInlineViewPlaceholderSpan(/* reactTag= */ 1, /* width= */ 10, /* height= */ 10)
    )
  }

  @Test
  fun `a replacement span in the hidden text keeps the whole text`() {
    assertHiddenSpanKeepsText(
        object : ReplacementSpan() {
          override fun getSize(
              paint: Paint,
              text: CharSequence?,
              start: Int,
              end: Int,
              fm: Paint.FontMetricsInt?,
          ): Int = 10

          override fun draw(
              canvas: Canvas,
              text: CharSequence?,
              start: Int,
              end: Int,
              x: Float,
              top: Int,
              y: Int,
              bottom: Int,
              paint: Paint,
          ) = Unit
        }
    )
  }

  @Test
  fun `stateful spans in the visible text draw the same through MutableSpannableLayout`() {
    val text = SpannableString(longText)
    text.setSpan(ColorStatefulSpan(), 0, 10, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    val layout = createLayout(text, maxLines = 2)
    val trimmed = checkNotNull(trim(layout, text))

    val original = checkNotNull(MutableSpannableLayout.createIfNeeded(layout))
    val mutableTrimmed = checkNotNull(MutableSpannableLayout.createIfNeeded(trimmed))

    assertSameLayout(mutableTrimmed, original)
  }

  @Test
  fun `prepared layouts are trimmed only with the feature flag`() {
    val text = SpannableString(longText)
    val layout = createLayout(text, maxLines = 2)
    val none = Layout.HYPHENATION_FREQUENCY_NONE
    val noJustification = Layout.JUSTIFICATION_MODE_NONE

    assertThat(TextLayoutManager.layoutForDrawing(layout, text, none, noJustification))
        .isSameAs(layout)

    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableEllipsizedTextTrimmingAndroid(): Boolean = true
        }
    )
    assertThat(TextLayoutManager.layoutForDrawing(layout, text, none, noJustification))
        .isInstanceOf(EllipsisTrimmedLayout::class.java)
    assertThat(
            TextLayoutManager.layoutForDrawing(
                layout,
                text,
                Layout.HYPHENATION_FREQUENCY_NORMAL,
                noJustification,
            )
        )
        .isSameAs(layout)
  }

  @Test
  fun `a text effect in the hidden text keeps the whole text`() {
    assertHiddenSpanKeepsText(object : TextEffectSpan {})
  }

  @Test
  fun `a touchable span in the hidden text keeps the whole text`() {
    assertHiddenSpanKeepsText(
        object : TouchableSpan {
          override fun onTouchEvent(action: Int, layoutX: Float, layoutY: Float): Boolean = false
        }
    )
  }

  private fun trim(
      layout: Layout,
      text: Spannable,
      hyphenationFrequency: Int = Layout.HYPHENATION_FREQUENCY_NONE,
      justificationMode: Int = Layout.JUSTIFICATION_MODE_NONE,
  ): EllipsisTrimmedLayout? =
      EllipsisTrimmedLayout.createIfNeeded(layout, text, hyphenationFrequency, justificationMode)

  private fun assertHiddenSpanKeepsText(span: Any) {
    val text = SpannableString(longText)
    text.setSpan(span, text.length - 1, text.length, Spannable.SPAN_EXCLUSIVE_EXCLUSIVE)
    val layout = createLayout(text, maxLines = 1)

    assertThat(layout.getEllipsisCount(0)).isGreaterThan(1)
    assertThat(trim(layout, text)).isNull()
  }

  private fun assertSameLayout(trimmed: Layout, layout: Layout) {
    assertThat(trimmed.lineCount).isEqualTo(layout.lineCount)
    assertThat(trimmed.height).isEqualTo(layout.height)
    for (line in 0 until layout.lineCount) {
      assertThat(trimmed.getLineStart(line)).isEqualTo(layout.getLineStart(line))
      assertThat(trimmed.getEllipsisStart(line)).isEqualTo(layout.getEllipsisStart(line))
      assertThat(trimmed.getLineBaseline(line)).isEqualTo(layout.getLineBaseline(line))
      assertThat(trimmed.getLineWidth(line)).isEqualTo(layout.getLineWidth(line))
    }
    val lastLine = layout.lineCount - 1
    assertThat(trimmed.getLineEnd(lastLine)).isEqualTo(trimmed.text.length)
    // Touches on the last line, including on the ellipsis, land on the same characters.
    val lineLeft = layout.getLineLeft(lastLine).toInt()
    val lineRight = layout.getLineRight(lastLine).toInt()
    for (x in lineLeft..lineRight step 5) {
      assertThat(trimmed.getOffsetForHorizontal(lastLine, x.toFloat()))
          .isEqualTo(
              minOf(layout.getOffsetForHorizontal(lastLine, x.toFloat()), trimmed.text.length)
          )
    }
    val drawn = draw(layout)
    assertThat(drawn.sameAs(draw(trimmed))).isTrue()
    // Make sure that text was drawn at all.
    assertThat(
            (0 until drawn.height).any { y ->
              (0 until drawn.width).any { x -> drawn.getPixel(x, y) != Color.WHITE }
            }
        )
        .isTrue()
  }

  private fun draw(layout: Layout): Bitmap {
    val bitmap = Bitmap.createBitmap(layout.width, layout.height, Bitmap.Config.ARGB_8888)
    val canvas = Canvas(bitmap)
    canvas.drawColor(Color.WHITE)
    layout.draw(canvas)
    return bitmap
  }

  private fun createLayout(
      text: Spannable,
      maxLines: Int,
      ellipsizeMode: TextUtils.TruncateAt = TextUtils.TruncateAt.END,
      alignment: Layout.Alignment = Layout.Alignment.ALIGN_NORMAL,
      textPaint: TextPaint = paint,
  ): Layout =
      TextLayoutManager.createLayout(
          text,
          /* boring = */ null,
          /* width = */ 400f,
          YogaMeasureMode.EXACTLY,
          /* includeFontPadding = */ false,
          /* textBreakStrategy = */ Layout.BREAK_STRATEGY_HIGH_QUALITY,
          /* hyphenationFrequency = */ Layout.HYPHENATION_FREQUENCY_NONE,
          /* lineBreakStyle = */ LineBreakConfig.LINE_BREAK_STYLE_NONE,
          /* lineBreakWordStyle = */ LineBreakConfig.LINE_BREAK_WORD_STYLE_NONE,
          alignment,
          Layout.JUSTIFICATION_MODE_NONE,
          ellipsizeMode,
          maxLines,
          textPaint,
      )

  private class ClickableLink : ClickableSpan() {
    override fun onClick(widget: View) = Unit
  }

  private class ColorStatefulSpan : ForegroundColorSpan(Color.BLUE), StatefulSpan {
    override fun clone(): StatefulSpan = ColorStatefulSpan()
  }

  private companion object {
    val paint = TextPaint(TextPaint.ANTI_ALIAS_FLAG).apply { textSize = 26f }
    val spacedPaint = TextPaint(paint).apply { letterSpacing = 0.1f }
  }
}
