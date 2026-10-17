/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@file:Suppress("DEPRECATION")

package com.facebook.react.fabric

import android.os.Looper
import com.facebook.react.ReactRootView
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactTestHelper
import com.facebook.react.bridge.UIManager
import com.facebook.react.bridge.UIManagerListener
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.fabric.mounting.MountItemDispatcher
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.fabric.mounting.mountitems.DispatchCommandMountItem
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsDefaults
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.modules.core.ReactChoreographer
import com.facebook.react.uimanager.GuardedFrameCallback
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerRegistry
import com.facebook.testutils.fakes.FakeBatchEventDispatchedListener
import com.facebook.testutils.shadows.ShadowFabricUIManagerBinding
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowPerformanceTracer
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.kotlin.mock
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.shadow.api.Shadow
import org.robolectric.util.ReflectionHelpers

/**
 * Tests for the pull-model notification path: [FabricUIManager.onTransactionAvailable] marks the
 * surface as having a transaction, and the next dispatch asks the (shadowed, JNI-backed)
 * [FabricUIManagerBinding] to pull and apply it.
 *
 * The Robolectric test thread is the UI thread, so a notification posted from it dispatches
 * synchronously; notifications posted from a background thread wait for the next UI-thread dispatch
 * (in production, the dispatcher's frame callback).
 */
@OptIn(UnstableReactNativeAPI::class)
@RunWith(RobolectricTestRunner::class)
@Config(
    shadows =
        [
            ShadowSoLoader::class,
            ShadowNativeLoader::class,
            ShadowPerformanceTracer::class,
            ShadowFabricUIManagerBinding::class,
        ],
)
class FabricUIManagerPullModelTest {

  private lateinit var reactContext: ReactApplicationContext
  private lateinit var underTest: FabricUIManager
  private lateinit var binding: FabricUIManagerBinding
  private lateinit var shadowBinding: ShadowFabricUIManagerBinding
  private var didMountItemsCount = 0

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
    overrideFeatureFlags()
    reactContext = ReactTestHelper.createCatalystContextForTest()
    underTest =
        FabricUIManager(
            reactContext,
            ViewManagerRegistry(emptyList()),
            FakeBatchEventDispatchedListener(),
        )
    binding = FabricUIManagerBinding()
    shadowBinding = Shadow.extract(binding)
    underTest.setBinding(binding)
    underTest.addUIManagerEventListener(
        object : UIManagerListener {
          override fun willDispatchViewUpdates(uiManager: UIManager) = Unit

          override fun willMountItems(uiManager: UIManager) = Unit

          override fun didMountItems(uiManager: UIManager) {
            didMountItemsCount++
          }

          override fun didDispatchMountItems(uiManager: UIManager) = Unit

          override fun didScheduleMountItems(uiManager: UIManager) = Unit
        }
    )
  }

  @After
  fun tearDown() {
    ReactNativeFeatureFlags.dangerouslyReset()
  }

  private fun overrideFeatureFlags(
      disableIdleMountItemFrameCallbackRearm: Boolean = false,
      disableEarlyViewCommandExecution: Boolean = false,
  ) {
    ReactNativeFeatureFlags.dangerouslyReset()
    ReactNativeFeatureFlags.override(
        object : ReactNativeFeatureFlagsDefaults() {
          override fun enableMountingCoordinatorPullModelAndroid(): Boolean = true

          override fun disableIdleMountItemFrameCallbackRearmAndroid(): Boolean =
              disableIdleMountItemFrameCallbackRearm

          override fun disableEarlyViewCommandExecution(): Boolean =
              disableEarlyViewCommandExecution
        },
    )
  }

  /**
   * Runs [block] with the frame callback that disarms at idle. The test drives its frames; the
   * mocked Choreographer only records that one is scheduled.
   */
  private fun withIdleFrameCallback(block: (frameCallback: GuardedFrameCallback) -> Unit) {
    overrideFeatureFlags(disableIdleMountItemFrameCallbackRearm = true)
    val originalChoreographer = ReactChoreographer.overrideInstanceForTest(mock())
    try {
      val frameCallback: GuardedFrameCallback =
          ReflectionHelpers.getField(underTest, "mDispatchUIFrameCallback")
      ReflectionHelpers.setField(frameCallback, "mShouldSchedule", true)
      block(frameCallback)
    } finally {
      ReactChoreographer.overrideInstanceForTest(originalChoreographer)
    }
  }

  private fun isFrameScheduled(frameCallback: GuardedFrameCallback): Boolean =
      ReflectionHelpers.getField(frameCallback, "mIsScheduled")

  private val mountingManager: MountingManager
    get() = ReflectionHelpers.getField(underTest, "mMountingManager")

  private val dispatcher: MountItemDispatcher
    get() = ReflectionHelpers.getField(underTest, "mMountItemDispatcher")

  private fun runOnBackgroundThread(block: () -> Unit) {
    var error: Throwable? = null
    val thread = Thread {
      try {
        block()
      } catch (t: Throwable) {
        error = t
      }
    }
    thread.start()
    thread.join()
    error?.let { throw it }
  }

  private fun scheduleSynchronously(mountItem: MountItem) {
    val method =
        FabricUIManager::class
            .java
            .getDeclaredMethod(
                "scheduleMountItem",
                MountItem::class.java,
                Integer.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                java.lang.Long.TYPE,
                Integer.TYPE,
                java.lang.Boolean.TYPE,
            )
    method.isAccessible = true
    method.invoke(underTest, mountItem, 0, 0L, 0L, 0L, 0L, 0L, 0L, 0L, 0, true)
  }

  private fun recordingMountItem(surfaceId: Int, name: String, log: MutableList<String>) =
      object : MountItem {
        override fun execute(mountingManager: MountingManager) {
          log.add(name)
        }

        override fun getSurfaceId(): Int = surfaceId
      }

  private fun recordingCommand(surfaceId: Int, name: String, log: MutableList<String>) =
      object : DispatchCommandMountItem() {
        override fun execute(mountingManager: MountingManager) {
          log.add(name)
        }

        override fun getSurfaceId(): Int = surfaceId
      }

  /**
   * Stands in for a surface's MountingCoordinator: a commit notifies from a background (commit)
   * thread, and a pull mounts every revision committed since the previous pull as one synchronous
   * batch named "<from>-><to>", or mounts nothing when there is no new revision.
   */
  private inner class PulledSurface(val surfaceId: Int, val log: MutableList<String>) {
    private var committedRevision = 0
    private var pulledRevision = 0

    fun commit() {
      committedRevision++
      runOnBackgroundThread { underTest.onTransactionAvailable(surfaceId) }
    }

    fun commitOnUiThread() {
      committedRevision++
      underTest.onTransactionAvailable(surfaceId)
    }

    fun pull() {
      if (committedRevision == pulledRevision) {
        return
      }
      val batch = "$pulledRevision->$committedRevision"
      pulledRevision = committedRevision
      scheduleSynchronously(recordingMountItem(surfaceId, batch, log))
    }
  }

  /** The revisions that the "<from>-><to>" batches mounted, in mount order. */
  private fun mountedRevisions(batches: List<String>): List<Int> =
      batches.flatMap { batch ->
        val (from, to) = batch.split("->").map(String::toInt)
        (from + 1..to).toList()
      }

  @Test
  fun onTransactionAvailable_onUiThread_pullsSynchronously() {
    underTest.onTransactionAvailable(1)

    assertThat(shadowBinding.pulledSurfaceIds).containsExactly(1)
  }

  @Test
  fun onTransactionAvailable_pullsEachPendingSurfaceOnce() {
    // A pull mounts every revision committed since the previous one, so further notifications for
    // a surface that is already pending add nothing.
    runOnBackgroundThread {
      underTest.onTransactionAvailable(1)
      underTest.onTransactionAvailable(2)
      underTest.onTransactionAvailable(1)
    }
    // Notifications from a background (commit) thread are not dispatched.
    assertThat(shadowBinding.pulledSurfaceIds).isEmpty()

    // The next UI-thread dispatch pulls every pending surface.
    underTest.onTransactionAvailable(3)

    assertThat(shadowBinding.pulledSurfaceIds).containsExactlyInAnyOrder(1, 2, 3)
  }

  @Test
  fun pullDeferredByRootAttach_isAppliedBeforeLaterPulls() {
    val surfaceId = 12
    val themedReactContext = ThemedReactContext(reactContext, reactContext, "TestModule", surfaceId)
    mountingManager.startSurface(surfaceId, themedReactContext, null)
    val appliedBatches = mutableListOf<String>()
    val surface = PulledSurface(surfaceId, appliedBatches)
    shadowBinding.onPull = { surface.pull() }

    surface.commit()
    dispatcher.tryDispatchMountItems() // the root view is not attached, so nothing mounts yet
    surface.commit()
    mountingManager.attachRootView(surfaceId, ReactRootView(reactContext), themedReactContext)
    surface.commit()
    dispatcher.tryDispatchMountItems()

    assertThat(mountedRevisions(appliedBatches)).containsExactly(1, 2, 3)
  }

  @Test
  fun preallocationQueuedBeforeDispatch_runsBeforeThePull() {
    val log = mutableListOf<String>()
    val surface = PulledSurface(11, log)
    shadowBinding.onPull = { surface.pull() }

    surface.commit()
    runOnBackgroundThread {
      dispatcher.addPreAllocateMountItem(recordingMountItem(11, "preallocate", log))
    }
    dispatcher.tryDispatchMountItems()

    assertThat(log).containsExactly("preallocate", "0->1")
  }

  @Test
  fun mountItemQueuedBeforeCommit_runsAfterThePull() {
    // Pending pulls run before every queued mount item, whatever their notification order.
    val log = mutableListOf<String>()
    val surface = PulledSurface(11, log)
    shadowBinding.onPull = { surface.pull() }

    runOnBackgroundThread { dispatcher.addMountItem(recordingMountItem(11, "event", log)) }
    surface.commit()
    dispatcher.tryDispatchMountItems()

    assertThat(log).containsExactly("0->1", "event")
  }

  @Test
  fun pendingPullOfStoppedSurface_runsOnceAndIsDropped() {
    // The C++ pull of a stopped surface finds no surface and mounts nothing.
    val surfaceId = 12
    val themedReactContext = ThemedReactContext(reactContext, reactContext, "TestModule", surfaceId)
    mountingManager.startSurface(surfaceId, themedReactContext, null)
    runOnBackgroundThread { underTest.onTransactionAvailable(surfaceId) }
    dispatcher.tryDispatchMountItems() // waits for the root view

    mountingManager.stopSurface(surfaceId)
    dispatcher.tryDispatchMountItems()
    dispatcher.tryDispatchMountItems()

    assertThat(shadowBinding.pulledSurfaceIds).containsExactly(surfaceId)
  }

  @Test
  fun pull_runsMountHooks() {
    val surface = PulledSurface(11, mutableListOf())
    shadowBinding.onPull = { surface.pull() }

    surface.commit()
    dispatcher.tryDispatchMountItems()
    shadowOf(Looper.getMainLooper()).idle()

    assertThat(didMountItemsCount).isEqualTo(1)
    assertThat(shadowBinding.reportedMountSurfaceIds).containsExactly(11)
  }

  @Test
  fun pullWaitingForRootAttach_isMountedByTheFrameAfterTheAttach() {
    // With the idle frame callback, nothing may keep frames running while the root is detached, so
    // the attach must schedule the frame that mounts the surface.
    withIdleFrameCallback { frameCallback ->
      val surfaceId = 12
      val themedReactContext =
          ThemedReactContext(reactContext, reactContext, "TestModule", surfaceId)
      mountingManager.startSurface(surfaceId, themedReactContext, null)
      val log = mutableListOf<String>()
      val surface = PulledSurface(surfaceId, log)
      shadowBinding.onPull = { surface.pull() }

      surface.commit()
      runOnBackgroundThread {
        dispatcher.addPreAllocateMountItem(recordingMountItem(surfaceId, "preallocate", log))
      }
      frameCallback.doFrame(System.nanoTime())

      assertThat(log).isEmpty()
      assertThat(isFrameScheduled(frameCallback)).isFalse()

      mountingManager.attachRootView(surfaceId, ReactRootView(reactContext), themedReactContext)

      assertThat(isFrameScheduled(frameCallback)).isTrue()

      frameCallback.doFrame(System.nanoTime())

      assertThat(log).containsExactly("preallocate", "0->1")
    }
  }

  @Test
  fun rootAttachWithoutPendingPull_doesNotScheduleFrame() {
    withIdleFrameCallback { frameCallback ->
      val surfaceId = 12
      val themedReactContext =
          ThemedReactContext(reactContext, reactContext, "TestModule", surfaceId)
      mountingManager.startSurface(surfaceId, themedReactContext, null)

      mountingManager.attachRootView(surfaceId, ReactRootView(reactContext), themedReactContext)

      assertThat(isFrameScheduled(frameCallback)).isFalse()
    }
  }

  @Test
  fun pendingPull_keepsTheIdleFrameCallbackArmed() {
    withIdleFrameCallback { frameCallback ->
      val firstLog = mutableListOf<String>()
      val secondLog = mutableListOf<String>()
      val surfaces = mapOf(11 to PulledSurface(11, firstLog), 12 to PulledSurface(12, secondLog))
      shadowBinding.onPull = { surfaceId ->
        surfaces.getValue(surfaceId).pull()
        if (surfaceId == 11) {
          // The commit thread notifies while the frame mounts surface 11.
          surfaces.getValue(12).commit()
        }
      }

      surfaces.getValue(11).commit()
      frameCallback.doFrame(System.nanoTime())

      assertThat(secondLog).isEmpty()
      assertThat(isFrameScheduled(frameCallback)).isTrue()

      frameCallback.doFrame(System.nanoTime())

      assertThat(firstLog).containsExactly("0->1")
      assertThat(secondLog).containsExactly("0->1")
      assertThat(isFrameScheduled(frameCallback)).isFalse()
    }
  }

  @Test
  fun commitFromUiThreadDuringPull_isMountedByTheNextFrame() {
    // The nested dispatch returns early, so the pending pull alone must schedule the next frame.
    withIdleFrameCallback { frameCallback ->
      val log = mutableListOf<String>()
      val surface = PulledSurface(11, log)
      var committedDuringPull = false
      shadowBinding.onPull = {
        surface.pull()
        if (!committedDuringPull) {
          committedDuringPull = true
          surface.commitOnUiThread()
        }
      }

      surface.commit()
      frameCallback.doFrame(System.nanoTime())

      assertThat(log).containsExactly("0->1")
      assertThat(isFrameScheduled(frameCallback)).isTrue()

      frameCallback.doFrame(System.nanoTime())

      assertThat(log).containsExactly("0->1", "1->2")
      assertThat(isFrameScheduled(frameCallback)).isFalse()
    }
  }

  @Test
  fun viewCommandsInMountItemOrder_runAfterThePull() {
    // With disableEarlyViewCommandExecution, view commands go through the mount item queue. A
    // command dispatched before a commit's notification runs after that commit mounts.
    overrideFeatureFlags(disableEarlyViewCommandExecution = true)
    val log = mutableListOf<String>()
    val surface = PulledSurface(11, log)
    shadowBinding.onPull = { surface.pull() }

    runOnBackgroundThread {
      dispatcher.addViewCommandMountItem(recordingCommand(11, "commandBeforeCommit", log))
    }
    surface.commit()
    runOnBackgroundThread {
      dispatcher.addViewCommandMountItem(recordingCommand(11, "commandAfterCommit", log))
    }
    dispatcher.tryDispatchMountItems()

    assertThat(log).containsExactly("0->1", "commandBeforeCommit", "commandAfterCommit")
  }
}
