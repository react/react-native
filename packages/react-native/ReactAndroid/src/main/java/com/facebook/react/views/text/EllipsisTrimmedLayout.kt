/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.os.Build
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.style.ClickableSpan
import android.text.style.ReplacementSpan
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.views.text.internal.span.CustomLetterSpacingSpan
import com.facebook.react.views.text.internal.span.TextEffectSpan
import com.facebook.react.views.text.internal.span.TouchableSpan

/**
 * A delegating [Layout] over the text of a [delegate] ellipsized at the end, without the text
 * hidden after the ellipsis.
 *
 * The last line of an ellipsized layout keeps all the text after the ellipsis, as zero-width
 * characters, and Android shapes all of it every time the layout is drawn. This layout's text stops
 * right after the ellipsis character, and its line metrics are delegated to [delegate], like in
 * [MutableSpannableLayout], so it draws the same visible text without laying anything out again.
 */
internal class EllipsisTrimmedLayout
private constructor(
    private val delegate: Layout,
    trimmedText: SpannableString,
) :
    Layout(
        trimmedText,
        delegate.paint,
        delegate.width,
        delegate.alignment,
        delegate.spacingMultiplier,
        delegate.spacingAdd,
    ) {

  private val lastLine = delegate.lineCount - 1

  companion object {
    /**
     * Returns an [EllipsisTrimmedLayout] if [layout], a layout of [source], is ellipsized at the
     * end and hides text that only matters for drawing, else null.
     */
    @OptIn(UnstableReactNativeAPI::class)
    fun createIfNeeded(
        layout: Layout,
        source: Spanned,
        hyphenationFrequency: Int,
        justificationMode: Int,
    ): EllipsisTrimmedLayout? {
      // Justified lines and hyphens are drawn from the layout's justification mode and hyphen
      // edits, which a delegating layout doesn't have.
      if (
          hyphenationFrequency != Layout.HYPHENATION_FREQUENCY_NONE ||
              (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
                  justificationMode != Layout.JUSTIFICATION_MODE_NONE)
      ) {
        return null
      }
      val lastLine = layout.lineCount - 1
      if (lastLine < 0 || layout.getEllipsisCount(lastLine) <= 1) {
        return null
      }
      // The ellipsis character is the first ellipsized character; the rest of the last line is
      // hidden, and so are the paragraphs after it. Text after the ellipsized range (start or
      // middle ellipsis) is visible, so keep it.
      val ellipsisStart = layout.getLineStart(lastLine) + layout.getEllipsisStart(lastLine)
      if (ellipsisStart + layout.getEllipsisCount(lastLine) != layout.getLineEnd(lastLine)) {
        return null
      }
      val end = ellipsisStart + 1
      // Keep the text whole when its hidden part matters beyond drawing. Bidirectional text is laid
      // out in runs over the whole line, which can put hidden runs before visible ones, and on
      // Android 15+ text with right-to-left characters is drawn with bounds-based width, which this
      // layout doesn't have. Letter spacing also spaces the hidden characters before Android 15.
      if (layout.paint.letterSpacing != 0f || mayNeedBidi(source)) {
        return null
      }
      // Links are exposed to accessibility, replacement spans such as inline views are measured
      // and drawn over their whole range, and text effects, touchable spans and letter spacing
      // work on the range they were given.
      for (span in source.getSpans(end, source.length, Any::class.java)) {
        if (
            span is ClickableSpan ||
                span is ReplacementSpan ||
                span is TextEffectSpan ||
                span is TouchableSpan ||
                span is CustomLetterSpacingSpan
        ) {
          return null
        }
      }
      // The layout's text already has the ellipsis character in place.
      val trimmedText = layout.text.subSequence(0, end)
      if (trimmedText[trimmedText.length - 1] != '…') {
        return null
      }
      return EllipsisTrimmedLayout(
          layout,
          trimmedText as? SpannableString ?: SpannableString(trimmedText),
      )
    }

    /** The whole text of [layout], also when it's an [EllipsisTrimmedLayout]. */
    fun untrimmedText(layout: Layout): CharSequence =
        ((layout as? EllipsisTrimmedLayout)?.delegate ?: layout).text

    /**
     * Whether [text] has a right-to-left character or a directional formatting character. Unlike
     * `TextDirectionHeuristics.ANYRTL_LTR`, this also sees right-to-left text inside isolates.
     */
    private fun mayNeedBidi(text: CharSequence): Boolean {
      var i = 0
      while (i < text.length) {
        val codePoint = Character.codePointAt(text, i)
        when (Character.getDirectionality(codePoint)) {
          Character.DIRECTIONALITY_RIGHT_TO_LEFT,
          Character.DIRECTIONALITY_RIGHT_TO_LEFT_ARABIC,
          Character.DIRECTIONALITY_RIGHT_TO_LEFT_EMBEDDING,
          Character.DIRECTIONALITY_RIGHT_TO_LEFT_OVERRIDE,
          Character.DIRECTIONALITY_RIGHT_TO_LEFT_ISOLATE,
          Character.DIRECTIONALITY_LEFT_TO_RIGHT_EMBEDDING,
          Character.DIRECTIONALITY_LEFT_TO_RIGHT_OVERRIDE,
          Character.DIRECTIONALITY_LEFT_TO_RIGHT_ISOLATE,
          Character.DIRECTIONALITY_FIRST_STRONG_ISOLATE,
          Character.DIRECTIONALITY_POP_DIRECTIONAL_FORMAT,
          Character.DIRECTIONALITY_POP_DIRECTIONAL_ISOLATE -> return true
        }
        i += Character.charCount(codePoint)
      }
      return false
    }
  }

  // --- Abstract methods: delegated, except where the last line ends ---

  override fun getLineCount(): Int = delegate.lineCount

  override fun getLineTop(line: Int): Int = delegate.getLineTop(line)

  override fun getLineDescent(line: Int): Int = delegate.getLineDescent(line)

  override fun getLineStart(line: Int): Int =
      if (line > lastLine) text.length else delegate.getLineStart(line)

  override fun getLineContainsTab(line: Int): Boolean = delegate.getLineContainsTab(line)

  override fun getLineDirections(line: Int): Directions = delegate.getLineDirections(line)

  override fun getTopPadding(): Int = delegate.topPadding

  override fun getBottomPadding(): Int = delegate.bottomPadding

  override fun getEllipsisStart(line: Int): Int = delegate.getEllipsisStart(line)

  override fun getEllipsisCount(line: Int): Int =
      if (line == lastLine) text.length - getLineStart(line) - getEllipsisStart(line)
      else delegate.getEllipsisCount(line)

  override fun getParagraphDirection(line: Int): Int = delegate.getParagraphDirection(line)

  override fun getEllipsizedWidth(): Int = delegate.ellipsizedWidth

  // Line widths (getLineMax, getLineWidth, getLineLeft, getLineRight) are not delegated: the
  // original computes them by shaping its whole last line, hidden text included, and this layout
  // gets the same values from its own, shorter text.

  // Only called by the framework on API 33+
  @android.annotation.SuppressLint("NewApi")
  override fun isFallbackLineSpacingEnabled(): Boolean = delegate.isFallbackLineSpacingEnabled
}
