/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.graphics.Color
import android.graphics.Rect
import android.graphics.drawable.Drawable
import android.util.DisplayMetrics
import android.view.View
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.drawable.CompositeBackgroundDrawable
import com.facebook.react.uimanager.drawable.InsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.OutsetBoxShadowDrawable
import com.facebook.react.uimanager.drawable.RecordingCanvas
import com.facebook.react.uimanager.style.BoxShadow
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Tests for [BackgroundStyleApplicator.setBoxShadow] */
@RunWith(RobolectricTestRunner::class)
class BackgroundStyleApplicatorBoxShadowTest {

  private val context: Context = RuntimeEnvironment.getApplication()

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics().apply { density = 2f })
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun aShadowListOfTheSameShapeKeepsTheBackgroundAndItsShadowDrawables() {
    val view = View(context)
    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 1f), inset(spread = 1f)))
    val background = view.background as CompositeBackgroundDrawable
    val outerShadow = background.outerShadows.single()
    val innerShadow = background.innerShadows.single()

    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 2f), inset(spread = 2f)))

    assertThat(view.background).isSameAs(background)
    assertThat(background.outerShadows.single()).isSameAs(outerShadow)
    assertThat(background.innerShadows.single()).isSameAs(innerShadow)
  }

  @Test
  fun aShadowListOfTheSameShapeDrawsItsNewValues() {
    val view = View(context)
    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 1f), inset(spread = 1f)))

    BackgroundStyleApplicator.setBoxShadow(
        view,
        listOf(
            outset(color = Color.RED, offsetX = -4f, offsetY = 5f, blurRadius = 4f, spread = 2f),
            inset(color = Color.BLUE, offsetX = 6f, offsetY = -1f, blurRadius = 6f, spread = 3f),
        ),
    )

    val background = view.background as CompositeBackgroundDrawable
    assertDrawsLike(
        background.outerShadows.single(),
        OutsetBoxShadowDrawable(
            context = context,
            shadowColor = Color.RED,
            offsetX = -4f,
            offsetY = 5f,
            blurRadius = 4f,
            spread = 2f,
        ),
    )
    assertDrawsLike(
        background.innerShadows.single(),
        InsetBoxShadowDrawable(
            context = context,
            shadowColor = Color.BLUE,
            offsetX = 6f,
            offsetY = -1f,
            blurRadius = 6f,
            spread = 3f,
        ),
    )
  }

  @Test
  fun aShadowListOfAnotherShapeGetsNewShadowDrawables() {
    val view = View(context)
    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 1f)))
    val firstShadow = (view.background as CompositeBackgroundDrawable).outerShadows.single()

    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 1f), outset(spread = 2f)))
    val twoShadows = (view.background as CompositeBackgroundDrawable).outerShadows
    assertThat(twoShadows).hasSize(2)
    assertThat(twoShadows).doesNotContain(firstShadow)

    BackgroundStyleApplicator.setBoxShadow(view, listOf(inset(spread = 1f), outset(spread = 2f)))
    val background = view.background as CompositeBackgroundDrawable
    assertThat(background.innerShadows).hasSize(1)
    assertThat(background.outerShadows).hasSize(1)
    assertThat(background.outerShadows.single()).isNotIn(twoShadows)
  }

  @Test
  fun anEmptyShadowListRemovesTheShadows() {
    val view = View(context)
    BackgroundStyleApplicator.setBoxShadow(view, listOf(outset(spread = 1f), inset(spread = 1f)))

    BackgroundStyleApplicator.setBoxShadow(view, emptyList())

    val background = view.background as CompositeBackgroundDrawable
    assertThat(background.outerShadows).isEmpty()
    assertThat(background.innerShadows).isEmpty()
  }

  private fun outset(
      color: Int = Color.BLACK,
      offsetX: Float = 2f,
      offsetY: Float = 3f,
      blurRadius: Float = 0f,
      spread: Float,
  ): BoxShadow =
      BoxShadow(
          offsetX = offsetX,
          offsetY = offsetY,
          color = color,
          blurRadius = blurRadius,
          spreadDistance = spread,
      )

  private fun inset(
      color: Int = Color.BLACK,
      offsetX: Float = 2f,
      offsetY: Float = 3f,
      blurRadius: Float = 0f,
      spread: Float,
  ): BoxShadow =
      BoxShadow(
          offsetX = offsetX,
          offsetY = offsetY,
          color = color,
          blurRadius = blurRadius,
          spreadDistance = spread,
          inset = true,
      )

  private fun assertDrawsLike(drawable: Drawable, expected: Drawable) {
    drawable.bounds = Rect(0, 0, 100, 50)
    expected.bounds = Rect(0, 0, 100, 50)
    assertThat(RecordingCanvas().also { drawable.draw(it) }.calls)
        .isEqualTo(RecordingCanvas().also { expected.draw(it) }.calls)
  }
}
