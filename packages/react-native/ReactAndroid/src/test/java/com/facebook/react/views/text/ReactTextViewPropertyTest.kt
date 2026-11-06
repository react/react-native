/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.touch.JSResponderHandler
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Verify view properties are being applied correctly by [ReactTextViewManager] */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactTextViewPropertyTest {

  private lateinit var context: ReactApplicationContext
  private lateinit var themedContext: ThemedReactContext
  private lateinit var manager: ReactTextViewManager

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableViewRecycling(): Boolean = true
        },
    )
    context = createTestReactApplicationContext()
    themedContext = ThemedReactContext(context, context, null, -1)
    manager = ReactTextViewManager()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testBorderRadius() {
    val view = manager.createViewInstance(themedContext)

    // Percentage border radii arrive as strings and must not crash the property updater
    manager.updateProperties(view, buildStyles("borderRadius", "50%"))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(50f, LengthPercentageType.PERCENT))

    manager.updateProperties(view, buildStyles("borderRadius", 10.0))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(10f, LengthPercentageType.POINT))

    manager.updateProperties(view, buildStyles("borderRadius", null))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()
  }

  @Test
  fun testRecycledViewIsAsImportantForAccessibilityAsANewView() {
    val previous =
        manager.createView(
            1,
            themedContext,
            buildStyles("importantForAccessibility", "no-hide-descendants"),
            null,
            JSResponderHandler(),
        )
    manager.onDropViewInstance(previous)
    val recycled = manager.createView(2, themedContext, buildStyles(), null, JSResponderHandler())

    assertThat(recycled).isSameAs(previous)
    assertThat(recycled.importantForAccessibility)
        .isEqualTo(manager.createViewInstance(themedContext).importantForAccessibility)
  }
}
