/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.annotation.SuppressLint
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
import android.text.style.LocaleSpan
import android.text.style.TtsSpan
import android.util.DisplayMetrics
import android.view.View
import androidx.core.view.AccessibilityDelegateCompat
import androidx.core.view.ViewCompat
import androidx.core.view.accessibility.AccessibilityNodeInfoCompat
import com.facebook.react.R
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole
import com.facebook.react.views.text.internal.span.ReactAbsoluteSizeSpan
import com.facebook.react.views.text.internal.span.ReactBackgroundColorSpan
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import com.facebook.react.views.text.internal.span.ReactForegroundColorSpan
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.testutils.shadows.ShadowSoLoader
import java.util.Locale
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@SuppressLint("NewApi")
@Config(sdk = [34], shadows = [ShadowSoLoader::class])
class ReactTextViewAccessibilityDelegateTest {

  private val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())

  @Test
  fun `the first update installs the text delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))

    assertThat(delegate()).isInstanceOf(ReactTextViewAccessibilityDelegate::class.java)
    assertThat(view.getTag(R.id.accessibility_links)).isNull()
  }

  @Test
  fun `updates without links keep the delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    val first = delegate()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("World"))

    assertThat(delegate()).isSameAs(first)
  }

  @Test
  fun `adding and removing links resets the delegate`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    val plain = delegate()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, textWithLink())
    val withLink = delegate()
    assertThat(withLink).isNotSameAs(plain)
    assertThat(view.getTag(R.id.accessibility_links)).isNotNull()

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    assertThat(delegate()).isNotSameAs(withLink)
    assertThat(view.getTag(R.id.accessibility_links)).isNull()
  }

  @Test
  fun `a view set back to auto is important for accessibility after an update`() {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("Hello"))
    view.importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_AUTO

    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, SpannableString("World"))

    assertThat(view.importantForAccessibility).isEqualTo(View.IMPORTANT_FOR_ACCESSIBILITY_YES)
  }

  @Test
  fun `prepared layout text node has no style spans`() {
    val view = preparedLayoutTextView(styledText("Delete listing"))
    view.setTag(R.id.accessibility_role, AccessibilityRole.HEADER)

    val nodeInfo = createNodeInfo(view)

    assertThat(nodeInfo.text.toString()).isEqualTo("Delete listing")
    assertThat(nodeInfo.isHeading).isTrue()
    assertHasNoPlatformStyleSpans(nodeInfo.text)
    assertHasStyleSpans(view.text)
  }

  @Test
  fun `react text view node has no style spans`() {
    val view = reactTextView(styledText("Delete listing"))
    view.setTag(R.id.accessibility_role, AccessibilityRole.HEADER)

    val nodeInfo = createNodeInfo(view)

    assertThat(nodeInfo.text.toString()).isEqualTo("Delete listing")
    assertThat(nodeInfo.isHeading).isTrue()
    assertHasNoPlatformStyleSpans(nodeInfo.text)
    assertHasStyleSpans(view.text)
  }

  @Test
  fun `text input node has no platform style spans`() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    val view = ReactEditText(createTestReactApplicationContext())
    view.setText(styledText("Editable text"))

    val nodeInfo = createNodeInfo(view)

    assertThat(nodeInfo.text.toString()).isEqualTo("Editable text")
    assertHasNoPlatformStyleSpans(nodeInfo.text)
    assertHasStyleSpans(view.text)
  }

  @Test
  fun `whole text link keeps its clickable span`() {
    val text = styledText("Read the docs")
    text.setSpan(ReactClickableSpan(1), 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    for (view in listOf(preparedLayoutTextView(text), reactTextView(text))) {
      val nodeInfo = createNodeInfo(view)

      assertThat(nodeInfo.text.toString()).isEqualTo("Read the docs")
      assertHasNoPlatformStyleSpans(nodeInfo.text)
      val nodeText = nodeInfo.text as Spanned
      val links = nodeText.getSpans(0, nodeText.length, ClickableSpan::class.java)
      assertThat(links).hasSize(1)
      assertThat(nodeText.getSpanStart(links[0])).isEqualTo(0)
      assertThat(nodeText.getSpanEnd(links[0])).isEqualTo(text.length)
    }
  }

  @Test
  fun `inline link keeps its clickable span and link node provider`() {
    val text = styledText("Read the docs")
    text.setSpan(ReactClickableSpan(1), 9, 13, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    for (view in listOf(preparedLayoutTextView(text), reactTextView(text))) {
      val nodeInfo = createNodeInfo(view)

      assertHasNoPlatformStyleSpans(nodeInfo.text)
      val nodeText = nodeInfo.text as Spanned
      val links = nodeText.getSpans(0, nodeText.length, ClickableSpan::class.java)
      assertThat(links).hasSize(1)
      assertThat(nodeText.getSpanStart(links[0])).isEqualTo(9)
      assertThat(nodeText.getSpanEnd(links[0])).isEqualTo(13)

      assertThat(ViewCompat.getAccessibilityNodeProvider(view)).isNotNull()
    }
  }

  @Test
  fun `tts and locale spans are kept`() {
    val text = styledText("12 km")
    val ttsSpan = TtsSpan.MeasureBuilder().setNumber(12).setUnit("kilometer").build()
    val localeSpan = LocaleSpan(Locale.FRENCH)
    text.setSpan(ttsSpan, 0, text.length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
    text.setSpan(localeSpan, 0, 2, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)

    val nodeInfo = createNodeInfo(preparedLayoutTextView(text))

    assertHasNoPlatformStyleSpans(nodeInfo.text)
    val nodeText = nodeInfo.text as Spanned
    assertThat(nodeText.getSpans(0, nodeText.length, TtsSpan::class.java)).containsExactly(ttsSpan)
    assertThat(nodeText.getSpans(0, nodeText.length, LocaleSpan::class.java))
        .containsExactly(localeSpan)
    assertThat(nodeText.getSpanEnd(localeSpan)).isEqualTo(2)
  }

  private fun delegate(): AccessibilityDelegateCompat? = ViewCompat.getAccessibilityDelegate(view)

  private fun textWithLink(): Spanned =
      SpannableString("Read the docs here").apply {
        setSpan(
            object : ClickableSpan() {
              override fun onClick(widget: View) = Unit
            },
            9,
            13,
            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
      }

  private fun styledText(text: String): SpannableString =
      SpannableString(text).apply {
        setSpan(ReactAbsoluteSizeSpan(34), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(ReactForegroundColorSpan(Color.BLACK), 0, length, Spanned.SPAN_EXCLUSIVE_EXCLUSIVE)
        setSpan(
            ReactBackgroundColorSpan(Color.TRANSPARENT),
            0,
            length,
            Spanned.SPAN_EXCLUSIVE_EXCLUSIVE,
        )
      }

  private fun preparedLayoutTextView(text: Spanned): PreparedLayoutTextView {
    val view = PreparedLayoutTextView(RuntimeEnvironment.getApplication())
    view.preparedLayout =
        PreparedLayout(
            StaticLayout.Builder.obtain(text, 0, text.length, TextPaint(), 1000).build(),
            /* maximumNumberOfLines = */ Int.MAX_VALUE,
            /* verticalOffset = */ 0f,
            /* reactTags = */ intArrayOf(1),
            /* textBreakStrategy = */ Layout.BREAK_STRATEGY_SIMPLE,
            /* justificationMode = */ 0,
            baseTextAttributes = TextAttributeProps.fromMapBuffer(WritableMapBuffer()),
            /* sourceText = */ text,
        )
    installDelegate(view, text)
    return view
  }

  private fun reactTextView(text: Spanned): ReactTextView {
    val view = ReactTextView(RuntimeEnvironment.getApplication())
    view.setText(ReactTextUpdate(text, -1, 0, Layout.BREAK_STRATEGY_SIMPLE, 0))
    installDelegate(view, text)
    return view
  }

  private fun installDelegate(view: View, text: Spanned) {
    ReactTextViewAccessibilityDelegate.updateAccessibilityLinks(view, text)
  }

  private fun createNodeInfo(view: View): AccessibilityNodeInfoCompat =
      AccessibilityNodeInfoCompat.obtain().also {
        view.onInitializeAccessibilityNodeInfo(it.unwrap())
      }

  private fun assertHasNoPlatformStyleSpans(text: CharSequence?) {
    if (text !is Spanned) {
      return
    }
    assertThat(text.getSpans(0, text.length, AbsoluteSizeSpan::class.java)).isEmpty()
    assertThat(text.getSpans(0, text.length, ForegroundColorSpan::class.java)).isEmpty()
    assertThat(text.getSpans(0, text.length, BackgroundColorSpan::class.java)).isEmpty()
  }

  private fun assertHasStyleSpans(text: CharSequence?) {
    assertThat(text).isInstanceOf(Spanned::class.java)
    val spanned = checkNotNull(text as? Spanned)
    assertThat(spanned.getSpans(0, spanned.length, ReactAbsoluteSizeSpan::class.java)).hasSize(1)
    assertThat(spanned.getSpans(0, spanned.length, ReactForegroundColorSpan::class.java)).hasSize(1)
  }
}
