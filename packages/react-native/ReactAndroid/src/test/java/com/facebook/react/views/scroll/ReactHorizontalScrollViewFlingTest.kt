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
import android.os.Build
import android.os.Looper
import android.os.SystemClock
import android.util.DisplayMetrics
import android.view.MotionEvent
import android.view.View
import android.widget.EdgeEffect
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.soloader.SoLoader
import java.time.Duration
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
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

/** Verifies where a horizontal ScrollView comes to rest after a drag that ends in a fling. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@RunWith(RobolectricTestRunner::class)
@Config(sdk = [34], shadows = [ReactHorizontalScrollViewFlingTest.ShadowStretchEdgeEffect::class])
class ReactHorizontalScrollViewFlingTest {

  /** Robolectric turns every edge effect off; a device stretches the edge a drag pulls past. */
  @Implements(EdgeEffect::class)
  class ShadowStretchEdgeEffect {
    @Implementation(minSdk = Build.VERSION_CODES.S)
    fun getCurrentEdgeEffectBehavior(): Int = EDGE_EFFECT_TYPE_STRETCH
  }

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
  fun testFlingIntoLeftEdgeAtRestStaysAtLeftEdge() {
    val view = createAtLeftEdge()

    dragAndRelease(view, fromX = DRAG_START_X, toX = DRAG_END_X)
    settle(view)

    assertThat(view.scrollX).isEqualTo(0)
  }

  @Test
  fun testFlingFromLeftEdgeIntoContentScrollsPastTheDrag() {
    val view = createAtLeftEdge()

    dragAndRelease(view, fromX = DRAG_END_X, toX = DRAG_START_X)
    settle(view)

    assertThat(view.scrollX).isGreaterThan((DRAG_END_X - DRAG_START_X).toInt())
  }

  private fun createAtLeftEdge(): ReactHorizontalScrollView {
    val view = ReactHorizontalScrollViewManager().createViewInstance(themedContext)
    val content = View(themedContext)
    view.addView(content)
    content.layout(0, 0, CONTENT_WIDTH, VIEWPORT_SIZE)
    view.layout(0, 0, VIEWPORT_SIZE, VIEWPORT_SIZE)
    assertThat(view.scrollX).isEqualTo(0)
    return view
  }

  private fun dragAndRelease(view: ReactHorizontalScrollView, fromX: Float, toX: Float) {
    val downTime = SystemClock.uptimeMillis()
    val stepX = (toX - fromX) / DRAG_STEPS
    view.onTouchEvent(obtainTouch(downTime, 0, MotionEvent.ACTION_DOWN, fromX))
    for (step in 1 until DRAG_STEPS) {
      view.onTouchEvent(obtainTouch(downTime, step, MotionEvent.ACTION_MOVE, fromX + stepX * step))
    }
    view.onTouchEvent(obtainTouch(downTime, DRAG_STEPS, MotionEvent.ACTION_UP, toX))
  }

  private fun obtainTouch(downTime: Long, step: Int, action: Int, x: Float): MotionEvent =
      MotionEvent.obtain(downTime, downTime + step * STEP_MILLIS, action, x, TOUCH_Y, 0)

  private fun settle(view: ReactHorizontalScrollView) {
    repeat(SETTLE_FRAMES) {
      shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(FRAME_MILLIS))
      view.computeScroll()
    }
  }

  private companion object {
    // EdgeEffect.TYPE_STRETCH, which the SDK hides.
    const val EDGE_EFFECT_TYPE_STRETCH = 1
    const val VIEWPORT_SIZE = 1000
    const val CONTENT_WIDTH = 5000
    const val TOUCH_Y = 500f
    const val DRAG_START_X = 100f
    const val DRAG_END_X = 500f
    const val DRAG_STEPS = 4
    const val STEP_MILLIS = 10L
    const val FRAME_MILLIS = 16L
    const val SETTLE_FRAMES = 180
  }
}
