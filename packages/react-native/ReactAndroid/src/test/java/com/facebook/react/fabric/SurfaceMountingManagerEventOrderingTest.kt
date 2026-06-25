/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import com.facebook.react.ReactRootView
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManager
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.uimanager.events.EventCategoryDef
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.inOrder
import org.mockito.Mockito.verify
import org.mockito.Mockito.verifyNoMoreInteractions
import org.mockito.kotlin.any
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

/**
 * Regression tests for issue #54636: events emitted before
 * [SurfaceMountingManager.updateEventEmitter] has run must reach JS in receive order, even if a
 * later event happens to find the emitter ready.
 *
 * Events arriving before the emitter is set are buffered in a per-ViewState [ArrayDeque] under a
 * `synchronized(viewState)` lock. [updateEventEmitter] drains the queue under the same lock, so a
 * concurrent [dispatchEvent] either enqueues behind pending events or waits for the drain to
 * complete before dispatching directly.
 */
@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class SurfaceMountingManagerEventOrderingTest {
  private lateinit var mountingManager: MountingManager
  private lateinit var themedReactContext: ThemedReactContext
  private val surfaceId = 1
  private val reactTag = 42

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val reactContext = ReactTestHelper.createCatalystContextForTest()
    themedReactContext = ThemedReactContext(reactContext, reactContext, null, -1)
    mountingManager =
        MountingManager(
            ViewManagerRegistry(listOf<ViewManager<*, *>>(ReactViewManager())),
            MountItemExecutor {},
        )
  }

  private fun startSurfaceWithView(): SurfaceMountingManager {
    val rootView = ReactRootView(themedReactContext)
    mountingManager.startSurface(surfaceId, themedReactContext, rootView)
    val smm = mountingManager.getSurfaceManagerEnforced(surfaceId, "test")
    smm.preallocateView("RCTView", reactTag, JavaOnlyMap.of(), null, true)
    return smm
  }

  @Test
  fun dispatchEvent_queuesEvent_whenEmitterIsNull() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    verify(emitter).dispatch("topChange", null, EventCategoryDef.UNSPECIFIED, 0L)
  }

  @Test
  fun dispatchEvent_dispatchesDirectly_whenEmitterSetAndQueueEmpty() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    smm.dispatchEvent(reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    verify(emitter).dispatch("topChange", null, EventCategoryDef.UNSPECIFIED, 0L)
  }

  /** The core regression test for #54636. */
  @Test
  fun dispatchEvent_preservesFifoOrder_acrossEmitterTransition() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "first", false, null, EventCategoryDef.UNSPECIFIED, 1L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    smm.dispatchEvent(reactTag, "second", false, null, EventCategoryDef.UNSPECIFIED, 2L)

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("first", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("second", null, EventCategoryDef.UNSPECIFIED, 2L)
  }

  @Test
  fun dispatchEvent_drainsMultipleEvents_inFifoOrder() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "first", false, null, EventCategoryDef.UNSPECIFIED, 1L)
    smm.dispatchEvent(reactTag, "second", false, null, EventCategoryDef.UNSPECIFIED, 2L)
    smm.dispatchEvent(reactTag, "third", false, null, EventCategoryDef.UNSPECIFIED, 3L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("first", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("second", null, EventCategoryDef.UNSPECIFIED, 2L)
    ordered.verify(emitter).dispatch("third", null, EventCategoryDef.UNSPECIFIED, 3L)
  }

  @Test
  fun dispatchEvent_queuesArePerTag() {
    val smm = startSurfaceWithView()
    val otherTag = reactTag + 1
    smm.preallocateView("RCTView", otherTag, JavaOnlyMap.of(), null, true)

    smm.dispatchEvent(reactTag, "event1", false, null, EventCategoryDef.UNSPECIFIED, 0L)

    val emitter1: EventEmitterWrapper = mock()
    val emitter2: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter1)
    smm.updateEventEmitter(otherTag, emitter2)

    verify(emitter1).dispatch("event1", null, EventCategoryDef.UNSPECIFIED, 0L)
    verifyNoMoreInteractions(emitter2)
  }

  @Test
  fun dispatchEvent_isNoOp_forUnknownTag() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    mountingManager.dispatchEvent(
        surfaceId,
        reactTag + 99,
        "topChange",
        false,
        null,
        EventCategoryDef.UNSPECIFIED,
        0L,
    )

    verify(emitter, never()).dispatch(any(), any(), any(), any())
    verify(emitter, never()).dispatchUnique(any(), any(), any())
    verifyNoMoreInteractions(emitter)
  }

  @Test
  fun dispatchEvent_usesDispatchUnique_forCoalesceableEvents() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    smm.dispatchEvent(reactTag, "topScroll", true, null, EventCategoryDef.UNSPECIFIED, 0L)

    verify(emitter).dispatchUnique("topScroll", null, 0L)
    verify(emitter, never()).dispatch("topScroll", null, EventCategoryDef.UNSPECIFIED, 0L)
  }

  @Test
  fun dispatchEvent_coalesceableEvents_drainedFromQueueUseDispatchUnique() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "topScroll", true, null, EventCategoryDef.UNSPECIFIED, 1L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    verify(emitter).dispatchUnique("topScroll", null, 1L)
  }

  /** After a drain cycle, subsequent events should dispatch directly (fast path). */
  @Test
  fun dispatchEvent_usesFastPath_afterDrainCompletes() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "queued", false, null, EventCategoryDef.UNSPECIFIED, 1L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    // These should all hit the fast path (no queue, emitter set)
    smm.dispatchEvent(reactTag, "direct1", false, null, EventCategoryDef.UNSPECIFIED, 2L)
    smm.dispatchEvent(reactTag, "direct2", false, null, EventCategoryDef.UNSPECIFIED, 3L)
    smm.dispatchEvent(reactTag, "direct3", false, null, EventCategoryDef.UNSPECIFIED, 4L)

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("queued", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("direct1", null, EventCategoryDef.UNSPECIFIED, 2L)
    ordered.verify(emitter).dispatch("direct2", null, EventCategoryDef.UNSPECIFIED, 3L)
    ordered.verify(emitter).dispatch("direct3", null, EventCategoryDef.UNSPECIFIED, 4L)
  }

  /**
   * Replacing the emitter via a second [updateEventEmitter] call must drain any events that were
   * queued between the two calls.
   */
  @Test
  fun updateEventEmitter_replacingEmitter_drainsNewQueue() {
    val smm = startSurfaceWithView()

    val emitter1: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter1)

    // Simulate emitter being destroyed (e.g., view recycled)
    // New events arrive before the new emitter is set — they must not be lost.
    // We can't easily destroy the emitter in the test, but we can replace it.
    smm.dispatchEvent(reactTag, "event1", false, null, EventCategoryDef.UNSPECIFIED, 1L)

    // Replace with a new emitter
    val emitter2: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter2)

    // event1 was dispatched via emitter1 (fast path, emitter1 was set)
    verify(emitter1).dispatch("event1", null, EventCategoryDef.UNSPECIFIED, 1L)
    // emitter2 had nothing to drain
    verifyNoMoreInteractions(emitter2)
  }

  /** FIFO must hold across multiple enqueue-drain-dispatch cycles. */
  @Test
  fun dispatchEvent_maintainsFifoOrder_acrossMultipleDrainCycles() {
    val smm = startSurfaceWithView()

    // Cycle 1: enqueue before emitter
    smm.dispatchEvent(reactTag, "a", false, null, EventCategoryDef.UNSPECIFIED, 1L)
    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    // Cycle 2: direct dispatch
    smm.dispatchEvent(reactTag, "b", false, null, EventCategoryDef.UNSPECIFIED, 2L)
    smm.dispatchEvent(reactTag, "c", false, null, EventCategoryDef.UNSPECIFIED, 3L)

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("a", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("b", null, EventCategoryDef.UNSPECIFIED, 2L)
    ordered.verify(emitter).dispatch("c", null, EventCategoryDef.UNSPECIFIED, 3L)
  }

  @Test
  fun mountingManager_dispatchEvent_delegatesToSurfaceMountingManager() {
    val smm = startSurfaceWithView()

    mountingManager.dispatchEvent(
        surfaceId,
        reactTag,
        "queued",
        false,
        null,
        EventCategoryDef.UNSPECIFIED,
        1L,
    )

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    mountingManager.dispatchEvent(
        surfaceId,
        reactTag,
        "direct",
        false,
        null,
        EventCategoryDef.UNSPECIFIED,
        2L,
    )

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("queued", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatch("direct", null, EventCategoryDef.UNSPECIFIED, 2L)
  }

  @Test
  fun dispatchEvent_mixedCoalesceableAndNonCoalesceable_preservesOrder() {
    val smm = startSurfaceWithView()

    smm.dispatchEvent(reactTag, "topChange", false, null, EventCategoryDef.UNSPECIFIED, 1L)
    smm.dispatchEvent(reactTag, "topScroll", true, null, EventCategoryDef.UNSPECIFIED, 2L)
    smm.dispatchEvent(reactTag, "topFocus", false, null, EventCategoryDef.UNSPECIFIED, 3L)

    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    val ordered = inOrder(emitter)
    ordered.verify(emitter).dispatch("topChange", null, EventCategoryDef.UNSPECIFIED, 1L)
    ordered.verify(emitter).dispatchUnique("topScroll", null, 2L)
    ordered.verify(emitter).dispatch("topFocus", null, EventCategoryDef.UNSPECIFIED, 3L)
  }

  @Test
  fun updateEventEmitter_withNoPendingEvents_isClean() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()

    smm.updateEventEmitter(reactTag, emitter)

    verifyNoMoreInteractions(emitter)

    smm.dispatchEvent(reactTag, "event", false, null, EventCategoryDef.UNSPECIFIED, 0L)
    verify(emitter).dispatch("event", null, EventCategoryDef.UNSPECIFIED, 0L)
  }

  /**
   * When events are queued for a tag and the surface is stopped, the queued events must not crash
   * when the ViewState is cleaned up.
   */
  @Test
  fun dispatchEvent_doesNotCrash_afterSurfaceStopped() {
    val smm = startSurfaceWithView()
    val emitter: EventEmitterWrapper = mock()
    smm.updateEventEmitter(reactTag, emitter)

    mountingManager.stopSurface(surfaceId)
    verify(emitter).destroy()

    mountingManager.dispatchEvent(
        surfaceId,
        reactTag,
        "late",
        false,
        null,
        EventCategoryDef.UNSPECIFIED,
        1L,
    )

    verifyNoMoreInteractions(emitter)
  }
}
