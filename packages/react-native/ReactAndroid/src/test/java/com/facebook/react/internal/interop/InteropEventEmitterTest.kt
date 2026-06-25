/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION") // We want to use RCTEventEmitter for interop purposes

package com.facebook.react.internal.interop

import com.facebook.react.bridge.BridgeReactContext
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactContext
import com.facebook.testutils.fakes.FakeEventDispatcher
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.RuntimeEnvironment

@RunWith(RobolectricTestRunner::class)
class InteropEventEmitterTest {
  lateinit var reactContext: ReactContext
  private lateinit var eventDispatcher: FakeEventDispatcher

  @Before
  fun setup() {
    reactContext = BridgeReactContext(RuntimeEnvironment.getApplication())
    eventDispatcher = FakeEventDispatcher()
  }

  @Test
  fun receiveEvent_dispatchesCorrectly() {
    val eventEmitter = InteropEventEmitter(reactContext)
    eventEmitter.overrideEventDispatcher(eventDispatcher)

    eventEmitter.receiveEvent(42, "onTest", null)

    assertThat(eventDispatcher.getRecordedDispatchedEvents()).hasSize(1)
    assertThat(eventDispatcher.getRecordedDispatchedEvents().get(0).getEventName())
        .isEqualTo("onTest")
    assertThat(eventDispatcher.getRecordedDispatchedEvents().get(0))
        .isInstanceOf(InteropEvent::class.java)
  }

  @Test
  fun receiveEvent_dataIsPreserved() {
    val eventEmitter = InteropEventEmitter(reactContext)
    eventEmitter.overrideEventDispatcher(eventDispatcher)
    val eventData = JavaOnlyMap.of("color", "indigo")

    eventEmitter.receiveEvent(42, "onTest", eventData)

    val event = eventDispatcher.getRecordedDispatchedEvents()[0] as InteropEvent
    val dispatchedEventData = event.eventData
    assertThat(dispatchedEventData).isNotNull()
    assertThat(dispatchedEventData!!.getString("color")).isEqualTo("indigo")
  }
}
