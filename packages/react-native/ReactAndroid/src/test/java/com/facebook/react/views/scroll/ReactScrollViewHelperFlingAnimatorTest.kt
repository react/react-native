/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.scroll

import android.animation.ValueAnimator
import android.content.Context
import android.view.View
import android.view.ViewGroup
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasFlingAnimator
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollEventThrottle
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasScrollState
import com.facebook.react.views.scroll.ReactScrollViewHelper.HasStateWrapper
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mock
import org.mockito.Mockito.mockStatic
import org.mockito.Mockito.`when`
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

/**
 * Tests for [ReactScrollViewHelper.registerFlingAnimator], verifying that unthrottled scroll events
 * are dispatched when fling animations end or are cancelled.
 *
 * These events ensure JS state is updated with the final scroll position after programmatic scroll
 * animations complete, preventing stale scroll position data.
 */
@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class ReactScrollViewHelperFlingAnimatorTest {

  private lateinit var mockScrollView: MockScrollView
  private lateinit var mockAnimator: ValueAnimator
  private lateinit var mockChild: View
  private lateinit var mockEventDispatcher: EventDispatcher
  private lateinit var mockContext: ReactContext
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>
  private val scrollListener = TestScrollListener()

  @Before
  @Suppress("UNCHECKED_CAST")
  fun setUp() {
    mockChild = mock()
    mockAnimator = ValueAnimator()
    mockEventDispatcher = mock()
    mockContext = ReactTestHelper.createCatalystContextForTest()

    mockScrollView = mock<MockScrollView>()

    `when`(mockScrollView.context).thenReturn(mockContext)
    `when`(mockScrollView.id).thenReturn(42)
    `when`(mockScrollView.scrollX).thenReturn(0)
    `when`(mockScrollView.scrollY).thenReturn(0)
    `when`(mockScrollView.width).thenReturn(500)
    `when`(mockScrollView.height).thenReturn(800)
    `when`(mockScrollView.paddingStart).thenReturn(0)
    `when`(mockScrollView.paddingEnd).thenReturn(0)
    `when`(mockScrollView.paddingTop).thenReturn(0)
    `when`(mockScrollView.paddingBottom).thenReturn(0)
    `when`(mockScrollView.scrollEventThrottle).thenReturn(0)
    `when`(mockScrollView.lastScrollDispatchTime).thenReturn(0L)
    `when`(mockScrollView.stateWrapper).thenReturn(null)
    `when`(mockScrollView.reactScrollViewScrollState)
        .thenReturn(ReactScrollViewHelper.ReactScrollViewScrollState())
    `when`(mockScrollView.getChildAt(0)).thenReturn(mockChild)
    `when`(mockChild.width).thenReturn(1000)
    `when`(mockChild.height).thenReturn(2000)
    `when`(mockScrollView.getFlingAnimator()).thenReturn(mockAnimator)

    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<ReactContext> { UIManagerHelper.getReactContext(any()) }
        .thenReturn(mockContext)
    uiManagerHelperMock.`when`<Int> { UIManagerHelper.getSurfaceId(any<Context>()) }.thenReturn(1)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(any()) }
        .thenReturn(mockEventDispatcher)

    ReactScrollViewHelper.addScrollListener(scrollListener)
  }

  @After
  fun tearDown() {
    ReactScrollViewHelper.removeScrollListener(scrollListener)
    uiManagerHelperMock.close()
  }

  @Test
  fun registerFlingAnimator_emitsScrollEventOnAnimationEnd() {
    ReactScrollViewHelper.registerFlingAnimator(mockScrollView)

    mockAnimator.setIntValues(0, 100)
    mockAnimator.start()
    mockAnimator.end()

    val captor = argumentCaptor<Event<*>>()
    verify(mockEventDispatcher, org.mockito.kotlin.atLeast(1)).dispatchEvent(captor.capture())

    val scrollEvents = captor.allValues.filterIsInstance<ScrollEvent>()
    assert(scrollEvents.isNotEmpty())
    assert(scrollEvents.all { it.eventName == "topScroll" })
  }

  @Test
  fun registerFlingAnimator_emitsScrollEventOnAnimationCancel() {
    ReactScrollViewHelper.registerFlingAnimator(mockScrollView)

    mockAnimator.setIntValues(0, 100)
    mockAnimator.start()
    mockAnimator.cancel()

    val captor = argumentCaptor<Event<*>>()
    verify(mockEventDispatcher, org.mockito.kotlin.atLeast(1)).dispatchEvent(captor.capture())

    val scrollEvents = captor.allValues.filterIsInstance<ScrollEvent>()
    assert(scrollEvents.isNotEmpty())
    assert(scrollEvents.all { it.eventName == "topScroll" })
  }

  @Test
  fun registerFlingAnimator_onAnimationEnd_notifiesScrollListener() {
    ReactScrollViewHelper.registerFlingAnimator(mockScrollView)

    mockAnimator.setIntValues(0, 100)
    mockAnimator.start()
    mockAnimator.end()

    assert(scrollListener.scrollEventType == ScrollEventType.SCROLL)
    assert(scrollListener.xVelocity == 0f)
    assert(scrollListener.yVelocity == 0f)
  }

  @Test
  fun registerFlingAnimator_onAnimationCancel_notifiesScrollListener() {
    ReactScrollViewHelper.registerFlingAnimator(mockScrollView)

    mockAnimator.setIntValues(0, 100)
    mockAnimator.start()
    mockAnimator.cancel()

    assert(scrollListener.scrollEventType == ScrollEventType.SCROLL)
    assert(scrollListener.xVelocity == 0f)
    assert(scrollListener.yVelocity == 0f)
  }

  private class TestScrollListener : ReactScrollViewHelper.ScrollListener {
    var scrollEventType: ScrollEventType? = null
    var xVelocity: Float = 0f
    var yVelocity: Float = 0f

    override fun onScroll(
        scrollView: ViewGroup?,
        scrollEventType: ScrollEventType?,
        xVelocity: Float,
        yVelocity: Float,
    ) {
      this.scrollEventType = scrollEventType
      this.xVelocity = xVelocity
      this.yVelocity = yVelocity
    }

    override fun onLayout(scrollView: ViewGroup?) {
      // no-op
    }
  }

  private class MockScrollView :
      ViewGroup(RuntimeEnvironment.getApplication()),
      HasFlingAnimator,
      HasScrollEventThrottle,
      HasScrollState,
      HasStateWrapper {

    override var reactScrollViewScrollState = ReactScrollViewHelper.ReactScrollViewScrollState()
    override var scrollEventThrottle: Int = 0
    override var lastScrollDispatchTime: Long = 0
    override var stateWrapper: StateWrapper? = null
    private val _animator: ValueAnimator = ValueAnimator()

    override fun startFlingAnimator(start: Int, end: Int) {
      _animator.setIntValues(start, end)
      _animator.start()
    }

    override fun getFlingAnimator(): ValueAnimator = _animator

    override fun getFlingExtrapolatedDistance(velocity: Int): Int = 0

    init {
      super.setLayoutParams(
          ViewGroup.LayoutParams(
              ViewGroup.LayoutParams.MATCH_PARENT,
              ViewGroup.LayoutParams.MATCH_PARENT,
          ),
      )
    }

    override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
      // no-op
    }
  }
}
