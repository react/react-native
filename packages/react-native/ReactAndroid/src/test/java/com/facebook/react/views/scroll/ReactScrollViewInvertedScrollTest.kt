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
import android.view.InputDevice
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.soloader.SoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

/** Verifies the direction of wheel and joystick scrolling in regular and inverted ScrollViews. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
class ReactScrollViewInvertedScrollTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    SoLoader.setInTestMode()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(any()) }
        .thenReturn(mock())
  }

  @After
  fun teardown() {
    uiManagerHelperMock.close()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun testWheelScrollUpScrollsTowardStart() {
    val view = createScrolledToMiddle()

    view.onGenericMotionEvent(obtainWheelScroll(1f))

    assertThat(view.scrollY).isLessThan(MIDDLE_SCROLL_Y)
  }

  @Test
  fun testInvertedWheelScrollUpScrollsTowardEnd() {
    // The transform an inverted VirtualizedList applies on Android.
    val view = createScrolledToMiddle(JavaOnlyArray.of(JavaOnlyMap.of("scale", -1.0)))

    view.onGenericMotionEvent(obtainWheelScroll(1f))

    assertThat(view.scrollY).isGreaterThan(MIDDLE_SCROLL_Y)
  }

  @Test
  fun testInvertedParentWheelScrollUpScrollsTowardEnd() {
    val view = createScrolledToMiddle()
    // With a refreshControl, ScrollView moves its transform to the wrapping refresh layout.
    FrameLayout(themedContext).apply { scaleY = -1f }.addView(view)

    view.onGenericMotionEvent(obtainWheelScroll(1f))

    assertThat(view.scrollY).isGreaterThan(MIDDLE_SCROLL_Y)
  }

  private fun createScrolledToMiddle(transform: JavaOnlyArray? = null): ReactScrollView {
    val manager = ReactScrollViewManager()
    val view = manager.createViewInstance(themedContext)
    if (transform != null) {
      manager.updateProperties(view, ReactStylesDiffMap(JavaOnlyMap.of("transform", transform)))
    }
    val content = View(themedContext)
    view.addView(content)
    content.layout(0, 0, VIEWPORT_SIZE, CONTENT_HEIGHT)
    view.layout(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    view.scrollTo(0, MIDDLE_SCROLL_Y)
    assertThat(view.scrollY).isEqualTo(MIDDLE_SCROLL_Y)
    return view
  }

  private fun obtainWheelScroll(vScroll: Float): MotionEvent {
    val properties =
        MotionEvent.PointerProperties().apply { toolType = MotionEvent.TOOL_TYPE_MOUSE }
    val coords =
        MotionEvent.PointerCoords().apply { setAxisValue(MotionEvent.AXIS_VSCROLL, vScroll) }
    return MotionEvent.obtain(
        0L,
        0L,
        MotionEvent.ACTION_SCROLL,
        1,
        arrayOf(properties),
        arrayOf(coords),
        0,
        0,
        1f,
        1f,
        0,
        0,
        InputDevice.SOURCE_MOUSE,
        0,
    )
  }

  private companion object {
    const val VIEWPORT_SIZE = 100
    const val CONTENT_HEIGHT = 1000
    const val MIDDLE_SCROLL_Y = 450
  }
}
