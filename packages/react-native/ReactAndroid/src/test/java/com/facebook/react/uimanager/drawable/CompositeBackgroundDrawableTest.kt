/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.content.Context
import android.graphics.Outline
import android.graphics.Rect
import android.util.DisplayMetrics
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for the outline of [CompositeBackgroundDrawable] */
@RunWith(RobolectricTestRunner::class)
class CompositeBackgroundDrawableTest {

  private val context: Context = RuntimeEnvironment.getApplication()

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun equalCornersGiveARoundRect() {
    val outline =
        outlineOf(BorderRadiusStyle(listOf(BorderRadiusProp.BORDER_RADIUS to points(10f))))

    val rect = Rect()
    assertThat(outline.getRect(rect)).isTrue()
    assertThat(rect).isEqualTo(Rect(0, 0, 200, 100))
    assertThat(outline.radius).isEqualTo(20f)
  }

  @Test
  fun radiusLargerThanHalfTheShorterSideIsReducedToIt() {
    val outline =
        outlineOf(BorderRadiusStyle(listOf(BorderRadiusProp.BORDER_RADIUS to points(80f))))

    assertThat(outline.getRect(Rect())).isTrue()
    assertThat(outline.radius).isEqualTo(50f)
  }

  @Test
  fun differentCornersGiveAPath() {
    val outline =
        outlineOf(
            BorderRadiusStyle(
                listOf(
                    BorderRadiusProp.BORDER_RADIUS to points(10f),
                    BorderRadiusProp.BORDER_TOP_LEFT_RADIUS to points(4f),
                )
            )
        )

    assertThat(outline.isEmpty).isFalse()
    assertThat(outline.getRect(Rect())).isFalse()
  }

  @Test
  fun noRoundedCornersGiveARect() {
    val outline = outlineOf(null)

    val rect = Rect()
    assertThat(outline.getRect(rect)).isTrue()
    assertThat(rect).isEqualTo(Rect(0, 0, 200, 100))
    assertThat(outline.radius).isEqualTo(0f)
  }

  private fun points(value: Float) = LengthPercentage(value, LengthPercentageType.POINT)

  private fun outlineOf(borderRadius: BorderRadiusStyle?): Outline {
    val drawable = CompositeBackgroundDrawable(context = context, borderRadius = borderRadius)
    drawable.setBounds(0, 0, 200, 100)
    return Outline().also { drawable.getOutline(it) }
  }
}
