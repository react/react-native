/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// TODO T207169925: Migrate CatalystInstance to Reacthost and remove the Suppress("DEPRECATION")
// annotation
@file:Suppress("DEPRECATION")

package com.facebook.react.views.image

import android.graphics.Color
import android.util.DisplayMetrics
import com.facebook.common.logging.FLog
import com.facebook.drawee.backends.pipeline.Fresco
import com.facebook.drawee.drawable.ScalingUtils
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.CatalystInstance
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.common.ReactConstants
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.BackgroundStyleApplicator
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.LengthPercentage
import com.facebook.react.uimanager.LengthPercentageType
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.style.BorderRadiusProp
import com.facebook.react.util.RNLog
import com.facebook.react.views.imagehelper.ImageSource
import com.facebook.soloader.SoLoader
import com.facebook.testutils.shadows.ShadowArguments
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.anyString
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.reset
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

/**
 * Verify that [com.facebook.drawee.drawable.ScalingUtils] properties are being applied correctly by
 * [ReactImageManager].
 */
@Config(shadows = [ShadowArguments::class])
@RunWith(RobolectricTestRunner::class)
class ReactImagePropertyTest {

  private lateinit var context: BridgeReactContext
  private lateinit var catalystInstanceMock: CatalystInstance
  private lateinit var themeContext: ThemedReactContext
  private lateinit var rnLog: MockedStatic<RNLog>
  private lateinit var flogMock: MockedStatic<FLog>

  @Before
  fun setup() {

    rnLog = mockStatic(RNLog::class.java)
    rnLog.`when`<Boolean> { RNLog.w(any(), anyString()) }.thenAnswer {}

    flogMock = mockStatic(FLog::class.java)

    SoLoader.setInTestMode()
    context = BridgeReactContext(RuntimeEnvironment.getApplication())
    catalystInstanceMock = createMockCatalystInstance()
    context.initializeWithInstance(catalystInstanceMock)
    themeContext = ThemedReactContext(context, context, null, -1)
    Fresco.initialize(context)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())

    ReactNativeFeatureFlagsForTests.setUp()
  }

  @After
  fun teardown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
    rnLog.close()
    flogMock.close()
  }

  private fun buildStyles(vararg keysAndValues: Any?): ReactStylesDiffMap {
    return ReactStylesDiffMap(JavaOnlyMap.of(*keysAndValues))
  }

  @Test
  fun testAccessibilityFocus() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    viewManager.setAccessible(view, true)
    assertThat(view.isFocusable).isTrue()
  }

  @Test
  fun testOverlayColor() {
    val viewManager = ReactImageManager()
    val mockView = mock<ReactImageView>()

    viewManager.setOverlayColor(mockView, null)
    verify(mockView).setOverlayColor(Color.TRANSPARENT)
    reset(mockView)

    viewManager.setOverlayColor(mockView, Color.argb(50, 0, 0, 255))
    verify(mockView).setOverlayColor(Color.argb(50, 0, 0, 255))
    reset(mockView)
  }

  @Test
  fun testTintColor() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    assertThat(view.colorFilter).isNull()
    viewManager.updateProperties(view, buildStyles("tintColor", Color.argb(50, 0, 0, 255)))
    // Can't actually assert the specific color so this is the next best thing.
    // Does the color filter now exist?
    assertThat(view.colorFilter).isNotNull()
    viewManager.updateProperties(view, buildStyles("tintColor", null))
    assertThat(view.colorFilter).isNull()
  }

  @Test
  fun testNullSrcs() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)
    val sources = Arguments.createArray()
    val srcObj = Arguments.createMap()
    srcObj.putNull("uri")
    srcObj.putNull("width")
    srcObj.putNull("height")
    sources.pushMap(srcObj)
    viewManager.setSource(view, sources)
    view.maybeUpdateView()
    assertThat(ImageSource.getTransparentBitmapImageSource(view.context))
        .isEqualTo(view.imageSource)
  }

  @Test
  fun testBorderRadius() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)

    // Percentage border radii arrive as strings and must not crash the property updater
    viewManager.updateProperties(view, buildStyles("borderRadius", "50%"))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(50f, LengthPercentageType.PERCENT))

    viewManager.updateProperties(view, buildStyles("borderRadius", 10.0))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(10f, LengthPercentageType.POINT))

    viewManager.updateProperties(view, buildStyles("borderTopLeftRadius", "25%"))
    assertThat(
        BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_TOP_LEFT_RADIUS),
    )
        .isEqualTo(LengthPercentage(25f, LengthPercentageType.PERCENT))

    viewManager.updateProperties(view, buildStyles("borderRadius", null))
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()
  }

  @Suppress("DEPRECATION")
  @Test
  fun testDeprecatedFloatBorderRadius() {
    val viewManager = ReactImageManager()
    val view = viewManager.createViewInstance(themeContext)

    // The deprecated Float overload must not crash and applies the radius as points.
    viewManager.setBorderRadius(view, 0, 8f)
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isEqualTo(LengthPercentage(8f, LengthPercentageType.POINT))

    // NaN clears the radius, matching the pre-Dynamic Float behavior.
    viewManager.setBorderRadius(view, 0, Float.NaN)
    assertThat(BackgroundStyleApplicator.getBorderRadius(view, BorderRadiusProp.BORDER_RADIUS))
        .isNull()
  }

  @Test
  fun testResizeMode() {
    val viewManager = ReactImageManager()
    val mockView = mock<ReactImageView>()

    viewManager.setResizeMode(mockView, null)
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
    reset(mockView)

    viewManager.setResizeMode(mockView, "cover")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
    reset(mockView)

    viewManager.setResizeMode(mockView, "contain")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.FIT_CENTER)
    reset(mockView)

    viewManager.setResizeMode(mockView, "stretch")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.FIT_XY)
    reset(mockView)

    viewManager.setResizeMode(mockView, "repeat")
    verify(mockView).setScaleType(ScaleTypeStartInside.INSTANCE)
    reset(mockView)

    viewManager.setResizeMode(mockView, "center")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_INSIDE)
    reset(mockView)

    viewManager.setResizeMode(mockView, "invalid")
    verify(mockView).setScaleType(ScalingUtils.ScaleType.CENTER_CROP)
  }

  @Test
  fun testResizeMethod() {
    val viewManager = ReactImageManager()
    val mockView = mock<ReactImageView>()

    viewManager.setResizeMethod(mockView, null)
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "auto")
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "resize")
    verify(mockView).setResizeMethod(ImageResizeMethod.RESIZE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "scale")
    verify(mockView).setResizeMethod(ImageResizeMethod.SCALE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "none")
    verify(mockView).setResizeMethod(ImageResizeMethod.NONE)
    reset(mockView)

    viewManager.setResizeMethod(mockView, "invalid")
    verify(mockView).setResizeMethod(ImageResizeMethod.AUTO)
    flogMock.verify { FLog.w(ReactConstants.TAG, "Invalid resize method: 'invalid'") }
  }

  @Test
  fun testResizeMultiplier() {
    val viewManager = ReactImageManager()
    val mockView = mock<ReactImageView>()

    viewManager.setResizeMultiplier(mockView, 0.01f)
    verify(mockView).setResizeMultiplier(0.01f)
    reset(mockView)

    viewManager.setResizeMultiplier(mockView, 0.009f)
    verify(mockView).setResizeMultiplier(0.009f)
    flogMock.verify { FLog.w(ReactConstants.TAG, "Invalid resize multiplier: '0.009'") }
  }

  @Test
  fun testHeaders() {
    val viewManager = ReactImageManager()
    val mockView = mock<ReactImageView>()

    viewManager.setHeaders(mockView, null)
    verify(mockView, never()).setHeaders(any())

    val headers = JavaOnlyMap()
    headers.putString("key", "value")
    viewManager.setHeaders(mockView, headers)
    verify(mockView).setHeaders(headers)
  }
}
