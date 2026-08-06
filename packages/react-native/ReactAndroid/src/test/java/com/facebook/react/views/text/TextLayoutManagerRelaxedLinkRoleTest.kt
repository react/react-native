/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.text.Spannable
import android.text.style.ClickableSpan
import com.facebook.react.common.mapbuffer.WritableMapBuffer
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactAccessibilityDelegate.Role
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
class TextLayoutManagerRelaxedLinkRoleTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun `role=button becomes a link span when enableRelaxedLinkRole is on`() {
    setRelaxedLinkRole(true)
    assertThat(spannable(role = Role.BUTTON).clickableSpanCount()).isEqualTo(1)
  }

  @Test
  fun `role=button stays plain when enableRelaxedLinkRole is off`() {
    setRelaxedLinkRole(false)
    assertThat(spannable(role = Role.BUTTON).clickableSpanCount()).isZero()
  }

  @Test
  fun `heading role with link accessibilityRole is detected when enableRelaxedLinkRole is on`() {
    setRelaxedLinkRole(true)
    assertThat(spannable(role = Role.HEADING, accessibilityRole = "link").clickableSpanCount())
        .isEqualTo(1)
  }

  @Test
  fun `heading role with link accessibilityRole stays plain when enableRelaxedLinkRole is off`() {
    setRelaxedLinkRole(false)
    assertThat(spannable(role = Role.HEADING, accessibilityRole = "link").clickableSpanCount())
        .isZero()
  }

  private fun setRelaxedLinkRole(enabled: Boolean) =
      ReactNativeFeatureFlags.override(
          object : ReactNativeFeatureFlagsDefaults() {
            override fun enableRelaxedLinkRole(): Boolean = enabled
          }
      )

  private fun Spannable.clickableSpanCount(): Int =
      getSpans(0, length, ClickableSpan::class.java).size

  private fun spannable(role: Role? = null, accessibilityRole: String? = null): Spannable {
    val attrs =
        WritableMapBuffer().apply {
          put(TextAttributeProps.TA_KEY_FONT_SIZE, 16.0)
          role?.let { put(TextAttributeProps.TA_KEY_ROLE, it.ordinal) }
          accessibilityRole?.let { put(TextAttributeProps.TA_KEY_ACCESSIBILITY_ROLE, it) }
        }
    val fragment =
        WritableMapBuffer().apply {
          put(TextLayoutManager.FR_KEY_STRING, "Follow")
          put(TextLayoutManager.FR_KEY_REACT_TAG, 1)
          put(TextLayoutManager.FR_KEY_TEXT_ATTRIBUTES, attrs)
        }
    val attributedString =
        WritableMapBuffer().apply {
          put(TextLayoutManager.AS_KEY_STRING, "Follow")
          put(TextLayoutManager.AS_KEY_FRAGMENTS, WritableMapBuffer().put(0, fragment))
        }
    return TextLayoutManager.getOrCreateSpannableForText(
        RuntimeEnvironment.getApplication().assets,
        attributedString,
        null,
    )
  }
}
