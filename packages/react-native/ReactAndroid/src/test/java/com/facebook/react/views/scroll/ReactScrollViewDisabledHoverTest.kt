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
import android.view.ViewGroup
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.soloader.SoLoader
import com.facebook.testutils.shadows.ShadowSoLoader
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
import org.robolectric.annotation.Config

/** Verifies that a ScrollView with scrolling disabled ignores the mouse wheel but not hover. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ReactScrollViewDisabledHoverTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    SoLoader.setInTestMode()
    val context = createTestReactApplicationContext()
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
  fun testScrollViewWithScrollDisabledDispatchesHoverToContent() {
    val view = ReactScrollViewManager().createViewInstance(themedContext)
    view.scrollEnabled = false

    assertThat(hoverReachesContent(view)).isTrue()
  }

  @Test
  fun testHorizontalScrollViewWithScrollDisabledDispatchesHoverToContent() {
    val view = ReactHorizontalScrollViewManager().createViewInstance(themedContext)
    view.scrollEnabled = false

    assertThat(hoverReachesContent(view)).isTrue()
  }

  @Test
  fun testNestedScrollViewWithScrollDisabledDispatchesHoverToContent() {
    val view = ReactNestedScrollView(themedContext)
    view.scrollEnabled = false

    assertThat(hoverReachesContent(view)).isTrue()
  }

  @Test
  fun testScrollViewWithScrollDisabledIgnoresWheel() {
    val view = ReactScrollViewManager().createViewInstance(themedContext)
    view.scrollEnabled = false
    addContent(view)

    val handled = dispatchAndRecycle(view, obtainWheelScroll(MotionEvent.AXIS_VSCROLL, -1f))

    assertThat(handled).isFalse()
    assertThat(view.scrollY).isZero()
  }

  @Test
  fun testHorizontalScrollViewWithScrollDisabledIgnoresWheel() {
    val view = ReactHorizontalScrollViewManager().createViewInstance(themedContext)
    view.scrollEnabled = false
    addContent(view)

    val handled = dispatchAndRecycle(view, obtainWheelScroll(MotionEvent.AXIS_HSCROLL, 1f))

    assertThat(handled).isFalse()
    assertThat(view.scrollX).isZero()
  }

  @Test
  fun testNestedScrollViewWithScrollDisabledIgnoresWheel() {
    val view = ReactNestedScrollView(themedContext)
    view.scrollEnabled = false
    addContent(view)

    val handled = dispatchAndRecycle(view, obtainWheelScroll(MotionEvent.AXIS_VSCROLL, -1f))

    assertThat(handled).isFalse()
    assertThat(view.scrollY).isZero()
  }

  private fun hoverReachesContent(view: ViewGroup): Boolean {
    var hovered = false
    addContent(view).setOnHoverListener { _, _ ->
      hovered = true
      true
    }
    dispatchAndRecycle(view, obtainStylusHover(MotionEvent.ACTION_HOVER_ENTER))
    dispatchAndRecycle(view, obtainStylusHover(MotionEvent.ACTION_HOVER_MOVE))
    return hovered
  }

  private fun addContent(view: ViewGroup): View {
    val content = View(themedContext)
    view.addView(content)
    content.layout(0, 0, CONTENT_SIZE, CONTENT_SIZE)
    view.layout(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    return content
  }

  private fun dispatchAndRecycle(view: View, event: MotionEvent): Boolean =
      try {
        view.dispatchGenericMotionEvent(event)
      } finally {
        event.recycle()
      }

  private fun obtainStylusHover(action: Int): MotionEvent {
    val event = MotionEvent.obtain(0L, 0L, action, VIEWPORT_SIZE / 2f, VIEWPORT_SIZE / 2f, 0)
    event.source = InputDevice.SOURCE_STYLUS
    return event
  }

  private fun obtainWheelScroll(axis: Int, value: Float): MotionEvent {
    val properties =
        MotionEvent.PointerProperties().apply { toolType = MotionEvent.TOOL_TYPE_MOUSE }
    val coords = MotionEvent.PointerCoords().apply { setAxisValue(axis, value) }
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
    const val CONTENT_SIZE = 1000
  }
}
