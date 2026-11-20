/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.util.DisplayMetrics
import android.view.MotionEvent
import android.view.View
import android.widget.FrameLayout
import android.widget.HorizontalScrollView
import android.widget.OverScroller
import androidx.core.view.ViewCompat
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
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

/** Verifies that a drag starting on a nested horizontal ScrollView is left to that child. */
@RunWith(RobolectricTestRunner::class)
class ReactHorizontalScrollViewNestedInterceptTest {

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
  fun testDragOnNestedScrollViewIsNotIntercepted() {
    val outer = createOuterWithNestedScrollView()

    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_DOWN, 800f, NESTED_Y)))
        .isFalse()
    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_MOVE, 400f, NESTED_Y)))
        .isFalse()
  }

  @Test
  fun testDragOnNestedScrollViewIsNotInterceptedAfterAnUnfinishedGesture() {
    val outer = createOuterWithNestedScrollView()
    // Starts outside the nested view, then a child claims it: no UP or CANCEL arrives.
    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_DOWN, 200f, OUTSIDE_Y)))
        .isFalse()

    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_DOWN, 800f, NESTED_Y)))
        .isFalse()
    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_MOVE, 780f, NESTED_Y)))
        .isFalse()
  }

  @Test
  fun testDragOutsideNestedScrollViewIsStillIntercepted() {
    val outer = createOuterWithNestedScrollView()

    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_DOWN, 800f, OUTSIDE_Y)))
        .isFalse()
    assertThat(outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_MOVE, 400f, OUTSIDE_Y)))
        .isTrue()
  }

  @Test
  fun testTouchOnNestedScrollViewDoesNotStopAFling() {
    val outer = createOuterWithNestedScrollView()
    outer.fling(FLING_VELOCITY)
    val scroller = outerScroller(outer)
    assertThat(scroller.isFinished).isFalse()

    outer.onInterceptTouchEvent(obtain(MotionEvent.ACTION_DOWN, 800f, NESTED_Y))

    assertThat(scroller.isFinished).isFalse()
  }

  private fun outerScroller(view: ReactHorizontalScrollView): OverScroller {
    val field = HorizontalScrollView::class.java.getDeclaredField("mScroller")
    field.isAccessible = true
    return field.get(view) as OverScroller
  }

  private fun createOuterWithNestedScrollView(): ReactHorizontalScrollView {
    val outer = ReactHorizontalScrollView(themedContext)
    val content = FrameLayout(themedContext)
    val nested = ReactHorizontalScrollView(themedContext)
    ViewCompat.setNestedScrollingEnabled(nested, true)
    val nestedContent = View(themedContext)
    nested.addView(nestedContent)
    content.addView(nested)
    outer.addView(content)

    // Top-down: a parent's layout pass resets unmeasured children.
    outer.layout(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    content.layout(0, 0, VIEWPORT_SIZE * 2, VIEWPORT_SIZE)
    nested.layout(0, NESTED_TOP, VIEWPORT_SIZE, NESTED_TOP + NESTED_HEIGHT)
    nestedContent.layout(0, 0, VIEWPORT_SIZE * 3, NESTED_HEIGHT)
    return outer
  }

  private fun obtain(action: Int, x: Float, y: Float): MotionEvent =
      MotionEvent.obtain(0L, 0L, action, x, y, 0)

  private companion object {
    const val VIEWPORT_SIZE = 1000
    const val NESTED_TOP = 500
    const val NESTED_HEIGHT = 200
    const val NESTED_Y = 600f
    const val OUTSIDE_Y = 200f
    const val FLING_VELOCITY = 5000
  }
}
