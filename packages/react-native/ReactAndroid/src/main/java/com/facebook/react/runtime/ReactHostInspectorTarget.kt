/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.runtime

import com.facebook.jni.HybridData
import com.facebook.proguard.annotations.DoNotStripAny
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.common.annotations.FrameworkAPI
import com.facebook.react.common.annotations.UnstableReactNativeAPI
import com.facebook.react.devsupport.inspector.FrameTimingSequence
import com.facebook.react.devsupport.inspector.TracingState
import com.facebook.react.devsupport.inspector.TracingStateListener
import com.facebook.react.devsupport.perfmonitor.PerfMonitorInspectorTarget
import com.facebook.react.devsupport.perfmonitor.PerfMonitorUpdateListener
import com.facebook.soloader.SoLoader
import java.io.Closeable
import java.util.concurrent.Executor

@DoNotStripAny
@UnstableReactNativeAPI
@OptIn(FrameworkAPI::class)
internal class ReactHostInspectorTarget(reactHostImpl: ReactHostImpl) :
    PerfMonitorInspectorTarget, Closeable {
  // fbjni looks for the exact name "mHybridData":
  // https://github.com/facebookincubator/fbjni/blob/5587a7fd2b191656be9391a3832ce04c034009a5/cxx/fbjni/detail/Hybrid.h#L310
  @Suppress("NoHungarianNotation")
  private val mHybridData: HybridData = initHybrid(reactHostImpl, UIThreadConditionalSyncExecutor())

  private val perfMonitorListeners = mutableSetOf<PerfMonitorUpdateListener>()

  private external fun initHybrid(reactHostImpl: ReactHostImpl, executor: Executor): HybridData

  external fun sendDebuggerResumeCommand()

  external fun startBackgroundTrace(): Boolean

  external fun stopAndMaybeEmitBackgroundTrace(): Boolean

  external fun stopTracing()

  external override fun getTracingState(): TracingState

  external fun registerTracingStateListener(listener: TracingStateListener): Long

  external fun unregisterTracingStateListener(subscriptionId: Long)

  external fun recordFrameTimings(frameTimingSequence: FrameTimingSequence)

  override fun addPerfMonitorListener(listener: PerfMonitorUpdateListener) {
    perfMonitorListeners.add(listener)
    registerTracingStateListener { state, _ -> listener.onRecordingStateChanged(state) }
  }

  override fun pauseAndAnalyzeBackgroundTrace(): Boolean {
    return stopAndMaybeEmitBackgroundTrace()
  }

  override fun resumeBackgroundTrace() {
    startBackgroundTrace()
  }

  override fun stopBackgroundTrace() {
    stopTracing()
  }

  fun handleNativePerfIssueAdded(
      name: String,
  ) {
    perfMonitorListeners.forEach { listener -> listener.onPerfIssueAdded(name) }
  }

  override fun close() {
    mHybridData.resetNative()
  }

  fun isValid(): Boolean {
    return mHybridData.isValid()
  }

  private companion object {
    init {
      SoLoader.loadLibrary("rninstance")
    }
  }

  /**
   * An [java.util.concurrent.Executor] that runs tasks on the UI thread (immediately if already on
   * that thread).
   */
  private class UIThreadConditionalSyncExecutor : Executor {
    override fun execute(command: Runnable) {
      if (UiThreadUtil.isOnUiThread()) {
        // If we're already on the main thread, execute the command immediately
        command.run()
      } else {
        // Otherwise, post it on the main thread handler
        UiThreadUtil.runOnUiThread(command)
      }
    }
  }
}
