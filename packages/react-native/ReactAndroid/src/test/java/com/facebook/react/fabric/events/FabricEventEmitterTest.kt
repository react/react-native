/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.events

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.WritableMap
import com.facebook.react.fabric.FabricUIManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.BatchEventDispatchedListener
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class FabricEventEmitterTest {
  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun receiveEvent_forwardsCustomCoalesceKey() {
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    val uiManager = RecordingFabricUIManager(reactContext)
    val eventEmitter = FabricEventEmitter(uiManager)

    eventEmitter.receiveEvent(
        surfaceId = 1,
        targetTag = 2,
        eventName = "topChange",
        canCoalesceEvent = true,
        customCoalesceKey = 37,
        params = null,
        category = EventCategoryDef.UNSPECIFIED,
        eventTimestamp = 123L,
    )

    assertThat(uiManager.receivedEvent)
        .isEqualTo(
            ReceivedEvent(
                surfaceId = 1,
                reactTag = 2,
                eventName = "topChange",
                canCoalesceEvent = true,
                eventCategory = EventCategoryDef.UNSPECIFIED,
                experimentalIsSynchronous = false,
                eventTimestamp = 123L,
                customCoalesceKey = 37,
            ))
  }

  private class RecordingFabricUIManager(reactContext: ReactApplicationContext) :
      FabricUIManager(
          reactContext,
          ViewManagerRegistry(emptyList<ViewManager<*, *>>()),
          BatchEventDispatchedListener {},
      ) {
    var receivedEvent: ReceivedEvent? = null

    override fun receiveEvent(
        surfaceId: Int,
        reactTag: Int,
        eventName: String,
        canCoalesceEvent: Boolean,
        params: WritableMap?,
        eventCategory: Int,
        experimentalIsSynchronous: Boolean,
        eventTimestamp: Long,
        customCoalesceKey: Int,
    ) {
      receivedEvent =
          ReceivedEvent(
              surfaceId,
              reactTag,
              eventName,
              canCoalesceEvent,
              eventCategory,
              experimentalIsSynchronous,
              eventTimestamp,
              customCoalesceKey,
          )
    }
  }

  private data class ReceivedEvent(
      val surfaceId: Int,
      val reactTag: Int,
      val eventName: String,
      val canCoalesceEvent: Boolean,
      val eventCategory: Int,
      val experimentalIsSynchronous: Boolean,
      val eventTimestamp: Long,
      val customCoalesceKey: Int,
  )
}
