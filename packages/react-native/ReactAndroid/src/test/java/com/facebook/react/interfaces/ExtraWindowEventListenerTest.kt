/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.interfaces

import android.view.Window
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class ExtraWindowEventListenerTest {
  private lateinit var reactContext: ReactApplicationContext
  private lateinit var window: Window

  @Before
  fun setUp() {
    reactContext = ReactTestHelper.createCatalystContextForTest()
    window = mock()
  }

  @Test
  fun testOnExtraWindowCreateNotifiesListener() {
    val listener: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener)
    reactContext.onExtraWindowCreate(window)

    verify(listener, times(1)).onExtraWindowCreate(window)
  }

  @Test
  fun testOnExtraWindowDestroyNotifiesListener() {
    val listener: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener)
    reactContext.onExtraWindowDestroy(window)

    verify(listener, times(1)).onExtraWindowDestroy(window)
  }

  @Test
  fun testMultipleListenersAreNotified() {
    val listener1: ExtraWindowEventListener = mock()
    val listener2: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener1)
    reactContext.addExtraWindowEventListener(listener2)
    reactContext.onExtraWindowCreate(window)

    verify(listener1, times(1)).onExtraWindowCreate(window)
    verify(listener2, times(1)).onExtraWindowCreate(window)
  }

  @Test
  fun testRemovedListenerIsNotNotified() {
    val listener: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener)
    reactContext.removeExtraWindowEventListener(listener)
    reactContext.onExtraWindowCreate(window)

    verify(listener, never()).onExtraWindowCreate(window)
  }

  @Test
  fun testOnlyRemovedListenerStopsReceivingEvents() {
    val listener1: ExtraWindowEventListener = mock()
    val listener2: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener1)
    reactContext.addExtraWindowEventListener(listener2)
    reactContext.removeExtraWindowEventListener(listener1)
    reactContext.onExtraWindowDestroy(window)

    verify(listener1, never()).onExtraWindowDestroy(window)
    verify(listener2, times(1)).onExtraWindowDestroy(window)
  }

  @Test
  fun testListenerReceivesBothCreateAndDestroyEvents() {
    val listener: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener)
    reactContext.onExtraWindowCreate(window)
    reactContext.onExtraWindowDestroy(window)

    verify(listener, times(1)).onExtraWindowCreate(window)
    verify(listener, times(1)).onExtraWindowDestroy(window)
  }

  @Test
  fun testNoListenersDoesNotCrash() {
    // Should not throw when no listeners are registered
    reactContext.onExtraWindowCreate(window)
    reactContext.onExtraWindowDestroy(window)
  }

  @Test
  fun testDuplicateAddIsIdempotent() {
    val listener: ExtraWindowEventListener = mock()

    reactContext.addExtraWindowEventListener(listener)
    reactContext.addExtraWindowEventListener(listener)
    reactContext.onExtraWindowCreate(window)

    // CopyOnWriteArraySet deduplicates, so listener should only be called once
    verify(listener, times(1)).onExtraWindowCreate(window)
  }
}
