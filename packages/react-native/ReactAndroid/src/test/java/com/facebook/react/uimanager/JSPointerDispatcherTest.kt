/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.content.Context
import android.graphics.Rect
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.widget.LinearLayout
import android.widget.TextView
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.events.Event
import com.facebook.react.uimanager.events.EventDispatcher
import com.facebook.react.uimanager.events.PointerEventHelper
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.ArgumentMatcher
import org.mockito.kotlin.argThat
import org.mockito.kotlin.mock
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class JSPointerDispatcherTest {

  private lateinit var root: ViewGroup
  private lateinit var pointerDispatcher: JSPointerDispatcher

  class EventWithName(private val eventName: String) : ArgumentMatcher<Event<*>> {
    override fun matches(argument: Event<*>?): Boolean = argument?.getEventName() == eventName

    override fun toString(): String = "[event with name: $eventName]"
  }

  @Before
  fun setupViewHierarchy() {
    ReactNativeFeatureFlagsForTests.setUp()
    val ctx: Context = RuntimeEnvironment.getApplication()
    root = LinearLayout(ctx)
    val childView = TextView(ctx)
    childView.append("Hello, world!")
    childView.id = 100
    root.addView(childView)
    root.measure(500, 500)
    root.layout(0, 0, 500, 500)
    pointerDispatcher = JSPointerDispatcher(root)
  }

  private fun createMotionEvent(action: Int, x: Float, y: Float): MotionEvent {
    val downTime = SystemClock.uptimeMillis()
    val eventTime = downTime
    val metaState = 0 // no modifiers pressed

    return MotionEvent.obtain(downTime, eventTime, action, x, y, metaState)
  }

  private fun getChildViewRectInRootCoordinates(childIndex: Int): Rect {
    val child: View = root.getChildAt(childIndex)
    val outRect = Rect()
    child.getDrawingRect(outRect)
    root.offsetDescendantRectToMyCoords(child, outRect)
    return outRect
  }

  @Test
  fun testPointerEnter() {
    val childRect = getChildViewRectInRootCoordinates(0)
    val ev =
        createMotionEvent(
            MotionEvent.ACTION_DOWN,
            childRect.centerX().toFloat(),
            childRect.centerY().toFloat(),
        )
    val mockDispatcher: EventDispatcher = mock()
    pointerDispatcher.handleMotionEvent(ev, mockDispatcher, false)
    verify(mockDispatcher).dispatchEvent(argThat(EventWithName(PointerEventHelper.POINTER_DOWN)))
  }
}
