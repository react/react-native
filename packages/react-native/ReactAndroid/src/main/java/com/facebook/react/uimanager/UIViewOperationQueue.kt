/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.Callback
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger

/**
 * This class acts as a buffer for command executed on [NativeViewHierarchyManager]. It expose
 * similar methods as mentioned classes but instead of executing commands immediately it enqueues
 * those operations in a queue that is then flushed from [UIManagerModule] once JS batch of ui
 * operations is finished. This is to make sure that we execute all the JS operation coming from a
 * single batch a single loop of the main (UI) android looper.
 *
 * @deprecated This class is stubbed out and will be removed in a future release.
 *
 * TODO(7135923): Pooling of operation objects TODO(5694019): Consider a better data structure for
 *   operations queue to save on allocations
 */
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
public class UIViewOperationQueue(
    reactContext: ReactApplicationContext,
    minTimeLeftInFrameForNonBatchedOperationMs: Int,
) {

  /** A mutation or animation operation on the view hierarchy. */
  public interface UIOperation {
    /** Executes the UI operation. */
    public fun execute()
  }

  public companion object {
    /** Default minimum time left in frame for non-batched operations, in milliseconds. */
    public const val DEFAULT_MIN_TIME_LEFT_IN_FRAME_FOR_NONBATCHED_OPERATION_MS: Int = 8

    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "UIViewOperationQueue",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }

  /** Profiles the next batch of UI operations. */
  public fun profileNextBatch() {}

  /** Returns profiled batch performance counters. */
  public fun getProfiledBatchPerfCounters(): Map<String, Long> = HashMap()

  /** Returns whether the operation queue is empty. */
  public fun isEmpty(): Boolean = true

  /** Adds a root view with the given tag. */
  public fun addRootView(tag: Int, rootView: View) {}

  /** Enqueues a UI operation for execution. */
  protected fun enqueueUIOperation(operation: UIOperation) {}

  /** Enqueues removal of a root view with the given tag. */
  public fun enqueueRemoveRootView(rootViewTag: Int) {}

  /** Enqueues setting the JS responder for the given tag. */
  public fun enqueueSetJSResponder(tag: Int, initialTag: Int, blockNativeResponder: Boolean) {}

  /** Enqueues clearing the JS responder. */
  public fun enqueueClearJSResponder() {}

  /**
   * Enqueues dispatching a command with an integer command ID.
   *
   * @deprecated Use [enqueueDispatchCommand] with a String commandId instead.
   */
  @Deprecated("Use enqueueDispatchCommand with a String commandId instead")
  public fun enqueueDispatchCommand(reactTag: Int, commandId: Int, commandArgs: ReadableArray?) {}

  /** Enqueues dispatching a command with a string command ID. */
  public fun enqueueDispatchCommand(
      reactTag: Int,
      commandId: String,
      commandArgs: ReadableArray?,
  ) {}

  /** Enqueues updating extra data for the given react tag. */
  public fun enqueueUpdateExtraData(reactTag: Int, extraData: Any?) {}

  /** Enqueues creating a view with the given properties. */
  public fun enqueueCreateView(
      themedContext: ThemedReactContext,
      viewReactTag: Int,
      viewClassName: String,
      initialProps: ReactStylesDiffMap?,
  ) {}

  /** Enqueues updating the instance handle for the given react tag. */
  public fun enqueueUpdateInstanceHandle(reactTag: Int, instanceHandle: Long) {}

  /** Enqueues updating properties for the given react tag. */
  public fun enqueueUpdateProperties(reactTag: Int, className: String, props: ReactStylesDiffMap) {}

  /** Enqueues measuring the view with the given react tag. */
  public fun enqueueMeasure(reactTag: Int, callback: Callback) {}

  /** Enqueues measuring the view in window coordinates with the given react tag. */
  public fun enqueueMeasureInWindow(reactTag: Int, callback: Callback) {}

  /** Enqueues finding the target view for a touch at the given coordinates. */
  public fun enqueueFindTargetForTouch(
      reactTag: Int,
      targetX: Float,
      targetY: Float,
      callback: Callback,
  ) {}

  /** Enqueues sending an accessibility event for the given tag. */
  public fun enqueueSendAccessibilityEvent(tag: Int, eventType: Int) {}

  /** Enqueues a UI block for execution. */
  @Suppress("DEPRECATION") public fun enqueueUIBlock(block: UIBlock) {}

  /** Prepends a UI block for execution before existing queued operations. */
  @Suppress("DEPRECATION") public fun prependUIBlock(block: UIBlock) {}

  /** Dispatches view updates for the given batch. */
  public fun dispatchViewUpdates(batchId: Int, commitStartTime: Long, layoutTime: Long) {}

  /** Resumes the frame callback. */
  internal fun resumeFrameCallback() {}

  /** Pauses the frame callback. */
  internal fun pauseFrameCallback() {}
}
