/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.text

import android.graphics.Color
import android.text.Layout
import android.text.SpannableString
import android.text.Spanned
import android.text.StaticLayout
import android.text.TextPaint
import android.text.style.AbsoluteSizeSpan
import android.text.style.BackgroundColorSpan
import android.text.style.ClickableSpan
import android.text.style.ForegroundColorSpan
import android.text.style.StyleSpan
import android.text.style.URLSpan
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextViewAccessibilityDelegateTest {
  @Test
  fun reactTextViewAccessibilityNodeText_stripsStyleSpans() {
    val textView = createReactTextViewWithStyledText("Start")

    val nodeInfo = createNodeInfo(textView)

    assertSourceTextKeepsStyleSpans(textView.text)
    assertThat(nodeInfo.text.toString()).isEqualTo("Start")
    assertAccessibilityTextDoesNotHaveVisualSpans(nodeInfo.text)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_preservesExplicitContentDescription() {
    val textView = createReactTextViewWithStyledText("Visible text")
    textView.contentDescription = "Custom label"

    val nodeInfo = createNodeInfo(textView)

    assertThat(textView.contentDescription.toString()).isEqualTo("Custom label")
    assertThat(nodeInfo.text.toString()).isEqualTo("Visible text")
    assertAccessibilityTextDoesNotHaveVisualSpans(nodeInfo.text)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_preservesWholeTextClickableSpan() {
    val clickableSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val text = createStyledText("Read docs")
    text.setSpan(clickableSpan, 0, text.length, Spanned.SPAN_INCLUSIVE_EXCLUSIVE)
    val textView = createReactTextView(text)

    val nodeInfo = createNodeInfo(textView)
    val sourceText = textView.text as Spanned
    val accessibilityText = nodeInfo.text as Spanned

    assertSourceTextKeepsStyleSpans(sourceText)
    assertThat(ReactTextViewAccessibilityDelegate.AccessibilityLinks(sourceText).size()).isEqualTo(0)
    assertThat(nodeInfo.text.toString()).isEqualTo("Read docs")
    assertAccessibilityTextDoesNotHaveVisualSpans(accessibilityText)
    assertPreservedSpanMatchesSource(sourceText, accessibilityText, clickableSpan)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_preservesMixedClickableAndVisualSpans() {
    val clickableSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val text = createStyledText("Read docs now")
    text.setSpan(clickableSpan, 5, 9, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    val textView = createReactTextView(text)

    val nodeInfo = createNodeInfo(textView)
    val sourceText = textView.text as Spanned
    val accessibilityText = nodeInfo.text as Spanned

    assertSourceTextKeepsStyleSpans(sourceText)
    assertThat(nodeInfo.text.toString()).isEqualTo("Read docs now")
    assertAccessibilityTextDoesNotHaveVisualSpans(accessibilityText)
    assertPreservedSpanMatchesSource(sourceText, accessibilityText, clickableSpan)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_preservesUrlSpanSemantics() {
    val urlSpan = URLSpan("https://reactnative.dev")
    val text = createStyledText("React Native")
    text.setSpan(urlSpan, 0, 5, Spanned.SPAN_INCLUSIVE_EXCLUSIVE)
    val textView = createReactTextView(text)

    val nodeInfo = createNodeInfo(textView)
    val accessibilityText = nodeInfo.text as Spanned

    assertThat(nodeInfo.text.toString()).isEqualTo("React Native")
    assertAccessibilityTextDoesNotHaveVisualSpans(accessibilityText)
    assertAccessibilityTextHasClickableSpan(accessibilityText, 0, 5, Spanned.SPAN_INCLUSIVE_EXCLUSIVE)
  }

  @Test
  fun preparedLayoutTextViewAccessibilityNodeText_keepsOnlyClickableSpans() {
    val text = createStyledText("Prepared text")
    val clickableSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    text.setSpan(clickableSpan, 0, 8, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    val layout =
        StaticLayout.Builder.obtain(text, 0, text.length, TextPaint(), 300).build()
    val textView = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    textView.preparedLayout =
        PreparedLayout(
            layout,
            Int.MAX_VALUE,
            0f,
            intArrayOf(1),
            Layout.BREAK_STRATEGY_SIMPLE,
            0,
        )
    ReactTextViewAccessibilityDelegate.resetDelegate(
        textView,
        textView.isFocusable,
        textView.importantForAccessibility,
    )

    val nodeInfo = createNodeInfo(textView)

    assertSourceTextKeepsStyleSpans(textView.text)
    assertThat(nodeInfo.text.toString()).isEqualTo("Prepared text")
    val accessibilityText = nodeInfo.text as Spanned
    assertAccessibilityTextDoesNotHaveVisualSpans(accessibilityText)
    assertPreservedSpanMatchesSource(textView.text as Spanned, accessibilityText, clickableSpan)
  }

  @Test
  fun reactTextViewAccessibilityNodeText_trimsLongTextWithoutSplittingSurrogatePairs() {
    val crossingBoundarySpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val outsideRetainedTextSpan =
        object : ClickableSpan() {
          override fun onClick(widget: View) = Unit
        }
    val text = SpannableString("${"a".repeat(99_999)}\uD83D\uDE00b")
    text.setSpan(crossingBoundarySpan, 99_998, 100_001, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(outsideRetainedTextSpan, 100_001, 100_002, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    val textView = createReactTextView(text)

    val nodeInfo = createNodeInfo(textView)
    val accessibilityText = nodeInfo.text as Spanned

    assertThat(nodeInfo.text.length).isEqualTo(99_999)
    assertThat(nodeInfo.text.toString()).doesNotEndWith("\uD83D")
    assertPreservedSpanMatchesRange(
        accessibilityText,
        crossingBoundarySpan,
        99_998,
        99_999,
        Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
    )
    assertThat(accessibilityText.getSpans(0, accessibilityText.length, ClickableSpan::class.java))
        .doesNotContain(outsideRetainedTextSpan)
  }

  private fun createReactTextViewWithStyledText(text: String): ReactTextView {
    return createReactTextView(createStyledText(text))
  }

  private fun createReactTextView(text: Spanned): ReactTextView {
    val textView = ReactTextView(RuntimeEnvironment.getApplication())
    textView.setText(
        ReactTextUpdate(
            text,
            -1,
            0,
            Layout.BREAK_STRATEGY_SIMPLE,
            0,
        )
    )
    ReactTextViewAccessibilityDelegate.resetDelegate(
        textView,
        textView.isFocusable,
        textView.importantForAccessibility,
    )
    return textView
  }

  private fun createStyledText(text: String): SpannableString =
      SpannableString(text).apply {
        setSpan(AbsoluteSizeSpan(48), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(ForegroundColorSpan(Color.BLACK), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(BackgroundColorSpan(Color.WHITE), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(StyleSpan(android.graphics.Typeface.BOLD), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
      }

  private fun createNodeInfo(view: View): AccessibilityNodeInfoCompat =
      AccessibilityNodeInfoCompat.obtain().also {
        ViewCompat.onInitializeAccessibilityNodeInfo(view, it)
      }

  private fun assertSourceTextKeepsStyleSpans(text: CharSequence?) {
    assertThat(text).isInstanceOf(Spanned::class.java)
    val spanned = text as Spanned
    assertThat(spanned.getSpans(0, spanned.length, AbsoluteSizeSpan::class.java)).isNotEmpty()
    assertThat(spanned.getSpans(0, spanned.length, ForegroundColorSpan::class.java)).isNotEmpty()
    assertThat(spanned.getSpans(0, spanned.length, BackgroundColorSpan::class.java)).isNotEmpty()
    assertThat(spanned.getSpans(0, spanned.length, StyleSpan::class.java)).isNotEmpty()
  }

  private fun assertAccessibilityTextDoesNotHaveVisualSpans(text: CharSequence?) {
    if (text !is Spanned) {
      return
    }

    assertThat(text.getSpans(0, text.length, AbsoluteSizeSpan::class.java)).isEmpty()
    assertThat(text.getSpans(0, text.length, ForegroundColorSpan::class.java)).isEmpty()
    assertThat(text.getSpans(0, text.length, BackgroundColorSpan::class.java)).isEmpty()
    assertThat(text.getSpans(0, text.length, StyleSpan::class.java)).isEmpty()
  }

  private fun assertPreservedSpanMatchesSource(
      sourceText: Spanned,
      accessibilityText: Spanned,
      sourceSpan: Any,
  ) {
    assertPreservedSpanMatchesRange(
        accessibilityText,
        sourceSpan,
        sourceText.getSpanStart(sourceSpan),
        sourceText.getSpanEnd(sourceSpan),
        sourceText.getSpanFlags(sourceSpan),
    )
  }

  private fun assertPreservedSpanMatchesRange(
      accessibilityText: Spanned,
      sourceSpan: Any,
      start: Int,
      end: Int,
      flags: Int,
  ) {
    val preservedSpans =
        accessibilityText
            .getSpans(start, end, sourceSpan.javaClass)
            .filter { accessibilityText.getSpanStart(it) == start }
            .filter { accessibilityText.getSpanEnd(it) == end }
            .filter { accessibilityText.getSpanFlags(it) == flags }
    assertThat(preservedSpans).isNotEmpty()
  }

  private fun assertAccessibilityTextHasClickableSpan(
      accessibilityText: Spanned,
      start: Int,
      end: Int,
      flags: Int,
  ) {
    val clickableSpans =
        accessibilityText
            .getSpans(start, end, ClickableSpan::class.java)
            .filter { accessibilityText.getSpanStart(it) == start }
            .filter { accessibilityText.getSpanEnd(it) == end }
            .filter { accessibilityText.getSpanFlags(it) == flags }

    assertThat(clickableSpans).isNotEmpty()
  }
}
