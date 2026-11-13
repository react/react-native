/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.switchview

import android.content.res.ColorStateList
import android.graphics.Color
import android.graphics.drawable.ColorDrawable
import android.graphics.drawable.RippleDrawable
import android.util.DisplayMetrics
import android.view.ContextThemeWrapper
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.style.BoxShadow
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for how [ReactSwitchManager] applies a background color alongside other view styles. */
@RunWith(RobolectricTestRunner::class)
class ReactSwitchManagerTest {

  private lateinit var manager: ReactSwitchManager
  private lateinit var view: ReactSwitch

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
    manager = ReactSwitchManager()
    view =
        ReactSwitch(
            ContextThemeWrapper(
                RuntimeEnvironment.getApplication(),
                androidx.appcompat.R.style.Theme_AppCompat,
            )
        )
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  @Test
  fun backgroundColorKeepsOutlinePropsSetBeforeIt() {
    manager.setOutlineColor(view, Color.BLUE)
    manager.setOutlineOffset(view, 8f)
    manager.setBackgroundColor(view, Color.WHITE)
    manager.setOutlineWidth(view, 3f)

    assertThat(BackgroundStyleApplicator.getOutlineColor(view)).isEqualTo(Color.BLUE)
    assertThat(BackgroundStyleApplicator.getOutlineOffset(view)).isEqualTo(16f)
    assertThat(rippleColor()).isEqualTo(Color.WHITE)
  }

  @Test
  fun backgroundColorUpdateKeepsOutline() {
    manager.setBackgroundColor(view, Color.WHITE)
    manager.setOutlineColor(view, Color.BLUE)
    manager.setOutlineWidth(view, 3f)
    manager.setBackgroundColor(view, Color.YELLOW)

    assertThat(BackgroundStyleApplicator.getOutlineColor(view)).isEqualTo(Color.BLUE)
    assertThat(rippleColor()).isEqualTo(Color.YELLOW)
  }

  @Test
  fun backgroundColorKeepsBoxShadow() {
    BackgroundStyleApplicator.setBoxShadow(
        view,
        listOf(BoxShadow(offsetX = 0f, offsetY = 0f, color = Color.RED, spreadDistance = 6f)),
    )
    manager.setBackgroundColor(view, Color.WHITE)

    val composite = view.background as CompositeBackgroundDrawable
    assertThat(composite.outerShadows).hasSize(1)
    assertThat(rippleColor()).isEqualTo(Color.WHITE)
  }

  @Test
  fun thumbColorTintsRippleWrappedByOtherStyles() {
    manager.setBackgroundColor(view, Color.WHITE)
    manager.setOutlineWidth(view, 3f)
    manager.setThumbColor(view, Color.GREEN)

    val pressed = intArrayOf(android.R.attr.state_pressed)
    assertThat(rippleEffectColor().getColorForState(pressed, 0)).isEqualTo(Color.GREEN)
  }

  @Test
  fun backgroundColorKeepsThumbColorSetBeforeIt() {
    manager.setThumbColor(view, Color.GREEN)
    manager.setBackgroundColor(view, Color.WHITE)

    val pressed = intArrayOf(android.R.attr.state_pressed)
    assertThat(rippleEffectColor().getColorForState(pressed, 0)).isEqualTo(Color.GREEN)
    assertThat(rippleColor()).isEqualTo(Color.WHITE)
  }

  @Test
  fun backgroundColorDoesNotUseClearedThumbColor() {
    manager.setThumbColor(view, Color.GREEN)
    manager.setThumbColor(view, null)
    manager.setBackgroundColor(view, Color.WHITE)

    val pressed = intArrayOf(android.R.attr.state_pressed)
    assertThat(rippleEffectColor().getColorForState(pressed, 0)).isEqualTo(Color.WHITE)
  }

  private fun ripple(): RippleDrawable {
    val background = view.background
    val drawable =
        if (background is CompositeBackgroundDrawable) background.originalBackground else background
    return drawable as RippleDrawable
  }

  private fun rippleColor(): Int = (ripple().getDrawable(0) as ColorDrawable).color

  // RippleDrawable has no public getter for the color passed to setColor().
  private fun rippleEffectColor(): ColorStateList {
    val state =
        RippleDrawable::class
            .java
            .getDeclaredField("mState")
            .apply { isAccessible = true }
            .get(ripple())
    return state.javaClass.getDeclaredField("mColor").apply { isAccessible = true }.get(state)
        as ColorStateList
  }
}
