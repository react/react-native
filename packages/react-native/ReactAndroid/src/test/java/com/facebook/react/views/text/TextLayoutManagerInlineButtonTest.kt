/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Spannable
import android.text.style.ClickableSpan
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.common.mapbuffer.ReadableMapBuffer
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role
import com.facebook.react.views.text.internal.span.ReactClickableSpan
import com.facebook.react.views.text.internal.span.ReactLinkSpan
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.yoga.YogaMeasureMode
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.AdditionalAnswers.delegatesTo
import org.mockito.Mockito.doReturn
import org.mockito.Mockito.mock
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@OptIn(UnstableReactNativeAPI::class)
@RunWith(ParameterizedRobolectricTestRunner::class)
@Config(sdk = [34], shadows = [ShadowNativeLoader::class])
class TextLayoutManagerInlineButtonTest(
    private val optimized: Boolean,
    private val prepared: Boolean,
) {
  private var buttonsEnabled = true
  private var preparedLayout: PreparedLayout? = null

  @Before
  fun setUp() {
    buttonsEnabled = true
    preparedLayout = null
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableInteractiveInlineButtons(): Boolean = buttonsEnabled

          override fun enableAndroidTextMeasurementOptimizations(): Boolean = optimized

          override fun enablePreparedTextLayout(): Boolean = prepared
        },
    )
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun `role=button produces a clickable span`() {
    assertInteractive(attributes(role = Role.BUTTON))
  }

  @Test
  fun `accessibilityRole=button produces a clickable span`() {
    assertInteractive(attributes(accessibilityRole = "button"))
  }

  @Test
  fun `role=link produces a clickable span`() {
    assertInteractive(attributes(role = Role.LINK))
  }

  @Test
  fun `accessibilityRole=link produces a clickable span`() {
    assertInteractive(attributes(accessibilityRole = "link"))
  }

  @Test
  fun `disabled flag preserves links`() {
    buttonsEnabled = false
    assertInteractive(attributes(role = Role.LINK))
    assertInteractive(attributes(accessibilityRole = "link"))
  }

  @Test
  fun `disabled flag leaves role buttons without clickable spans`() {
    buttonsEnabled = false
    assertNotInteractive(attributes(role = Role.BUTTON))
  }

  @Test
  fun `disabled flag leaves accessibilityRole buttons without clickable spans`() {
    buttonsEnabled = false
    assertNotInteractive(attributes(accessibilityRole = "button"))
  }

  @Test
  fun `explicit heading role overrides accessibilityRole link`() {
    assertNotInteractive(attributes(role = Role.HEADING, accessibilityRole = "link"))
  }

  @Test
  fun `explicit link role overrides accessibilityRole button`() {
    buttonsEnabled = false
    assertInteractive(attributes(role = Role.LINK, accessibilityRole = "button"))
  }

  @Test
  fun `explicit button role overrides accessibilityRole link when flag is disabled`() {
    buttonsEnabled = false
    assertNotInteractive(attributes(role = Role.BUTTON, accessibilityRole = "link"))
  }

  @Test
  fun `plain text does not produce clickable spans`() {
    assertNotInteractive(attributes())
  }

  @Test
  fun `clickable spans keep fragment bounds and tag mapping`() {
    val text =
        build(
            fragment("Author ", 13),
            fragment("Follow", 42, attributes(role = Role.BUTTON)),
            fragment(" and ", 87),
            fragment("Profile", 99, attributes(accessibilityRole = "link")),
            fragment(".", 103),
        )
    val spans = clickableSpans(text)
    assertThat(text.toString()).isEqualTo("Author Follow and Profile.")
    assertThat(spans).hasSize(2)
    assertSpan(text, spans[0], 7, 13, 1, 42)
    assertSpan(text, spans[1], 18, 25, 3, 99)
    if (prepared) {
      assertThat(checkNotNull(preparedLayout).reactTags).containsExactly(13, 42, 87, 99, 103)
    }
  }

  @Test
  fun `span creation keeps the declared button role`() {
    val attrs = attributes(role = Role.BUTTON)
    assertInteractive(attrs)
    assertThat(TextAttributeProps.fromMapBuffer(attrs).role).isEqualTo(Role.BUTTON)
  }

  @Test
  fun `inline attachments do not become clickable spans`() {
    val attachment =
        fragment("\uFFFC", 42, attributes(role = Role.BUTTON))
            .put(TextLayoutManager.FR_KEY_IS_ATTACHMENT, true)
            .put(TextLayoutManager.FR_KEY_WIDTH, 10.0)
            .put(TextLayoutManager.FR_KEY_HEIGHT, 10.0)
    assertThat(clickableSpans(build(attachment))).isEmpty()
  }

  private fun attributes(role: Role? = null, accessibilityRole: String? = null): WritableMapBuffer =
      WritableMapBuffer().apply {
        put(TextAttributeProps.TA_KEY_FONT_SIZE, 16.0)
        role?.let { put(TextAttributeProps.TA_KEY_ROLE, it.ordinal) }
        accessibilityRole?.let { put(TextAttributeProps.TA_KEY_ACCESSIBILITY_ROLE, it) }
      }

  private fun fragment(
      text: String,
      tag: Int,
      attrs: WritableMapBuffer = attributes(),
  ): WritableMapBuffer =
      WritableMapBuffer()
          .put(TextLayoutManager.FR_KEY_STRING, text)
          .put(TextLayoutManager.FR_KEY_REACT_TAG, tag)
          .put(TextLayoutManager.FR_KEY_TEXT_ATTRIBUTES, attrs)

  private fun build(vararg fragments: WritableMapBuffer): Spannable {
    val fragmentMap = WritableMapBuffer()
    fragments.forEachIndexed { index, fragment -> fragmentMap.put(index, fragment) }
    val attributedString =
        WritableMapBuffer()
            .put(TextLayoutManager.AS_KEY_FRAGMENTS, fragmentMap)
            .put(TextLayoutManager.AS_KEY_BASE_ATTRIBUTES, attributes())
    val assets = RuntimeEnvironment.getApplication().assets
    if (!prepared) {
      return TextLayoutManager.getOrCreateSpannableForText(assets, attributedString, null)
    }
    val layout =
        TextLayoutManager.createPreparedLayout(
            assets,
            readable(attributedString),
            readable(
                WritableMapBuffer()
                    .put(TextLayoutManager.PA_KEY_TEXT_BREAK_STRATEGY, "highQuality")
                    .put(TextLayoutManager.PA_KEY_HYPHENATION_FREQUENCY, "none"),
            ),
            300f,
            YogaMeasureMode.EXACTLY,
            Float.NaN,
            YogaMeasureMode.UNDEFINED,
            null,
        )
    preparedLayout = layout
    return layout.sourceText as Spannable
  }

  private fun readable(buffer: MapBuffer): ReadableMapBuffer {
    val result = mock(ReadableMapBuffer::class.java, delegatesTo<Any>(buffer))
    for (entry in buffer) {
      if (entry.type == MapBuffer.DataType.MAP) {
        doReturn(readable(entry.mapBufferValue)).`when`(result).getMapBuffer(entry.key)
      }
    }
    return result
  }

  private fun clickableSpans(text: Spannable): List<ClickableSpan> =
      text.getSpans(0, text.length, ClickableSpan::class.java).sortedBy { text.getSpanStart(it) }

  private fun assertInteractive(attrs: WritableMapBuffer) {
    val text = build(fragment("Follow", 42, attrs))
    val spans = clickableSpans(text)
    assertThat(spans).hasSize(1)
    assertSpan(text, spans.single(), 0, 6, 0, 42)
  }

  private fun assertNotInteractive(attrs: WritableMapBuffer) {
    assertThat(clickableSpans(build(fragment("Follow", 42, attrs)))).isEmpty()
  }

  private fun assertSpan(
      text: Spannable,
      span: ClickableSpan,
      start: Int,
      end: Int,
      fragmentIndex: Int,
      tag: Int,
  ) {
    assertThat(text.getSpanStart(span)).isEqualTo(start)
    assertThat(text.getSpanEnd(span)).isEqualTo(end)
    if (prepared) {
      assertThat(span).isInstanceOf(ReactLinkSpan::class.java)
      assertThat((span as ReactLinkSpan).fragmentIndex).isEqualTo(fragmentIndex)
      assertThat(checkNotNull(preparedLayout).reactTags[span.fragmentIndex]).isEqualTo(tag)
    } else {
      assertThat(span).isInstanceOf(ReactClickableSpan::class.java)
      assertThat((span as ReactClickableSpan).reactTag).isEqualTo(tag)
    }
  }

  companion object {
    @JvmStatic
    @ParameterizedRobolectricTestRunner.Parameters(name = "optimized={0}, prepared={1}")
    fun parameters(): List<Array<Boolean>> =
        listOf(
            arrayOf(false, false),
            arrayOf(false, true),
            arrayOf(true, false),
            arrayOf(true, true),
        )
  }
}
