/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// The deprecated APIs exercised here remain public and required by this Robolectric setup.
@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.annotation.SuppressLint
import android.util.DisplayMetrics
import android.view.View
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.style.BorderRadiusProp
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verifies border radius properties applied by the vertical and horizontal ScrollView managers. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
class ReactScrollViewPropertyTest {

  private lateinit var context: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var themedContext: ThemedReactContext

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context.initializeWithInstance(catalystInstanceMock)
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun testVerticalBorderRadius() {
    val manager = ReactScrollViewManager()
    val view = manager.createViewInstance(themedContext)

    assertBorderRadiusUpdates(view) { manager.updateProperties(view, it) }
    assertDeprecatedFloatBorderRadius(view) { index, radius ->
      manager.setBorderRadius(view, index, radius)
    }
  }

  @Test
  fun testHorizontalBorderRadius() {
    val manager = ReactHorizontalScrollViewManager()
    val view = manager.createViewInstance(themedContext)

    assertBorderRadiusUpdates(view) { manager.updateProperties(view, it) }
    assertDeprecatedFloatBorderRadius(view) { index, radius ->
      manager.setBorderRadius(view, index, radius)
    }
  }

  private fun assertBorderRadiusUpdates(
      view: View,
      updateProperties: (ReactStylesDiffMap) -> Unit,
  ) {
    val percentageRadii =
        listOf(
            Triple("borderRadius", BorderRadiusProp.BORDER_RADIUS, 10f),
            Triple("borderTopLeftRadius", BorderRadiusProp.BORDER_TOP_LEFT_RADIUS, 20f),
            Triple("borderTopRightRadius", BorderRadiusProp.BORDER_TOP_RIGHT_RADIUS, 30f),
            Triple("borderBottomRightRadius", BorderRadiusProp.BORDER_BOTTOM_RIGHT_RADIUS, 40f),
            Triple("borderBottomLeftRadius", BorderRadiusProp.BORDER_BOTTOM_LEFT_RADIUS, 50f),
        )

    percentageRadii.forEach { (name, property, value) ->
      updateProperties(buildStyles(name, "$value%"))
      assertThat(BackgroundStyleApplicator.getBorderRadius(view, property))
          .isEqualTo(LengthPercentage(value, LengthPercentageType.PERCENT))
    }

    updateProperties(buildStyles("borderRadius", 12.0))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(12f, LengthPercentageType.POINT))

    updateProperties(buildStyles("borderRadius", -1.0))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()

    updateProperties(buildStyles("borderRadius", 13.0))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(13f, LengthPercentageType.POINT))

    updateProperties(buildStyles("borderRadius", null))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()
  }

  private fun assertDeprecatedFloatBorderRadius(
      view: View,
      setBorderRadius: (Int, Float) -> Unit,
  ) {
    setBorderRadius(0, 8f)
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(8f, LengthPercentageType.POINT))

    setBorderRadius(0, Float.NaN)
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap =
      ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
}
