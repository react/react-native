/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.Window
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.interfaces.ExtraWindowEventListener
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ThemedReactContextTest {
  private lateinit var reactApplicationContext: ReactApplicationContext
  private lateinit var themedReactContext: ThemedReactContext
  private lateinit var window: Window

  @Before
  fun setUp() {
    reactApplicationContext = ReactTestHelper.createCatalystContextForTest()
    themedReactContext =
        ThemedReactContext(reactApplicationContext, RuntimeEnvironment.getApplication(), null, -1)
    window = mock()
  }

  @Test
  fun testAddExtraWindowEventListenerDelegatesToReactApplicationContext() {
    val listener: ExtraWindowEventListener = mock()

    themedReactContext.addExtraWindowEventListener(listener)
    // Verify the listener was registered on the underlying context by dispatching an event
    reactApplicationContext.onExtraWindowCreate(window)

    verify(listener, times(1)).onExtraWindowCreate(window)
  }

  @Test
  fun testRemoveExtraWindowEventListenerDelegatesToReactApplicationContext() {
    val listener: ExtraWindowEventListener = mock()

    themedReactContext.addExtraWindowEventListener(listener)
    themedReactContext.removeExtraWindowEventListener(listener)
    // After removal via ThemedReactContext, the listener should not be notified
    reactApplicationContext.onExtraWindowCreate(window)

    verify(listener, times(0)).onExtraWindowCreate(window)
  }

  @Test
  fun testOnExtraWindowCreateDelegatesToReactApplicationContext() {
    val listener: ExtraWindowEventListener = mock()

    reactApplicationContext.addExtraWindowEventListener(listener)
    // Dispatching via ThemedReactContext should reach listeners on the underlying context
    themedReactContext.onExtraWindowCreate(window)

    verify(listener, times(1)).onExtraWindowCreate(window)
  }

  @Test
  fun testOnExtraWindowDestroyDelegatesToReactApplicationContext() {
    val listener: ExtraWindowEventListener = mock()

    reactApplicationContext.addExtraWindowEventListener(listener)
    // Dispatching via ThemedReactContext should reach listeners on the underlying context
    themedReactContext.onExtraWindowDestroy(window)

    verify(listener, times(1)).onExtraWindowDestroy(window)
  }
}
