/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import android.app.Activity
import android.os.Looper
import android.view.View
import android.view.ViewGroup
import android.view.animation.AlphaAnimation
import android.widget.FrameLayout
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.fabric.events.EventEmitterWrapper
import com.facebook.react.fabric.mounting.DeferredViewCleanupQueue
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.MountingManager.MountItemExecutor
import com.facebook.react.fabric.mounting.SurfaceMountingManager
import com.facebook.react.fabric.mounting.mountitems.IntBufferBatchMountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.StateWrapper
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.react.views.view.ReactViewGroup
import com.facebook.react.views.view.ReactViewManager
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowSoLoader
import java.time.Duration
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mockito.mockingDetails
import org.mockito.kotlin.any
import org.mockito.kotlin.argumentCaptor
import org.mockito.kotlin.inOrder
import org.mockito.kotlin.mock
import org.mockito.kotlin.never
import org.mockito.kotlin.spy
import org.mockito.kotlin.times
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever
import org.robolectric.Robolectric
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(shadows = [ShadowSoLoader::class, ShadowNativeLoader::class])
class DeferredViewCleanupTest {
  private lateinit var root: FrameLayout
  private lateinit var surface: SurfaceMountingManager
  private lateinit var manager: MountingManager
  private lateinit var context: ThemedReactContext
  private lateinit var viewManager: ReactViewManager

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    configure(true)
    val activity = Robolectric.buildActivity(Activity::class.java).setup().get()
    root = FrameLayout(activity)
    activity.setContentView(root)
    val reactContext = ReactTestHelper.createTestReactApplicationContext(activity.application)
    context = ThemedReactContext(reactContext, activity, null, 1)
    com.facebook.react.uimanager.DisplayMetricsHolder.initDisplayMetrics(context)
    viewManager = ReactViewManager()
    manager = MountingManager(ViewManagerRegistry(listOf(viewManager)), MountItemExecutor {})
    surface = manager.startSurface(1, context, root)
  }

  private fun configure(
      enabled: Boolean,
      disableReordering: Boolean = false,
      recycling: Boolean = false,
  ) {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableDeferredViewCleanupAndroid() = enabled

          override fun disableMountItemReorderingAndroid() = disableReordering

          override fun enableViewRecycling() = recycling

          override fun enableViewRecyclingForView() = recycling
        }
    )
  }

  @After
  fun tearDown() {
    surface.stopSurface()
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun mount(
      tag: Int,
      parent: Int,
      index: Int = 0,
      state: StateWrapper? = null,
  ): ReactViewGroup {
    surface.preallocateView("RCTView", tag, JavaOnlyMap.of(), state, true)
    surface.addViewAt(parent, tag, index)
    return surface.getView(tag) as ReactViewGroup
  }

  private fun unmount() {
    IntBufferBatchMountItem(1, intArrayOf(17, 2, 4, 2, 0, 2, 1, 0, 5, 2, 4, 2), emptyArray(), 0)
        .execute(manager)
  }

  private fun drawAndDrain() {
    // Explicit traversal simulation; the device probe separately checks actual Android drawing.
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
  }

  @Test
  fun retiresTagsAndWrappersImmediately_butKeepsDescendantsUntilAfterDraw() {
    val panel = mount(2, 1)
    val state: StateWrapper = mock()
    val child = mount(4, 2, state = state)
    val emitter: EventEmitterWrapper = mock()
    surface.updateEventEmitter(4, emitter)
    unmount()
    assertThat(root.childCount).isZero()
    assertThat(child.parent).isSameAs(panel)
    assertThat(surface.getViewExists(2)).isFalse()
    assertThat(surface.getViewExists(4)).isFalse()
    verify(state).destroyState()
    verify(emitter).destroy()
    drawAndDrain()
    assertThat(child.parent).isNull()
    surface.stopSurface()
    verify(state, times(1)).destroyState()
    verify(emitter, times(1)).destroy()
  }

  @Test
  fun recreatedTagsAreNotTouchedByOldCleanup() {
    val oldPanel = mount(2, 1)
    val oldChild = mount(4, 2)
    unmount()
    val panel = mount(2, 1)
    val child = mount(4, 2)
    assertThat(panel).isNotSameAs(oldPanel)
    assertThat(child).isNotSameAs(oldChild)
    drawAndDrain()
    assertThat(child.parent).isSameAs(panel)
    assertThat(panel.parent).isSameAs(root)
    assertThat(oldChild.parent).isNull()
  }

  @Test
  fun stoppingSurfaceDrainsRetiredViewsWithoutWaitingForDraw() {
    mount(2, 1)
    val child = mount(4, 2)
    unmount()
    surface.stopSurface()
    assertThat(child.parent).isNull()
    drawAndDrain()
    assertThat(child.parent).isNull()
  }

  @Test
  fun stoppingSurfaceEvictsPoolBeforeDroppingPendingViews() {
    startRecyclingSurface()
    val panel = mount(2, 1)
    val child = mount(4, 2)
    unmount()
    assertThat(child.parent).isSameAs(panel)
    verify(viewManager, never()).onDropViewInstance(any())

    surface.stopSurface()

    val ordered = inOrder(viewManager)
    ordered.verify(viewManager).onSurfaceStopped(1)
    ordered.verify(viewManager).onDropViewInstance(child)
    ordered.verify(viewManager).onDropViewInstance(panel)
    assertThat(
            mockingDetails(viewManager).invocations.none {
              it.method.name == "prepareToRecycleView"
            }
        )
        .isTrue()
    assertThat(child.parent).isNull()
    drawAndDrain()
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(300))
    verify(viewManager, times(1)).onDropViewInstance(child)
    verify(viewManager, times(1)).onDropViewInstance(panel)

    surface = manager.startSurface(1, context, root)
    val replacement = mount(2, 1)
    assertThat(replacement).isNotSameAs(panel).isNotSameAs(child)
  }

  @Test
  fun stoppingSurfaceDuringCleanupEvictsPoolBeforeRemainingDrops() {
    startRecyclingSurface()
    val panel = mount(2, 1)
    val child = mount(4, 2)
    unmount()
    panel.setOnHierarchyChangeListener(
        object : ViewGroup.OnHierarchyChangeListener {
          override fun onChildViewAdded(parent: View, child: View) = Unit

          override fun onChildViewRemoved(parent: View, child: View) {
            surface.stopSurface()
          }
        }
    )
    drawAndDrain()
    assertThat(surface.isStopped).isTrue()
    assertThat(child.parent).isNull()
    val ordered = inOrder(viewManager)
    ordered.verify(viewManager).onSurfaceStopped(1)
    ordered.verify(viewManager).onDropViewInstance(child)
    ordered.verify(viewManager).onDropViewInstance(panel)
    assertThat(
            mockingDetails(viewManager).invocations.none {
              it.method.name == "prepareToRecycleView"
            }
        )
        .isTrue()
    drawAndDrain()
    verify(viewManager, times(1)).onDropViewInstance(child)
    verify(viewManager, times(1)).onDropViewInstance(panel)
  }

  private fun startRecyclingSurface() {
    surface.stopSurface()
    configure(true, recycling = true)
    // mockito-inline preserves the exact core manager class required by validation.
    viewManager = spy(ReactViewManager())
    assertThat(viewManager.javaClass).isEqualTo(ReactViewManager::class.java)
    manager = MountingManager(ViewManagerRegistry(listOf(viewManager)), MountItemExecutor {})
    surface = manager.startSurface(1, context, root)
  }

  @Test
  fun activeTouchFallsBackToExistingDelayedEmitterDestruction() {
    mount(2, 1)
    val child = mount(4, 2)
    val emitter: EventEmitterWrapper = mock()
    surface.updateEventEmitter(4, emitter)
    surface.markActiveTouchForTag(4)
    unmount()
    assertThat(child.parent).isNull()
    assertThat(surface.getViewExists(4)).isTrue()
    verify(emitter, times(0)).destroy()
    surface.sweepActiveTouchForTag(4)
    verify(emitter).destroy()
  }

  @Test
  fun disabledExperimentKeepsSynchronousRemoval() {
    configure(false)
    mount(2, 1)
    val child = mount(4, 2)
    unmount()
    assertThat(child.parent).isNull()
  }

  @Test
  fun disabledReorderingKeepsSynchronousRemoval() {
    configure(true, disableReordering = true)
    mount(2, 1)
    val child = mount(4, 2)
    unmount()
    assertThat(child.parent).isNull()
  }

  @Test
  fun cleanupAdmissionUsesAnOperationBudget() {
    val queue = DeferredViewCleanupQueue()
    assertThat(queue.hasCapacityFor(DeferredViewCleanupQueue.MAX_PENDING_OPERATIONS)).isTrue()
    queue.enqueue(root, DeferredViewCleanupQueue.MAX_PENDING_OPERATIONS) { true }
    assertThat(queue.hasCapacityFor(1)).isFalse()
    queue.flush()
    assertThat(queue.hasCapacityFor(1)).isTrue()
  }

  @Test
  fun clippedViewsFallBack() {
    val panel = mount(2, 1)
    val child = mount(4, 2)
    panel.removeClippedSubviews = true
    unmount()
    assertThat(panel.allChildrenCount).isZero()
    assertThat(child.parent).isNull()
  }

  @Test
  fun animatedViewsFallBack() {
    mount(2, 1)
    val child = mount(4, 2)
    child.animation = AlphaAnimation(0f, 1f)
    unmount()
    assertThat(child.parent).isNull()
  }

  @Test
  fun incompleteSubtreeIsRejectedBeforeAnyMutation() {
    val panel = mount(2, 1)
    val child = mount(4, 2)
    val survivor = mount(6, 2, 1)
    assertThat(
            surface.tryDeferPureViewUnmount(
                listOf(intArrayOf(4, 2, 0), intArrayOf(2, 1, 0)),
                listOf(4, 2),
            )
        )
        .isFalse()
    assertThat(panel.parent).isSameAs(root)
    assertThat(child.parent).isSameAs(panel)
    assertThat(survivor.parent).isSameAs(panel)
  }

  private fun assertPairBatchRejected(removes: List<IntArray>, deletes: List<Int>) {
    val panel = mount(2, 1)
    val state: StateWrapper = mock()
    val child = mount(4, 2, state = state)
    val emitter: EventEmitterWrapper = mock()
    surface.updateEventEmitter(4, emitter)
    assertThat(surface.tryDeferPureViewUnmount(removes, deletes)).isFalse()
    assertThat(panel.parent).isSameAs(root)
    assertThat(child.parent).isSameAs(panel)
    assertThat(surface.getView(2)).isSameAs(panel)
    assertThat(surface.getView(4)).isSameAs(child)
    verify(state, times(0)).destroyState()
    verify(emitter, times(0)).destroy()
    // A rejected validation must leave the original synchronous path usable.
    configure(false)
    unmount()
    assertThat(child.parent).isNull()
    assertThat(root.childCount).isZero()
    assertThat(surface.getViewExists(2)).isFalse()
    assertThat(surface.getViewExists(4)).isFalse()
    verify(state).destroyState()
    verify(emitter).destroy()
  }

  @Test
  fun duplicateDeletesAreRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 0), intArrayOf(2, 1, 0)), listOf(4, 4))
  }

  @Test
  fun duplicateRemovesAreRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 0), intArrayOf(4, 2, 0)), listOf(4, 2))
  }

  @Test
  fun mismatchedRemoveTagIsRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 0), intArrayOf(6, 1, 0)), listOf(4, 2))
  }

  @Test
  fun missingDeleteStateIsRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 0), intArrayOf(6, 1, 0)), listOf(4, 6))
  }

  @Test
  fun mismatchedOperationCountsAreRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 0)), listOf(4, 2))
  }

  @Test
  fun malformedRemoveIsRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2), intArrayOf(2, 1, 0)), listOf(4, 2))
  }

  @Test
  fun negativeChildIndexIsRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, -1), intArrayOf(2, 1, 0)), listOf(4, 2))
  }

  @Test
  fun outOfBoundsChildIndexIsRejectedWithoutMutation() {
    assertPairBatchRejected(listOf(intArrayOf(4, 2, 1), intArrayOf(2, 1, 0)), listOf(4, 2))
  }

  @Test
  fun wrongObjectWithMatchingTagIsRejectedWithoutMutation() {
    val panel = mount(2, 1)
    val child = mount(4, 2)
    val impostor = ReactViewGroup(context).apply { id = 4 }
    panel.removeViewAt(0)
    panel.addView(impostor)
    assertThat(
            surface.tryDeferPureViewUnmount(
                listOf(intArrayOf(4, 2, 0), intArrayOf(2, 1, 0)),
                listOf(4, 2),
            )
        )
        .isFalse()
    assertThat(panel.parent).isSameAs(root)
    assertThat(impostor.parent).isSameAs(panel)
    assertThat(surface.getView(4)).isSameAs(child)
    panel.removeViewAt(0)
    panel.addView(child)
    configure(false)
    unmount()
    assertThat(child.parent).isNull()
  }

  @Test
  fun ascendingSiblingIndicesAreRejectedWithoutMutation() {
    val panel = mount(2, 1)
    val first = mount(4, 2)
    val second = mount(6, 2, 1)
    assertThat(
            surface.tryDeferPureViewUnmount(
                listOf(intArrayOf(4, 2, 0), intArrayOf(6, 2, 1), intArrayOf(2, 1, 0)),
                listOf(4, 6, 2),
            )
        )
        .isFalse()
    assertThat(panel.parent).isSameAs(root)
    assertThat(panel.getChildAt(0)).isSameAs(first)
    assertThat(panel.getChildAt(1)).isSameAs(second)
    surface.removeViewAt(6, 2, 1)
    surface.deleteView(6)
    configure(false)
    unmount()
    assertThat(first.parent).isNull()
    assertThat(second.parent).isNull()
  }

  @Test
  fun deleteOrderCanDifferFromRemoveOrderWithSparseTags() {
    val panel = mount(100_000, 1)
    val child = mount(256, 100_000)
    assertThat(
            surface.tryDeferPureViewUnmount(
                listOf(intArrayOf(256, 100_000, 0), intArrayOf(100_000, 1, 0)),
                listOf(100_000, 256),
            )
        )
        .isTrue()
    assertThat(child.parent).isSameAs(panel)
    assertThat(surface.getViewExists(100_000)).isFalse()
    assertThat(surface.getViewExists(256)).isFalse()
    val replacement = mount(100_000, 1)
    drawAndDrain()
    assertThat(child.parent).isNull()
    assertThat(replacement.parent).isSameAs(root)
  }

  @Test
  fun multipleRootsKeepSurvivingSiblingIndices() {
    val survivor = mount(6, 1)
    val first = mount(2, 1, 1)
    val firstChild = mount(4, 2)
    val second = mount(8, 1, 2)
    val secondChild = mount(10, 8)
    val accepted =
        surface.tryDeferPureViewUnmount(
            listOf(
                intArrayOf(4, 2, 0),
                intArrayOf(10, 8, 0),
                intArrayOf(8, 1, 2),
                intArrayOf(2, 1, 1),
            ),
            listOf(4, 2, 10, 8),
        )
    assertThat(accepted).isTrue()
    assertThat(root.childCount).isEqualTo(1)
    assertThat(root.getChildAt(0)).isSameAs(survivor)
    assertThat(firstChild.parent).isSameAs(first)
    assertThat(secondChild.parent).isSameAs(second)
    drawAndDrain()
    assertThat(firstChild.parent).isNull()
    assertThat(secondChild.parent).isNull()
  }

  @Test
  fun cleanupIsPostedAfterDrawCallbackReturns_andSlicesAreBounded() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    queue.enqueue(root) { ++operations == 600 }
    assertThat(operations).isZero()
    root.viewTreeObserver.dispatchOnDraw()
    assertThat(operations).isZero()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isBetween(1, 256)
    val previous = operations
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations - previous).isBetween(1, 256)
    queue.flush()
    assertThat(operations).isEqualTo(600)
    assertThat(queue.size).isZero()
  }

  @Test
  fun detachedSurfaceCanCleanUpWithoutADraw() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    queue.enqueue(View(context)) { ++operations == 1 }
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(100))
    assertThat(operations).isEqualTo(1)
    assertThat(queue.size).isZero()
  }

  @Test
  fun visibleSurfaceDoesNotCleanUpOnTimeoutBeforeDraw() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    val view: View = mock()
    val observer = View(context).viewTreeObserver
    whenever(view.isAttachedToWindow).thenReturn(true)
    whenever(view.isShown).thenReturn(true)
    whenever(view.windowVisibility).thenReturn(View.VISIBLE)
    whenever(view.viewTreeObserver).thenReturn(observer)
    queue.enqueue(view) { ++operations == 1 }
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(300))
    assertThat(operations).isZero()
    observer.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isEqualTo(1)
  }

  @Test
  fun queueSurvivesWindowReattachment() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    val view: View = mock()
    val oldObserver: android.view.ViewTreeObserver = mock()
    val newObserver: android.view.ViewTreeObserver = mock()
    whenever(oldObserver.isAlive).thenReturn(true)
    whenever(newObserver.isAlive).thenReturn(true)
    whenever(view.isAttachedToWindow).thenReturn(true)
    whenever(view.isShown).thenReturn(true)
    whenever(view.windowVisibility).thenReturn(View.VISIBLE)
    whenever(view.viewTreeObserver).thenReturn(oldObserver)
    queue.enqueue(view) { ++operations == 1 }
    whenever(oldObserver.isAlive).thenReturn(false)
    whenever(view.viewTreeObserver).thenReturn(newObserver)
    shadowOf(Looper.getMainLooper()).idleFor(Duration.ofMillis(100))
    assertThat(operations).isZero()
    val listener = argumentCaptor<android.view.ViewTreeObserver.OnDrawListener>()
    verify(newObserver).removeOnDrawListener(org.mockito.kotlin.any())
    verify(newObserver).addOnDrawListener(listener.capture())
    listener.firstValue.onDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isEqualTo(1)
    assertThat(queue.size).isZero()
  }

  @Test
  fun retiredViewsAreOnlyRecycledAfterCleanup_andPoolIsEvictedOnStop() {
    surface.stopSurface()
    configure(true, recycling = true)
    viewManager = ReactViewManager()
    manager = MountingManager(ViewManagerRegistry(listOf(viewManager)), MountItemExecutor {})
    surface = manager.startSurface(1, context, root)
    val oldPanel = mount(2, 1)
    val oldChild = mount(4, 2)
    unmount()
    val newPanel = mount(6, 1)
    assertThat(newPanel).isNotSameAs(oldPanel).isNotSameAs(oldChild)
    drawAndDrain()
    val recycled = mount(8, 6)
    assertThat(recycled === oldPanel || recycled === oldChild).isTrue()
    assertThat(recycled.parent).isSameAs(newPanel)
    surface.stopSurface()
    surface = manager.startSurface(1, context, root)
    val fresh = mount(10, 1, root.childCount)
    assertThat(fresh).isNotSameAs(recycled).isNotSameAs(newPanel)
  }

  @Test
  fun mixedTransactionKeepsOriginalSynchronousPath() {
    mount(2, 1)
    val child = mount(4, 2)
    // A padding instruction makes this a mixed batch.
    IntBufferBatchMountItem(
            1,
            intArrayOf(17, 2, 4, 2, 0, 2, 1, 0, 5, 2, 4, 2, 512, 1, 0, 0, 0, 0),
            emptyArray(),
            0,
        )
        .execute(manager)
    assertThat(child.parent).isNull()
  }

  @Test
  fun layoutAndOverflowUpdatesKeepOriginalSynchronousPath() {
    val sibling = mount(6, 1)
    mount(2, 1, 1)
    val child = mount(4, 2)
    IntBufferBatchMountItem(
            1,
            intArrayOf(
                17,
                2,
                4,
                2,
                0,
                2,
                1,
                1,
                5,
                2,
                4,
                2,
                IntBufferBatchMountItem.INSTRUCTION_UPDATE_LAYOUT,
                6,
                1,
                0,
                0,
                40,
                20,
                1,
                1,
                IntBufferBatchMountItem.INSTRUCTION_UPDATE_OVERFLOW_INSET,
                6,
                0,
                0,
                0,
                0,
            ),
            emptyArray(),
            0,
        )
        .execute(manager)
    assertThat(child.parent).isNull()
    assertThat(sibling.parent).isSameAs(root)
    assertThat(sibling.width).isEqualTo(40)
    assertThat(sibling.height).isEqualTo(20)
    assertThat(surface.getViewExists(2)).isFalse()
    drawAndDrain()
    assertThat(surface.getView(6)).isSameAs(sibling)
  }

  @Test
  fun subtreeAboveAdmissionLimitKeepsOriginalSynchronousPath() {
    val stateCount = DeferredViewCleanupQueue.MAX_PENDING_OPERATIONS / 2 + 1
    val panel = mount(2, 1)
    val children = (1 until stateCount).map { index -> mount(2 + index * 2, 2, index - 1) }
    val instructions = ArrayList<Int>()
    instructions.add(IntBufferBatchMountItem.INSTRUCTION_REMOVE or 1)
    instructions.add(stateCount)
    for (index in children.indices.reversed()) {
      instructions.add(children[index].id)
      instructions.add(2)
      instructions.add(index)
    }
    instructions.addAll(listOf(2, 1, 0))
    instructions.add(IntBufferBatchMountItem.INSTRUCTION_DELETE or 1)
    instructions.add(stateCount)
    instructions.addAll(children.map { it.id })
    instructions.add(2)
    IntBufferBatchMountItem(1, instructions.toIntArray(), emptyArray(), 0).execute(manager)
    assertThat(panel.parent).isNull()
    assertThat(panel.childCount).isZero()
    assertThat(children).allSatisfy { assertThat(it.parent).isNull() }
    assertThat(surface.getViewExists(2)).isFalse()
    assertThat(root.childCount).isZero()
  }

  @Test
  fun taskEnqueuedAfterDrawWaitsForItsOwnDraw() {
    val queue = DeferredViewCleanupQueue()
    var first = 0
    var second = 0
    queue.enqueue(root) { ++first == 1 }
    root.viewTreeObserver.dispatchOnDraw()
    queue.enqueue(root) { ++second == 1 }
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(first).isEqualTo(1)
    assertThat(second).isZero()
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(second).isEqualTo(1)
  }

  @Test
  fun reentrantFlushDoesNotRemoveAnAlreadyCompletedTaskTwice() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    queue.enqueue(root) {
      operations++
      if (operations == 1) queue.flush()
      operations >= 3
    }
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isEqualTo(3)
    assertThat(queue.size).isZero()
  }

  @Test
  fun anExpensiveOperationYieldsBeforeTheOperationLimit() {
    val queue = DeferredViewCleanupQueue()
    var operations = 0
    queue.enqueue(root) {
      operations++
      // A real operation may exceed the budget. It must finish, then yield to another draw.
      val end = System.nanoTime() + 2_000_000L
      while (System.nanoTime() < end) {}
      operations == 2
    }
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isEqualTo(1)
    root.viewTreeObserver.dispatchOnDraw()
    shadowOf(Looper.getMainLooper()).idle()
    assertThat(operations).isEqualTo(2)
    assertThat(queue.size).isZero()
  }

  @Test
  fun fullQueueFallsBackWithoutTouchingPreviouslyRetiredViews() {
    val retired = ArrayList<ReactViewGroup>()
    repeat(8) {
      mount(2, 1)
      retired.add(mount(4, 2))
      unmount()
      assertThat(retired.last().parent).isNotNull()
    }
    mount(2, 1)
    val fallback = mount(4, 2)
    unmount()
    assertThat(fallback.parent).isNull()
    assertThat(retired).allSatisfy { assertThat(it.parent).isNotNull() }
    surface.stopSurface()
    assertThat(retired).allSatisfy { assertThat(it.parent).isNull() }
  }
}
