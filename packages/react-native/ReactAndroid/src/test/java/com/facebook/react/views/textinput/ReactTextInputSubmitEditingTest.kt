/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.views.textinput

import android.util.DisplayMetrics
import android.view.KeyEvent
import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.ReactTestHelper.createMockCatalystInstance
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.UIManagerHelper
import com.facebook.react.uimanager.events.EventDispatcher
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class ReactTextInputSubmitEditingTest {

  private lateinit var themedContext: ThemedReactContext
  private lateinit var eventDispatcher: EventDispatcher
  private lateinit var uiManagerHelperMock: MockedStatic<UIManagerHelper>

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    val context = BridgeReactContext(RuntimeEnvironment.getApplication())
    context.initializeWithInstance(createMockCatalystInstance())
    themedContext = ThemedReactContext(context, context, null, -1)
    DisplayMetricsHolder.setScreenDisplayMetrics(DisplayMetrics())
    eventDispatcher = mock()
    uiManagerHelperMock = mockStatic(UIManagerHelper::class.java)
    uiManagerHelperMock
        .`when`<EventDispatcher?> { UIManagerHelper.getEventDispatcher(any()) }
        .thenReturn(eventDispatcher)
    uiManagerHelperMock
        .`when`<ReactContext> { UIManagerHelper.getReactContext(any()) }
        .thenReturn(context)
  }

  @After
  fun teardown() {
    uiManagerHelperMock.close()
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun testHardwareEnterSubmitsMultilineOnce() {
    val view =
        ReactTextInputManager()
            .createView(
                1,
                themedContext,
                ReactStylesDiffMap(JavaOnlyMap.of("multiline", true, "submitBehavior", "submit")),
                null,
                mock(),
            )

    view.onKeyDown(KeyEvent.KEYCODE_ENTER, KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ENTER))
    view.onKeyUp(KeyEvent.KEYCODE_ENTER, KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ENTER))

    verify(eventDispatcher, times(1)).dispatchEvent(any<ReactTextInputSubmitEditingEvent>())
  }
}
