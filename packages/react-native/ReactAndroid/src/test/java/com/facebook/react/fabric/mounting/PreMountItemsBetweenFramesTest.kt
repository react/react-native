/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting

import android.os.Handler
import android.os.Looper
import android.os.MessageQueue
import com.facebook.react.common.SystemClock
import com.facebook.react.fabric.mounting.mountitems.MountItem
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowNativeLoader
import com.facebook.testutils.shadows.ShadowPerformanceTracer
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.MockedStatic
import org.mockito.Mockito.mockStatic
import org.mockito.kotlin.any
import org.mockito.kotlin.doAnswer
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.robolectric.RobolectricTestRunner
import org.robolectric.Shadows.shadowOf
import org.robolectric.annotation.Config
import org.robolectric.annotation.LooperMode

@RunWith(RobolectricTestRunner::class)
@LooperMode(LooperMode.Mode.PAUSED)
@Config(
    shadows = [ShadowSoLoader::class, ShadowNativeLoader::class, ShadowPerformanceTracer::class]
)
class PreMountItemsBetweenFramesTest {
  private lateinit var systemClock: MockedStatic<SystemClock>
  private lateinit var dispatcher: MountItemDispatcher
  private lateinit var preMountItemsBetweenFrames: PreMountItemsBetweenFrames
  private val uiThreadHandler: Handler = Handler(Looper.getMainLooper())
  private val handledExceptions: MutableList<Exception> = mutableListOf()
  private var nowNanos: Long = 0L
  private var threadCpuNanos: Long = 0L
  private var threadCpuClockCanTell: Boolean = true
  private var nextVsyncNanos: Long = FIRST_FRAME_NANOS
  private var executedItems: Int = 0
  private var mountedAtNanos: Long? = null
  private var displayFrameIntervalNanos: Long? = ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS
  private var isMountingAllowed: Boolean = true

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    systemClock = mockStatic(SystemClock::class.java)
    systemClock.`when`<Long> { SystemClock.nanoTime() }.thenAnswer { nowNanos }
    val mountingManager = mock<MountingManager>()
    whenever(mountingManager.surfaceIsStopped(any())).thenReturn(false)
    whenever(mountingManager.isWaitingForViewAttach(any())).thenReturn(false)
    val itemDispatchListener = mock<MountItemDispatcher.ItemDispatchListener>()
    doAnswer {
          mountedAtNanos = nowNanos
          null
        }
        .whenever(itemDispatchListener)
        .pullTransaction(any())
    dispatcher = MountItemDispatcher(mountingManager, itemDispatchListener)
    preMountItemsBetweenFrames =
        PreMountItemsBetweenFrames(
            dispatcher,
            { displayFrameIntervalNanos },
            // Debug.threadCpuTimeNanos() reports -1 where the system cannot tell a thread's CPU
            // time.
            { if (threadCpuClockCanTell) threadCpuNanos else -1L },
            { isMountingAllowed },
            uiThreadHandler,
            { exception -> handledExceptions.add(exception) },
        )
  }

  @After
  fun tearDown() {
    systemClock.close()
  }

  /** Queues items that each take [costNanos] and run [onExecute] when they execute. */
  private fun queuePreMountItems(
      count: Int,
      costNanos: Long = MILLISECOND_NANOS,
      onExecute: (index: Int) -> Unit = {},
  ) {
    repeat(count) { index ->
      dispatcher.addPreAllocateMountItem(
          object : MountItem {
            override fun execute(mountingManager: MountingManager) {
              onExecute(index)
              executedItems++
              nowNanos += costNanos
              threadCpuNanos += costNanos
            }

            override fun getSurfaceId(): Int = SURFACE_ID
          }
      )
    }
  }

  /**
   * Runs the frame callback at [frameTimeNanos] and the frame's own work, [frameWorkNanos], and
   * returns how many items the frame callback itself executed. The frame starts at [startNanos],
   * its frame time unless it starts late. With [renderThreadReadyAtNanos], the frame's draw then
   * sleeps until the render thread takes the frame, as it does while the render thread waits on
   * SurfaceFlinger for a buffer.
   */
  private fun runFrame(
      frameTimeNanos: Long,
      frameWorkNanos: Long,
      renderThreadReadyAtNanos: Long? = null,
      startNanos: Long = frameTimeNanos,
  ): Int {
    nowNanos = startNanos
    val before = executedItems
    preMountItemsBetweenFrames.preMountBeforeTraversal()
    preMountItemsBetweenFrames.scheduleAfterFrame(frameTimeNanos)
    val executedInsideTheFrame = executedItems - before
    nowNanos += frameWorkNanos
    threadCpuNanos += frameWorkNanos
    if (renderThreadReadyAtNanos != null) {
      nowNanos = maxOf(nowNanos, renderThreadReadyAtNanos)
    }
    return executedInsideTheFrame
  }

  /** Runs everything queued on the UI thread and returns how many items it executed. */
  private fun runBetweenFrames(): Int {
    val before = executedItems
    val looper = shadowOf(Looper.getMainLooper())
    var tasks = 0
    while (!looper.isIdle) {
      tasks++
      check(tasks <= MAX_TASKS_BETWEEN_FRAMES) { "The UI thread never went idle between frames" }
      looper.runOneTask()
    }
    return executedItems - before
  }

  /**
   * Runs the next frame, then everything queued after it, and returns how many items the frame
   * callback executed. As with the Choreographer, the frame starts at the vsync after the last
   * frame's start, or once the UI thread is free if that vsync has passed, and its frame time is
   * the last vsync at or before its start.
   */
  private fun runNextFrame(frameWorkNanos: Long): Int {
    val frameIntervalNanos = checkNotNull(displayFrameIntervalNanos)
    val startNanos = maxOf(nowNanos, nextVsyncNanos)
    val frameTimeNanos = startNanos - (startNanos - nextVsyncNanos) % frameIntervalNanos
    nextVsyncNanos = frameTimeNanos + frameIntervalNanos
    val executedInsideTheFrame = runFrame(frameTimeNanos, frameWorkNanos, startNanos = startNanos)
    runBetweenFrames()
    return executedInsideTheFrame
  }

  @Test
  fun preMountsNothingInsideTheFrame() {
    queuePreMountItems(count = 20)

    assertThat(runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)).isZero()
  }

  @Test
  fun preMountsBetweenFramesUntilTheNextVsync() {
    val itemsByRateAndFrameWork =
        listOf(60, 120, 144)
            .flatMap { refreshRate ->
              listOf(0, 2, 5).map { frameWork -> refreshRate to frameWork }
            }
            .withIndex()
            .associate { (index, rateAndFrameWork) ->
              val (refreshRate, frameWorkMilliseconds) = rateAndFrameWork
              displayFrameIntervalNanos = SECOND_NANOS / refreshRate
              queuePreMountItems(count = 40)
              runFrame(
                  FIRST_FRAME_NANOS + index * SECOND_NANOS,
                  frameWorkMilliseconds * MILLISECOND_NANOS,
              )
              val executed = "$refreshRate Hz after $frameWorkMilliseconds ms" to runBetweenFrames()
              dispatcher.dispatchPreMountItemsUntil(Long.MAX_VALUE)
              executed
            }

    // Items start each millisecond from the end of the frame's work, and none starts past the
    // next vsync: 16.67 ms after the frame at 60 Hz, 8.33 ms at 120 Hz, 6.94 ms at 144 Hz.
    assertThat(itemsByRateAndFrameWork)
        .isEqualTo(
            mapOf(
                "60 Hz after 0 ms" to 17,
                "60 Hz after 2 ms" to 15,
                "60 Hz after 5 ms" to 12,
                "120 Hz after 0 ms" to 9,
                "120 Hz after 2 ms" to 7,
                "120 Hz after 5 ms" to 4,
                "144 Hz after 0 ms" to 7,
                "144 Hz after 2 ms" to 5,
                "144 Hz after 5 ms" to 2,
            )
        )
  }

  @Test
  fun preMountsLongerThanHalfOfASixtyHertzFrameWhenTheFrameLeavesTheTime() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 40)

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 2 * MILLISECOND_NANOS)

    // Before the frame, the budget is half of a 60 Hz frame: 9 items of 1 ms.
    assertThat(runBetweenFrames()).isEqualTo(15)
  }

  @Test
  fun aMessageQueuedDuringASliceRunsBeforeTheNextSlice() {
    var itemsBeforeTheMessage = -1
    queuePreMountItems(count = 20) { index ->
      if (index == 0) {
        uiThreadHandler.post { itemsBeforeTheMessage = executedItems }
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()

    // A slice ends one millisecond after it starts, and the item running at that moment finishes.
    assertThat(itemsBeforeTheMessage).isEqualTo(2)
    assertThat(executedItems).isEqualTo(9)
  }

  /** Queues a commit's mount item, which records when it executes in [mountedAtNanos]. */
  private fun landCommit() {
    dispatcher.addMountItem(
        object : MountItem {
          override fun execute(mountingManager: MountingManager) {
            mountedAtNanos = nowNanos
          }

          override fun getSurfaceId(): Int = SURFACE_ID
        }
    )
  }

  @Test
  fun aCommitThatLandsBetweenFramesMountsWithoutWaitingForTheNextFrame() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20) { index ->
      if (index == 2) {
        landCommit()
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()

    // The commit lands during the third item, in the second slice. The next slice mounts it, and
    // the batch first runs the 16 items still waiting, as the frame's mount items would.
    assertThat(mountedAtNanos).isEqualTo(FIRST_FRAME_NANOS + 20 * MILLISECOND_NANOS)
  }

  @Test
  fun aCommitThatLandsWithTheLastItemMountsWithoutWaitingForTheNextFrame() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 3) { index ->
      if (index == 2) {
        landCommit()
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()

    assertThat(mountedAtNanos).isEqualTo(FIRST_FRAME_NANOS + 3 * MILLISECOND_NANOS)
  }

  @Test
  fun aCommitToPullWaitsForTheFrameWhileTheSlicesPreMount() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20) { index ->
      if (index == 2) {
        dispatcher.addSurfaceIdToPull(SURFACE_ID)
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    // The pull model queues the commit's surface, and the next frame pulls it once, however many
    // commits land before it.
    assertThat(runBetweenFrames()).isEqualTo(17)
    assertThat(mountedAtNanos).isNull()
    assertThat(dispatcher.hasPendingItems()).isTrue()
  }

  @Test
  fun mountItemsWaitWithACommitToPullForTheFrame() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 5) { index ->
      if (index == 2) {
        dispatcher.addSurfaceIdToPull(SURFACE_ID)
        landCommit()
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    // A dispatch pulls before it mounts, so the frame runs both, and no slice spins while they
    // wait.
    assertThat(runBetweenFrames()).isEqualTo(5)
    assertThat(mountedAtNanos).isNull()
    assertThat(dispatcher.hasPendingItems()).isTrue()
  }

  @Test
  fun workQueuedWhileASliceMountsRunsBeforeTheNextVsync() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 3) { index ->
      if (index == 2) {
        dispatcher.addMountItem(
            object : MountItem {
              override fun execute(mountingManager: MountingManager) {
                // JavaScript pre-allocates the next views while the UI thread mounts the commit.
                queuePreMountItems(count = 5)
              }

              override fun getSurfaceId(): Int = SURFACE_ID
            }
        )
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    assertThat(runBetweenFrames()).isEqualTo(8)
  }

  @Test
  fun aSliceRunsNothingOnceMountingIsNoLongerAllowed() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20) { index ->
      if (index == 1) {
        // A frame's mount fails, or the UI manager is destroyed, while slices are still queued.
        isMountingAllowed = false
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    assertThat(runBetweenFrames()).isEqualTo(2)
  }

  @Test
  fun aTraversalScheduledForTheNextFrameDoesNotHoldBackTheSlices() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 20)
    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    // A view that invalidates while it draws, such as a ScrollView during a fling, schedules the
    // next frame's traversal, which holds a sync barrier in the queue until that frame.
    val barrier = postSyncBarrier()
    try {
      assertThat(runBetweenFrames()).isEqualTo(17)
    } finally {
      removeSyncBarrier(barrier)
    }
  }

  private fun postSyncBarrier(): Int =
      MessageQueue::class.java.getMethod("postSyncBarrier").invoke(Looper.getMainLooper().queue)
          as Int

  private fun removeSyncBarrier(token: Int) {
    MessageQueue::class
        .java
        .getMethod("removeSyncBarrier", Int::class.javaPrimitiveType)
        .invoke(Looper.getMainLooper().queue, token)
  }

  @Test
  fun aStaleFrameIntervalStillYieldsEveryMillisecond() {
    // The display last reported 30 Hz while frames arrive at 120 Hz.
    displayFrameIntervalNanos = SECOND_NANOS / 30
    var itemsBeforeTheMessage = -1
    queuePreMountItems(count = 40) { index ->
      if (index == 0) {
        uiThreadHandler.post { itemsBeforeTheMessage = executedItems }
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()

    assertThat(itemsBeforeTheMessage).isEqualTo(2)
  }

  @Test
  fun aDisplayThatReportsNoRateIsTakenAsSixtyHertz() {
    displayFrameIntervalNanos = null
    queuePreMountItems(count = 40)

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 2 * MILLISECOND_NANOS)

    assertThat(runBetweenFrames()).isEqualTo(15)
  }

  @Test
  fun aFrameThatRanPastTheNextVsyncPreMountsNothing() {
    queuePreMountItems(count = 20)

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 9 * MILLISECOND_NANOS)

    assertThat(runBetweenFrames()).isZero()
  }

  @Test
  fun aFrameWhoseDrawWaitedOnTheRenderThreadPreMountsBeforeTheNextTraversal() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)
    val secondFrameNanos = FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS

    runFrame(FIRST_FRAME_NANOS, MILLISECOND_NANOS, renderThreadReadyAtNanos = secondFrameNanos)

    // The draw slept 15.67 ms and left no time after the frame; the next frame spends that wait
    // before its traversal, at most half a frame: 9 items of 1 ms start within 8.33 ms.
    assertThat(runBetweenFrames()).isZero()
    assertThat(runFrame(secondFrameNanos, MILLISECOND_NANOS)).isEqualTo(9)
  }

  @Test
  fun preMountingBeforeTheTraversalLastsWhileTheFramesKeepWaiting() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)

    val itemsBeforeEachTraversal =
        (0 until 4).map { frame ->
          val frameTimeNanos = FIRST_FRAME_NANOS + frame * SIXTY_HERTZ_FRAME_NANOS
          val executed =
              runFrame(
                  frameTimeNanos,
                  MILLISECOND_NANOS,
                  renderThreadReadyAtNanos = frameTimeNanos + SIXTY_HERTZ_FRAME_NANOS,
              )
          runBetweenFrames()
          executed
        }

    assertThat(itemsBeforeEachTraversal).containsExactly(0, 9, 9, 9)
  }

  @Test
  fun aFrameThatNoLongerWaitsLeavesTheNextTraversalAlone() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)
    val secondFrameNanos = FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS
    runFrame(FIRST_FRAME_NANOS, MILLISECOND_NANOS, renderThreadReadyAtNanos = secondFrameNanos)
    runBetweenFrames()

    assertThat(runFrame(secondFrameNanos, MILLISECOND_NANOS)).isEqualTo(9)
    runBetweenFrames()

    assertThat(runFrame(secondFrameNanos + SIXTY_HERTZ_FRAME_NANOS, MILLISECOND_NANOS)).isZero()
  }

  @Test
  fun aFrameBusyPastTheNextVsyncLeavesTheNextTraversalAlone() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 20 * MILLISECOND_NANOS)

    assertThat(runBetweenFrames()).isZero()
    assertThat(runFrame(FIRST_FRAME_NANOS + 2 * SIXTY_HERTZ_FRAME_NANOS, MILLISECOND_NANOS))
        .isZero()
  }

  @Test
  fun framesBusyPastEveryVsyncPreMountBeforeTheirTraversalFromTheThird() {
    val itemsBeforeEachTraversalByRate =
        listOf(60, 120, 144).withIndex().associate { (index, refreshRate) ->
          val frameIntervalNanos = SECOND_NANOS / refreshRate
          displayFrameIntervalNanos = frameIntervalNanos
          nextVsyncNanos = FIRST_FRAME_NANOS + index * SECOND_NANOS
          queuePreMountItems(count = 100)
          // Each frame's own work runs a fifth of a frame past the next vsync.
          val executed = List(5) { runNextFrame(frameIntervalNanos * 6 / 5) }
          preMountItemsBetweenFrames.cancel()
          dispatcher.dispatchPreMountItemsUntil(Long.MAX_VALUE)
          "$refreshRate Hz" to executed
        }

    // Half a frame is 8.33 ms at 60 Hz, 4.17 ms at 120 Hz and 3.47 ms at 144 Hz, from the start of
    // the pre-mounting, however late the frame started.
    assertThat(itemsBeforeEachTraversalByRate)
        .isEqualTo(
            mapOf(
                "60 Hz" to listOf(0, 0, 9, 9, 9),
                "120 Hz" to listOf(0, 0, 5, 5, 5),
                "144 Hz" to listOf(0, 0, 4, 4, 4),
            )
        )
  }

  @Test
  fun oneFrameBusyPastTheNextVsyncPaysNothingBeforeTheTraversals() {
    queuePreMountItems(count = 100)

    val executed =
        listOf(20, 2, 20, 2, 2).map { frameWorkMilliseconds ->
          runNextFrame(frameWorkMilliseconds * MILLISECOND_NANOS)
        }

    // Each busy frame is followed by one that leaves time, so no two frames in a row are busy.
    assertThat(executed).containsExactly(0, 0, 0, 0, 0)
  }

  @Test
  fun preMountingBeforeTheTraversalEndsWithTheFramesBusyPastTheVsync() {
    queuePreMountItems(count = 100)

    // Three frames busy for 10 ms at 120 Hz, then frames whose 7.5 ms fit an 8.33 ms frame but
    // start late until the UI thread catches up with the vsyncs.
    val executed =
        (List(3) { 10 * MILLISECOND_NANOS } + List(8) { 7_500 * MICROSECOND_NANOS }).map {
            frameWorkNanos ->
          runNextFrame(frameWorkNanos)
        }

    assertThat(executed).containsExactly(0, 0, 5, 5, 0, 0, 0, 0, 0, 0, 0)
  }

  @Test
  fun aFrameWithNothingToPreMountEndsARunOfBusyFrames() {
    queuePreMountItems(count = 100)
    val busyFrameNanos = 10 * MILLISECOND_NANOS
    val firstBurst = List(2) { runNextFrame(busyFrameNanos) }

    // A commit's mount runs every item left, and the next frame has nothing to pre-mount.
    dispatcher.dispatchPreMountItemsUntil(Long.MAX_VALUE)
    runNextFrame(busyFrameNanos)
    queuePreMountItems(count = 100)
    val secondBurst = List(3) { runNextFrame(busyFrameNanos) }

    assertThat(firstBurst + secondBurst).containsExactly(0, 0, 0, 0, 5)
  }

  @Test
  fun vsyncsWithNoFrameCallbackEndARunOfBusyFrames() {
    queuePreMountItems(count = 100)
    val busyFrameNanos = 10 * MILLISECOND_NANOS
    val beforeTheGap = List(2) { runNextFrame(busyFrameNanos) }

    // The frame callback stops re-arming, and the next frame comes ten vsyncs later.
    nextVsyncNanos += 10 * ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS
    val afterTheGap = List(3) { runNextFrame(busyFrameNanos) }

    assertThat(beforeTheGap + afterTheGap).containsExactly(0, 0, 0, 0, 5)
  }

  @Test
  fun cancellingEndsARunOfBusyFrames() {
    queuePreMountItems(count = 100)
    val busyFrameNanos = 10 * MILLISECOND_NANOS
    val beforeCancelling = List(2) { runNextFrame(busyFrameNanos) }

    preMountItemsBetweenFrames.cancel()
    val afterCancelling = List(3) { runNextFrame(busyFrameNanos) }

    assertThat(beforeCancelling + afterCancelling).containsExactly(0, 0, 0, 0, 5)
  }

  @Test
  fun framesBusyPastEveryVsyncPreMountBeforeTheirTraversalWhereTheThreadClockCannotTell() {
    threadCpuClockCanTell = false
    queuePreMountItems(count = 100)

    val executed = List(4) { runNextFrame(10 * MILLISECOND_NANOS) }

    assertThat(executed).containsExactly(0, 0, 5, 5)
  }

  @Test
  fun aFrameThatPreMountedEverythingBeforeItsTraversalStillMeasuresItsSleep() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    val frames = (0 until 3).map { frame -> FIRST_FRAME_NANOS + frame * SIXTY_HERTZ_FRAME_NANOS }
    queuePreMountItems(count = 9)
    runFrame(frames[0], MILLISECOND_NANOS, renderThreadReadyAtNanos = frames[1])
    runBetweenFrames()

    assertThat(runFrame(frames[1], MILLISECOND_NANOS, renderThreadReadyAtNanos = frames[2]))
        .isEqualTo(9)
    runBetweenFrames()
    queuePreMountItems(count = 9)

    assertThat(runFrame(frames[2], MILLISECOND_NANOS)).isEqualTo(9)
  }

  @Test
  fun aFrameAfterVsyncsWithNoFrameCallbackLeavesItsTraversalAlone() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    val frames = (0 until 2).map { frame -> FIRST_FRAME_NANOS + frame * SIXTY_HERTZ_FRAME_NANOS }
    queuePreMountItems(count = 9)
    runFrame(frames[0], MILLISECOND_NANOS, renderThreadReadyAtNanos = frames[1])
    runBetweenFrames()
    runFrame(
        frames[1],
        MILLISECOND_NANOS,
        renderThreadReadyAtNanos = frames[1] + SIXTY_HERTZ_FRAME_NANOS,
    )
    runBetweenFrames()

    // With nothing left to mount, the frame callback stops re-arming, and the next burst's first
    // frame comes ten vsyncs later: the sleep measured before them says nothing about its frame.
    queuePreMountItems(count = 9)

    assertThat(runFrame(frames[1] + 11 * SIXTY_HERTZ_FRAME_NANOS, MILLISECOND_NANOS)).isZero()
  }

  @Test
  fun framesThatKeepWaitingQueueNothingOnceTheItemsRunOut() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    // A real clock moves between any two reads.
    systemClock
        .`when`<Long> { SystemClock.nanoTime() }
        .thenAnswer {
          nowNanos += MICROSECOND_NANOS
          nowNanos
        }
    val frames = (0 until 3).map { frame -> FIRST_FRAME_NANOS + frame * SIXTY_HERTZ_FRAME_NANOS }
    queuePreMountItems(count = 9)
    runFrame(frames[0], MILLISECOND_NANOS, renderThreadReadyAtNanos = frames[1])
    runBetweenFrames()
    runFrame(frames[1], MILLISECOND_NANOS, renderThreadReadyAtNanos = frames[2])
    runBetweenFrames()

    runFrame(
        frames[2],
        MILLISECOND_NANOS,
        renderThreadReadyAtNanos = frames[2] + SIXTY_HERTZ_FRAME_NANOS,
    )

    assertThat(shadowOf(Looper.getMainLooper()).isIdle).isTrue()
  }

  @Test
  fun aThreadClockThatCannotTellLeavesTheNextTraversalAlone() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)
    threadCpuClockCanTell = false
    val secondFrameNanos = FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 20 * MILLISECOND_NANOS)
    runBetweenFrames()

    assertThat(runFrame(secondFrameNanos + SIXTY_HERTZ_FRAME_NANOS, MILLISECOND_NANOS)).isZero()
  }

  @Test
  fun cancellingDropsTheTimeBeforeTheNextTraversal() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)
    val secondFrameNanos = FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS
    runFrame(FIRST_FRAME_NANOS, MILLISECOND_NANOS, renderThreadReadyAtNanos = secondFrameNanos)
    runBetweenFrames()

    preMountItemsBetweenFrames.cancel()

    assertThat(runFrame(secondFrameNanos, MILLISECOND_NANOS)).isZero()
  }

  @Test
  fun beforeTheTraversalPreMountingTakesAtMostHalfAFrame() {
    queuePreMountItems(count = 60)
    val nextFrameNanos = FIRST_FRAME_NANOS + 3 * ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS
    runFrame(FIRST_FRAME_NANOS, MILLISECOND_NANOS, renderThreadReadyAtNanos = nextFrameNanos)
    runBetweenFrames()

    // Half of a 120 Hz frame is 4.17 ms: items start at 0 to 4 ms, though the draw slept 24 ms.
    assertThat(runFrame(nextFrameNanos, MILLISECOND_NANOS)).isEqualTo(5)
  }

  @Test
  fun beforeTheTraversalPreMountingStopsAtHalfOfAThirtyHertzFrame() {
    // The display last reported 24 Hz, where half a frame is 20.83 ms.
    displayFrameIntervalNanos = SECOND_NANOS / 24
    queuePreMountItems(count = 60)
    val nextFrameNanos = FIRST_FRAME_NANOS + SECOND_NANOS / 24
    runFrame(FIRST_FRAME_NANOS, MILLISECOND_NANOS, renderThreadReadyAtNanos = nextFrameNanos)
    runBetweenFrames()

    // Half of a 30 Hz frame is 16.67 ms: items start at 0 to 16 ms.
    assertThat(runFrame(nextFrameNanos, MILLISECOND_NANOS)).isEqualTo(17)
  }

  @Test
  fun aFrameThatLeftTimeBeforeTheNextVsyncLeavesTheNextTraversalAlone() {
    displayFrameIntervalNanos = SIXTY_HERTZ_FRAME_NANOS
    queuePreMountItems(count = 60)

    // The UI thread is off the CPU for 3 ms after the callbacks, preempted or waiting on a binder
    // call rather than on the render thread, and the frame still leaves time before the next vsync.
    runFrame(
        FIRST_FRAME_NANOS,
        frameWorkNanos = 0L,
        renderThreadReadyAtNanos = FIRST_FRAME_NANOS + 3 * MILLISECOND_NANOS,
    )
    runBetweenFrames()

    assertThat(runFrame(FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS, MILLISECOND_NANOS)).isZero()
  }

  @Test
  fun cancellingStopsEverySliceStillQueued() {
    queuePreMountItems(count = 20)
    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    shadowOf(Looper.getMainLooper()).runOneTask()
    val executedBeforeCancelling = executedItems

    preMountItemsBetweenFrames.cancel()

    assertThat(runBetweenFrames()).isZero()
    assertThat(executedBeforeCancelling).isEqualTo(2)
  }

  @Test
  fun aFrameWithItemsLeftAsksForTheNextFrameInterval() {
    var requests = 0
    preMountItemsBetweenFrames =
        PreMountItemsBetweenFrames(
            dispatcher,
            object : PreMountItemsBetweenFrames.FrameIntervalSource {
              override fun frameIntervalNanos(): Long = SIXTY_HERTZ_FRAME_NANOS

              override fun requestNextFrameInterval() {
                requests++
              }
            },
            { threadCpuNanos },
            { isMountingAllowed },
            uiThreadHandler,
            { exception -> handledExceptions.add(exception) },
        )
    queuePreMountItems(count = 1)

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()
    runFrame(FIRST_FRAME_NANOS + SIXTY_HERTZ_FRAME_NANOS, frameWorkNanos = 0L)

    // The frame after the last item asks the source for nothing.
    assertThat(requests).isEqualTo(1)
  }

  @Test
  fun queuesNothingWithoutItemsToPreMount() {
    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)

    assertThat(shadowOf(Looper.getMainLooper()).isIdle).isTrue()
  }

  @Test
  fun aFailingItemReachesTheExceptionHandlerAndEndsTheSlices() {
    val failure = IllegalStateException("pre-mount failed")
    queuePreMountItems(count = 20) { index ->
      if (index == 3) {
        throw failure
      }
    }

    runFrame(FIRST_FRAME_NANOS, frameWorkNanos = 0L)
    runBetweenFrames()

    assertThat(handledExceptions).containsExactly(failure)
    assertThat(executedItems).isEqualTo(3)
  }

  private companion object {
    const val SURFACE_ID: Int = 1
    const val MICROSECOND_NANOS: Long = 1_000L
    const val MILLISECOND_NANOS: Long = 1_000_000L
    const val SECOND_NANOS: Long = 1_000_000_000L
    const val FIRST_FRAME_NANOS: Long = SECOND_NANOS
    const val SIXTY_HERTZ_FRAME_NANOS: Long = SECOND_NANOS / 60
    const val ONE_HUNDRED_TWENTY_HERTZ_FRAME_NANOS: Long = SECOND_NANOS / 120
    const val MAX_TASKS_BETWEEN_FRAMES: Int = 1_000
  }
}
