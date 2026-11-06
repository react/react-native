/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.drawer

import android.util.DisplayMetrics
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import androidx.drawerlayout.widget.DrawerLayout
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactDrawerLayoutManagerTest {
  private lateinit var drawerLayout: ReactDrawerLayout

  @Before
  fun setUp() {
    DisplayMetricsHolder.initDisplayMetricsIfNotInitialized(RuntimeEnvironment.getApplication())
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    drawerLayout = ReactDrawerLayout(ThemedReactContext(context, context, null, -1))
    drawerLayout.addView(
        View(drawerLayout.context),
        DrawerLayout.LayoutParams(100, ViewGroup.LayoutParams.MATCH_PARENT, Gravity.START),
    )
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun testNaNElevationLeavesTheDrawerUnelevated() {
    ReactDrawerLayoutManager().setElevation(drawerLayout, Float.NaN)

    assertThat(drawerLayout.drawerElevation).isEqualTo(0f)
  }

  @Test
  fun testInfiniteElevationTakesTheLargestFiniteElevation() {
    ReactDrawerLayoutManager().setElevation(drawerLayout, Float.POSITIVE_INFINITY)

    assertThat(drawerLayout.drawerElevation).isEqualTo(Float.MAX_VALUE)
  }

  @Test
  fun testElevationPastTheLargestFloatInPixelsTakesTheLargestFiniteElevation() {
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 3f })

    ReactDrawerLayoutManager().setElevation(drawerLayout, Float.MAX_VALUE)

    assertThat(drawerLayout.drawerElevation).isEqualTo(Float.MAX_VALUE)
  }
}
