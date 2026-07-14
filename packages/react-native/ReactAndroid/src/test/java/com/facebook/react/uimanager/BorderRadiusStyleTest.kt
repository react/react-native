/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.BorderRadiusStyle
import com.facebook.react.uimanager.style.ComputedBorderRadiusProp
import com.facebook.react.uimanager.style.CornerRadii
import org.assertj.core.api.Assertions.*
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [BorderRadiusStyle] */
@RunWith(RobolectricTestRunner::class)
class BorderRadiusStyleTest {

  private val ctx: Context = RuntimeEnvironment.getApplication()

  @Test
  fun testCorrectPriorityLTR() {
    val propertyOrderMap = mapOf(
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_LEFT_RADIUS,
                BorderRadiusProp.BORDER_TOP_START_RADIUS,
                BorderRadiusProp.BORDER_START_START_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_TOP_END_RADIUS,
                BorderRadiusProp.BORDER_START_END_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_START_RADIUS,
                BorderRadiusProp.BORDER_END_START_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_END_RADIUS,
                BorderRadiusProp.BORDER_END_END_RADIUS,
            ),
    )

    propertyOrderMap.forEach { order ->
      val borderRadiusStyle = BorderRadiusStyle()
      // Starting count on 3 to test 0 override
      var count = 3f
      for (prop in order.value) {
        borderRadiusStyle.set(prop, LengthPercentage(count, LengthPercentageType.POINT))
        val resolved = borderRadiusStyle.resolve(0, context = ctx, width = 100f, height = 100f)
        assertThat(resolved.get(order.key)).isEqualTo(CornerRadii(count, count))
        count -= 1f
      }
    }
  }

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun testCorrectPriorityRTL() {
    setContextLeftAndRightSwap(ctx, true)
    val propertyOrderMap = mapOf(
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_TOP_END_RADIUS,
                BorderRadiusProp.BORDER_START_END_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_LEFT_RADIUS,
                BorderRadiusProp.BORDER_TOP_START_RADIUS,
                BorderRadiusProp.BORDER_START_START_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_END_RADIUS,
                BorderRadiusProp.BORDER_END_END_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_START_RADIUS,
                BorderRadiusProp.BORDER_END_START_RADIUS,
            ),
    )

    propertyOrderMap.forEach { order ->
      val borderRadiusStyle = BorderRadiusStyle()
      // Starting count on 3 to test 0 override
      var count = 3f
      for (prop in order.value) {
        borderRadiusStyle.set(prop, LengthPercentage(count, LengthPercentageType.POINT))
        val resolved = borderRadiusStyle.resolve(1, context = ctx, width = 100f, height = 100f)
        assertThat(resolved.get(order.key)).isEqualTo(CornerRadii(count, count))
        count -= 1f
      }
    }
  }

  @Test
  fun testCorrectPriorityRTLNoSwap() {
    setContextLeftAndRightSwap(ctx, false)
    val propertyOrderMap = mapOf(
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_LEFT_RADIUS,
                BorderRadiusProp.BORDER_TOP_END_RADIUS,
                BorderRadiusProp.BORDER_START_END_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_TOP_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_TOP_START_RADIUS,
                BorderRadiusProp.BORDER_START_START_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_LEFT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_START_RADIUS,
                BorderRadiusProp.BORDER_END_END_RADIUS,
            ),
        ComputedBorderRadiusProp.COMPUTED_BORDER_BOTTOM_RIGHT_RADIUS to
            arrayOf(
                BorderRadiusProp.BORDER_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS,
                BorderRadiusProp.BORDER_BOTTOM_END_RADIUS,
                BorderRadiusProp.BORDER_END_START_RADIUS,
            ),
    )

    propertyOrderMap.forEach { order ->
      val borderRadiusStyle = BorderRadiusStyle()
      // Starting count on 3 to test 0 override
      var count = 3f
      for (prop in order.value) {
        borderRadiusStyle.set(prop, LengthPercentage(count, LengthPercentageType.POINT))
        val resolved = borderRadiusStyle.resolve(1, context = ctx, width = 100f, height = 100f)
        assertThat(resolved.get(order.key)).isEqualTo(CornerRadii(count, count))
        count -= 1f
      }
    }
  }

  @Test
  fun testBorderRadiusPercentages() {
    val borderRadiusStyle = BorderRadiusStyle(
        topLeft = LengthPercentage(0f, LengthPercentageType.PERCENT),
        topRight = LengthPercentage(10f, LengthPercentageType.PERCENT),
        bottomLeft = LengthPercentage(20f, LengthPercentageType.PERCENT),
        bottomRight = LengthPercentage(30f, LengthPercentageType.PERCENT),
    )
    val resolved = borderRadiusStyle.resolve(0, context = ctx, width = 1000f, height = 1000f)

    assertThat(resolved.topLeft).isEqualTo(CornerRadii(0f, 0f))
    assertThat(resolved.topRight).isEqualTo(CornerRadii(100f, 100f))
    assertThat(resolved.bottomLeft).isEqualTo(CornerRadii(200f, 200f))
    assertThat(resolved.bottomRight).isEqualTo(CornerRadii(300f, 300f))
  }

  /*
   * Make I18nUtil.instance.doLeftAndRightSwapInRTL(context) return false
   * by setting context preference
   */
  private fun setContextLeftAndRightSwap(context: Context, leftAndRightSwap: Boolean) {
    val sharedPrefs =
        context.getSharedPreferences(
            "com.facebook.react.modules.i18nmanager.I18nUtil",
            Context.MODE_PRIVATE,
        )
    val editor = sharedPrefs.edit()
    editor.putBoolean("RCTI18nUtil_makeRTLFlipLeftAndRightStyles", leftAndRightSwap)
    editor.apply()
  }
}
