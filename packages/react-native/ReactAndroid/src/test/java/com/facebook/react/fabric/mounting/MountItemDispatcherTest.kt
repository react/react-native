/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import com.facebook.react.fabric.mounting.MountItemDispatcher.ItemDispatchListener
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.internal.tracing.PerformanceTracer
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.Implementation
import org.robolectric.annotation.Implements

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class, MountItemDispatcherTest.ShadowPerformanceTracer::class])
class MountItemDispatcherTest {

  private lateinit var dispatcher: MountItemDispatcher
  private lateinit var dispatchListener: RecordingItemDispatchListener

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val mountingManager =
        MountingManager(ViewManagerRegistry(emptyList()), MountingManager.MountItemExecutor {})
    dispatchListener = RecordingItemDispatchListener()
    dispatcher = MountItemDispatcher(mountingManager, dispatchListener)
  }

  @Test
  fun tryDispatchMountItems_executesQueuedMountItem() {
    val item = RecordingMountItem()

    dispatcher.addMountItem(item)
    dispatcher.tryDispatchMountItems()

    assertThat(item.executed).isTrue()
    assertThat(dispatchListener.didDispatchCount).isEqualTo(1)
  }

  /**
   * Regression test for synchronous (`unstable_Immediate`) state updates on Android. When a mount
   * item's execution synchronously updates shadow node state, it can enqueue new mount items and
   * re-enter [MountItemDispatcher.tryDispatchMountItems] while a dispatch is already in progress.
   *
   * The re-entrant call must not drop those items: they should be flushed in the same dispatch pass,
   * rather than being deferred to the next frame.
   */
  @Test
  fun tryDispatchMountItems_reentrantDispatch_executesFollowUpItemInSamePass() {
    val followUpItem = RecordingMountItem()
    // Simulates a synchronous state update triggered while the first item is being mounted: it
    // enqueues another mount item and re-enters the dispatcher.
    val initialItem =
        RecordingMountItem(
            onExecute = {
              dispatcher.addMountItem(followUpItem)
              dispatcher.tryDispatchMountItems()
            })

    dispatcher.addMountItem(initialItem)
    dispatcher.tryDispatchMountItems()

    assertThat(initialItem.executed).isTrue()
    assertThat(followUpItem.executed).isTrue()
  }

  @Test
  fun tryDispatchMountItems_reentrantDispatch_preservesExecutionOrder() {
    val executionOrder = mutableListOf<String>()
    val followUpItem = RecordingMountItem(onExecute = { executionOrder.add("followUp") })
    val initialItem =
        RecordingMountItem(
            onExecute = {
              executionOrder.add("initial")
              dispatcher.addMountItem(followUpItem)
              dispatcher.tryDispatchMountItems()
            })

    dispatcher.addMountItem(initialItem)
    dispatcher.tryDispatchMountItems()

    assertThat(executionOrder).containsExactly("initial", "followUp")
  }

  @Test
  fun tryDispatchMountItems_reentrantDispatch_invokesDidDispatchOnceForOuterCall() {
    val initialItem =
        RecordingMountItem(
            onExecute = {
              dispatcher.addMountItem(RecordingMountItem())
              dispatcher.tryDispatchMountItems()
            })

    dispatcher.addMountItem(initialItem)
    dispatcher.tryDispatchMountItems()

    // The re-entrant call returns early and must not notify the listener; only the outer call does,
    // once, after the follow-up loop has drained everything.
    assertThat(dispatchListener.didDispatchCount).isEqualTo(1)
  }

  private class RecordingMountItem(
      private val surfaceId: Int = 1,
      private val onExecute: () -> Unit = {},
  ) : MountItem {
    var executed: Boolean = false
      private set

    override fun execute(mountingManager: MountingManager) {
      executed = true
      onExecute()
    }

    override fun getSurfaceId(): Int = surfaceId
  }

  private class RecordingItemDispatchListener : ItemDispatchListener {
    var didDispatchCount: Int = 0
      private set

    override fun willMountItems(mountItems: List<MountItem>?) = Unit

    override fun didMountItems(mountItems: List<MountItem>?) = Unit

    override fun didDispatchMountItems() {
      didDispatchCount++
    }
  }

  // isTracing() is a native method; its JNI library isn't loaded in JVM tests, so return false and
  // let trace() just run its block. ShadowSoLoader covers the SoLoader.loadLibrary init.
  @Implements(PerformanceTracer::class)
  class ShadowPerformanceTracer {
    companion object {
      @JvmStatic @Implementation fun isTracing(): Boolean = false
    }
  }
}
