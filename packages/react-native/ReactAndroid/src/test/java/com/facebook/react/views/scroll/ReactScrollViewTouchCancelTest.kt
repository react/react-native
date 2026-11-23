/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.scroll

import android.annotation.SuppressLint
import android.app.Activity
import android.os.Looper
import android.util.DisplayMetrics
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.FrameLayout
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper.createTestReactApplicationContext
import com.facebook.react.bridge.ScrollEndedListener
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.RootView
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.soloader.SoLoader
import com.facebook.testutils.shadows.ShadowSoLoader
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
import org.mockito.kotlin.verify
import org.robolectric.ParameterizedRobolectricTestRunner
import org.robolectric.Robolectric
import org.robolectric.Shadows.shadowOf
import org.robolectric.android.controller.ActivityController
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

/** Cancelled drags must emit END_DRAG once and complete native scrolling cleanup. */
@SuppressLint("DeprecatedClass", "DeprecatedMethod")
@Config(shadows = [ShadowSoLoader::class])
@RunWith(ParameterizedRobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
class ReactScrollViewTouchCancelTest(private val kind: String) {
  private lateinit var context: ReactApplicationContext
  private lateinit var themedContext: ThemedReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>
  private lateinit var root: TestRoot
  private lateinit var activityController: ActivityController<Activity>
  private lateinit var view: ViewGroup
  private lateinit var beginDrag: (MotionEvent) -> Unit
  private val fpsListener: FpsListener = mock()
  private val scrollEndedListener: ScrollEndedListener = mock()
  private val events = mutableListOf<ScrollEventType?>()
  private val listener =
      object : ReactScrollViewHelper.ScrollListener {
        override fun onScroll(
            scrollView: ViewGroup?,
            scrollEventType: ScrollEventType?,
            xVelocity: Float,
            yVelocity: Float,
        ) {
          if (scrollView === view) events.add(scrollEventType)
        }

        override fun onLayout(scrollView: ViewGroup?) = Unit
      }

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    SoLoader.setInTestMode()
    context = createTestReactApplicationContext()
    context.scrollEndedListeners.addListener(scrollEndedListener)
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(any()) }
        .thenReturn(mock())

    view =
        when (kind) {
          "vertical" ->
              object : ReactScrollView(themedContext, fpsListener) {
                    fun startDrag(event: MotionEvent) = handleInterceptedTouchEvent(event)
                  }
                  .also {
                    it.setScrollPerfTag(PERF_TAG)
                    beginDrag = it::startDrag
                  }
          "horizontal" ->
              object : ReactHorizontalScrollView(themedContext, fpsListener) {
                    fun startDrag(event: MotionEvent) = handleInterceptedTouchEvent(event)
                  }
                  .also {
                    it.setScrollPerfTag(PERF_TAG)
                    beginDrag = it::startDrag
                  }
          else ->
              object : ReactNestedScrollView(themedContext, fpsListener) {
                    fun startDrag(event: MotionEvent) = handleInterceptedTouchEvent(event)
                  }
                  .also {
                    it.setScrollPerfTag(PERF_TAG)
                    beginDrag = it::startDrag
                  }
        }
    view.addView(View(themedContext).apply { layout(0, 0, 1000, 1000) })
    view.measure(
        View.MeasureSpec.makeMeasureSpec(100, View.MeasureSpec.EXACTLY),
        View.MeasureSpec.makeMeasureSpec(100, View.MeasureSpec.EXACTLY),
    )
    view.layout(0, 0, 100, 100)
    root = TestRoot(themedContext).also { it.addView(view) }
    activityController = Robolectric.buildActivity(Activity::class.java).setup()
    activityController.get().setContentView(root)
    ReactScrollViewHelper.addScrollListener(listener)
  }

  @After
  fun teardown() {
    activityController.pause().stop().destroy()
    ReactScrollViewHelper.removeScrollListener(listener)
    context.scrollEndedListeners.removeListener(scrollEndedListener)
    uiManagerHelperMock.close()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun cancelEndsDragOnlyOnce() {
    startDragging()

    touch(MotionEvent.ACTION_CANCEL)
    touch(MotionEvent.ACTION_CANCEL)
    touch(MotionEvent.ACTION_UP)

    assertThat(events.count { it == ScrollEventType.BEGIN_DRAG }).isEqualTo(1)
    assertThat(events.count { it == ScrollEventType.END_DRAG }).isEqualTo(1)
    assertThat(root.gesturesStarted).isEqualTo(1)
    assertThat(root.gesturesEnded).isEqualTo(1)
  }

  @Test
  fun cancelWithoutDragDoesNotEmitEndDrag() {
    touch(MotionEvent.ACTION_DOWN)
    touch(MotionEvent.ACTION_CANCEL)

    assertThat(events).doesNotContain(ScrollEventType.BEGIN_DRAG, ScrollEventType.END_DRAG)
    assertThat(root.gesturesEnded).isZero()
  }

  @Test
  fun upStillEndsDragOnlyOnce() {
    startDragging()

    touch(MotionEvent.ACTION_UP)
    touch(MotionEvent.ACTION_CANCEL)

    assertThat(events.count { it == ScrollEventType.END_DRAG }).isEqualTo(1)
    assertThat(root.gesturesEnded).isEqualTo(1)
  }

  @Test
  fun cancelCompletesPostTouchCleanup() {
    startDragging()
    touch(MotionEvent.ACTION_CANCEL)

    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofSeconds(1))

    verify(fpsListener).disable(PERF_TAG)
    verify(scrollEndedListener).onScrollEnded(view)
  }

  private fun startDragging() {
    touch(MotionEvent.ACTION_DOWN)
    val event = MotionEvent.obtain(0L, 16L, MotionEvent.ACTION_MOVE, 50f, 20f, 0)
    try {
      beginDrag(event)
    } finally {
      event.recycle()
    }
  }

  private fun touch(action: Int) {
    val event = MotionEvent.obtain(0L, 32L, action, 50f, 20f, 0)
    try {
      view.onTouchEvent(event)
    } finally {
      event.recycle()
    }
  }

  private class TestRoot(context: ThemedReactContext) : FrameLayout(context), RootView {
    var gesturesStarted = 0
    var gesturesEnded = 0

    override fun onChildStartedNativeGesture(childView: View?, ev: MotionEvent) {
      gesturesStarted++
    }

    override fun onChildEndedNativeGesture(childView: View, ev: MotionEvent) {
      gesturesEnded++
    }

    override fun handleException(t: Throwable) {
      throw AssertionError(t)
    }
  }

  companion object {
    private const val PERF_TAG = "cancel-test"

    @JvmStatic
    @ParameterizedRobolectricTestRunner.Parameters(name = "{0}")
    fun parameters(): List<Array<String>> =
        listOf(arrayOf("vertical"), arrayOf("horizontal"), arrayOf("nested"))
  }
}
