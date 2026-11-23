/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.graphics.Canvas
import android.graphics.Outline
import android.graphics.Path
import android.graphics.Rect
import android.graphics.drawable.ColorDrawable
import android.os.Build
import android.view.View
import android.view.ViewOutlineProvider
import com.facebook.react.R
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.uimanager.style.LogicalEdge
import com.facebook.react.views.view.ReactViewGroup
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.any
import org.mockito.kotlin.anyOrNull
import org.mockito.kotlin.atLeastOnce
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.util.ReflectionHelpers

/**
 * Tests for the anti-aliased clips [BackgroundStyleApplicator.updatePaddingBoxClip] uses on API
 * 28-29.
 *
 * The clip choice depends only on `Build.VERSION.SDK_INT`, so the tests set it rather than running
 * in older Robolectric SDKs: each extra SDK loads its own android-all runtime into the test JVM.
 */
@RunWith(RobolectricTestRunner::class)
@Config(qualifiers = "xhdpi")
class BackgroundStyleApplicatorClipTest {

  private lateinit var context: Context
  private val sdkInt = Build.VERSION.SDK_INT

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    context = RuntimeEnvironment.getApplication()
    DisplayMetricsHolder.setScreenDisplayMetrics(context.resources.displayMetrics)
    setSdkInt(Build.VERSION_CODES.P)
  }

  @After
  fun tearDown() {
    setSdkInt(sdkInt)
  }

  @Test
  fun `uniform radius without border clips with a round rect outline`() {
    val view = roundedView()
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)

    assertThat(view.clipToOutline).isTrue()
    verify(canvas, never()).clipPath(any<Path>())
    val outline = Outline()
    view.background.getOutline(outline)
    val rect = Rect()
    assertThat(outline.getRect(rect)).isTrue()
    assertThat(rect).isEqualTo(Rect(0, 0, 200, 200))
    // 8dp at xhdpi
    assertThat(outline.radius).isEqualTo(16f)
  }

  @Test
  fun `border falls back to the canvas clip`() {
    val view = roundedView()
    BackgroundStyleApplicator.setBorderWidth(view, LogicalEdge.ALL, 2f)
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)

    assertThat(view.clipToOutline).isFalse()
    verify(canvas).clipPath(any<Path>())
  }

  @Test
  fun `different corner radii fall back to the canvas clip`() {
    val view = roundedView()
    BackgroundStyleApplicator.setBorderRadius(
        view,
        BorderRadiusProp.BORDER_TOP_LEFT_RADIUS,
        LengthPercentage(4f, LengthPercentageType.POINT),
    )
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)

    assertThat(view.clipToOutline).isFalse()
    verify(canvas).clipPath(any<Path>())
  }

  @Test
  fun `software draw clips the canvas and keeps the outline clip`() {
    val view = roundedView()
    BackgroundStyleApplicator.updatePaddingBoxClip(view, hardwareCanvas(), true)
    val softwareCanvas = mock<Canvas>()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, softwareCanvas, true)

    verify(softwareCanvas).clipPath(any<Path>())
    assertThat(view.clipToOutline).isTrue()
  }

  @Test
  fun `clip false removes the outline clip`() {
    val view = roundedView()
    BackgroundStyleApplicator.updatePaddingBoxClip(view, hardwareCanvas(), true)
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, false)

    assertThat(view.clipToOutline).isFalse()
    verify(canvas, never()).clipPath(any<Path>())
  }

  @Test
  fun `clipToOutline set by someone else is left alone`() {
    val view = roundedView()
    view.clipToOutline = true
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)
    BackgroundStyleApplicator.updatePaddingBoxClip(view, hardwareCanvas(), false)

    assertThat(view.clipToOutline).isTrue()
    verify(canvas).clipPath(any<Path>())
  }

  @Test
  fun `a bordered ReactViewGroup keeps the canvas clip, with no layer`() {
    val view = ReactViewGroup(context)
    BackgroundStyleApplicator.setBorderRadius(
        view,
        BorderRadiusProp.BORDER_RADIUS,
        LengthPercentage(16f, LengthPercentageType.POINT),
    )
    view.setBorderWidth(8, 2f)
    view.layout(0, 0, 200, 200)
    view.background.setBounds(0, 0, 200, 200)
    view.overflow = "hidden"
    val canvas = hardwareCanvas()

    view.draw(canvas)

    assertThat(view.clipToOutline).isFalse()
    // The rounded border draws through clipPath too, so only require at least one.
    verify(canvas, atLeastOnce()).clipPath(any<Path>())
    verify(canvas, never()).saveLayer(any<Float>(), any(), any(), any(), anyOrNull())
  }

  @Test
  fun `updatePaddingBoxOutlineClip reports whether the outline clips, without clipping the canvas`() {
    val rounded = roundedView()
    val bordered = roundedView()
    BackgroundStyleApplicator.setBorderWidth(bordered, LogicalEdge.ALL, 2f)
    val canvas = hardwareCanvas()

    assertThat(BackgroundStyleApplicator.updatePaddingBoxOutlineClip(rounded, canvas, true))
        .isTrue()
    assertThat(BackgroundStyleApplicator.updatePaddingBoxOutlineClip(bordered, canvas, true))
        .isFalse()
    verify(canvas, never()).clipPath(any<Path>())
  }

  @Test
  fun `ReactViewGroup switches the outline clip with overflow`() {
    val view = ReactViewGroup(context)
    BackgroundStyleApplicator.setBorderRadius(
        view,
        BorderRadiusProp.BORDER_RADIUS,
        LengthPercentage(16f, LengthPercentageType.POINT),
    )
    view.layout(0, 0, 200, 200)
    view.background.setBounds(0, 0, 200, 200)

    view.overflow = "hidden"
    view.draw(hardwareCanvas())
    assertThat(view.clipToOutline).isTrue()

    view.overflow = "visible"
    view.draw(hardwareCanvas())
    assertThat(view.clipToOutline).isFalse()
  }

  @Test
  fun `API 29 clips with the outline too`() {
    setSdkInt(Build.VERSION_CODES.Q)
    val view = roundedView()
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)

    assertThat(view.clipToOutline).isTrue()
    verify(canvas, never()).clipPath(any<Path>())
  }

  @Test
  fun `a percentage radius resolves against the bounds in dp`() {
    setSdkInt(sdkInt)
    val view = View(context)
    BackgroundStyleApplicator.setBorderRadius(
        view,
        BorderRadiusProp.BORDER_RADIUS,
        LengthPercentage(10f, LengthPercentageType.PERCENT),
    )
    view.layout(0, 0, 200, 200)
    view.background.setBounds(0, 0, 200, 200)
    val outline = Outline()

    view.background.getOutline(outline)

    // 10% of 100dp is 10dp, 20px at xhdpi
    assertThat(outline.radius).isEqualTo(20f)
  }

  @Test
  fun `a feedback ripple, a filter or a custom outline provider keeps the canvas clip`() {
    val rippled = roundedView()
    BackgroundStyleApplicator.setFeedbackUnderlay(rippled, ColorDrawable())
    rippled.background.setBounds(0, 0, 200, 200)
    val filtered = roundedView()
    filtered.setTag(R.id.filter, Any())
    val outlined = roundedView()
    outlined.outlineProvider = ViewOutlineProvider.BOUNDS

    for (view in listOf(rippled, filtered, outlined)) {
      val canvas = hardwareCanvas()
      BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)
      assertThat(view.clipToOutline).isFalse()
      verify(canvas).clipPath(any<Path>())
    }
  }

  @Test
  fun `API 27 keeps the canvas clip`() {
    setSdkInt(Build.VERSION_CODES.O_MR1)
    assertCanvasClip()
  }

  @Test
  fun `anti-aliased clipPath on API 30 keeps the canvas clip`() {
    setSdkInt(Build.VERSION_CODES.R)
    assertCanvasClip()
  }

  private fun assertCanvasClip() {
    val view = roundedView()
    val canvas = hardwareCanvas()

    BackgroundStyleApplicator.updatePaddingBoxClip(view, canvas, true)

    assertThat(view.clipToOutline).isFalse()
    verify(canvas).clipPath(any<Path>())
  }

  private fun roundedView(): View {
    val view = View(context)
    BackgroundStyleApplicator.setBorderRadius(
        view,
        BorderRadiusProp.BORDER_RADIUS,
        LengthPercentage(8f, LengthPercentageType.POINT),
    )
    view.layout(0, 0, 200, 200)
    view.background.setBounds(0, 0, 200, 200)
    return view
  }

  private fun setSdkInt(sdk: Int) {
    ReflectionHelpers.setStaticField(Build.VERSION::class.java, "SDK_INT", sdk)
  }

  private fun hardwareCanvas(): Canvas {
    val canvas = mock<Canvas>()
    whenever(canvas.isHardwareAccelerated).thenReturn(true)
    return canvas
  }
}
