/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import com.facebook.react.bridge.ReactMarker.FabricMarkerListener
import com.facebook.react.bridge.ReactMarkerConstants
import kotlin.jvm.JvmField

public class DevToolsReactPerfLogger : FabricMarkerListener {

  private val fabricCommitMarkers = mutableMapOf<Int, FabricCommitPoint>()
  private val devToolsReactPerfLoggerListeners = mutableListOf<DevToolsReactPerfLoggerListener>()

  public fun interface DevToolsReactPerfLoggerListener {
    public fun onFabricCommitEnd(commitPoint: FabricCommitPoint)
  }

  internal class FabricCommitPointData(val timeStamp: Long, val counter: Int)

  public class FabricCommitPoint internal constructor(commitNumber: Int) {
    public val commitNumber: Long = commitNumber.toLong()
    private val points = mutableMapOf<ReactMarkerConstants, FabricCommitPointData>()

    internal fun addPoint(key: ReactMarkerConstants, data: FabricCommitPointData) {
      points[key] = data
    }

    private fun getTimestamp(marker: ReactMarkerConstants): Long {
      val data = points[marker]
      return data?.timeStamp ?: -1
    }

    private fun getCounter(marker: ReactMarkerConstants): Int = points[marker]?.counter ?: 0

    public val commitStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_COMMIT_START)

    public val commitEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_COMMIT_END)

    public val finishTransactionStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_START)

    public val finishTransactionEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_END)

    public val diffStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_DIFF_START)

    public val diffEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_DIFF_END)

    public val layoutStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_LAYOUT_START)

    public val layoutEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_LAYOUT_END)

    public val affectedLayoutNodesCount: Int
      get() = getCounter(ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES)

    public val affectedLayoutNodesCountTime: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES)

    public val batchExecutionStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START)

    public val batchExecutionEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END)

    public val updateUIMainThreadStart: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START)

    public val updateUIMainThreadEnd: Long
      get() = getTimestamp(ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END)

    public val commitDuration: Long
      // Duration calculations
      get() = commitEnd - commitStart

    public val layoutDuration: Long
      get() = layoutEnd - layoutStart

    public val diffDuration: Long
      get() = diffEnd - diffStart

    public val transactionEndDuration: Long
      get() = finishTransactionEnd - finishTransactionStart

    public val batchExecutionDuration: Long
      get() = batchExecutionEnd - batchExecutionStart

    override fun toString(): String {
      return "FabricCommitPoint{mCommitNumber=$commitNumber, mPoints=$points}"
    }
  }

  public fun addDevToolsReactPerfLoggerListener(listener: DevToolsReactPerfLoggerListener): Unit {
    devToolsReactPerfLoggerListeners.add(listener)
  }

  public fun removeDevToolsReactPerfLoggerListener(
      listener: DevToolsReactPerfLoggerListener
  ): Unit {
    devToolsReactPerfLoggerListeners.remove(listener)
  }

  override fun logFabricMarker(
      name: ReactMarkerConstants,
      tag: String?,
      instanceKey: Int,
      timestamp: Long,
  ) {
    logFabricMarker(name, tag, instanceKey, timestamp, 0)
  }

  override fun logFabricMarker(
      name: ReactMarkerConstants,
      tag: String?,
      instanceKey: Int,
      timestamp: Long,
      counter: Int,
  ) {
    if (isFabricCommitMarker(name)) {
      var commitPoint = fabricCommitMarkers[instanceKey]
      if (commitPoint == null) {
        commitPoint = FabricCommitPoint(instanceKey)
        fabricCommitMarkers[instanceKey] = commitPoint
      }
      commitPoint.addPoint(name, FabricCommitPointData(timestamp, counter))

      if (
          (name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END ||
              name == ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END) && timestamp > 0
      ) {
        onFabricCommitEnd(commitPoint)
        fabricCommitMarkers.remove(instanceKey)
      }
    }
  }

  private fun onFabricCommitEnd(commitPoint: FabricCommitPoint) {
    for (listener in devToolsReactPerfLoggerListeners) {
      listener.onFabricCommitEnd(commitPoint)
    }
  }

  private companion object {
    @JvmField internal val streamingCommitStats: LongStreamingStats = LongStreamingStats()

    @JvmField internal val streamingLayoutStats: LongStreamingStats = LongStreamingStats()

    @JvmField internal val streamingDiffStats: LongStreamingStats = LongStreamingStats()

    @JvmField internal val streamingTransactionEndStats: LongStreamingStats = LongStreamingStats()

    @JvmField internal val streamingBatchExecutionStats: LongStreamingStats = LongStreamingStats()

    private fun isFabricCommitMarker(name: ReactMarkerConstants): Boolean =
        name == ReactMarkerConstants.FABRIC_COMMIT_START ||
            name == ReactMarkerConstants.FABRIC_COMMIT_END ||
            name == ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_START ||
            name == ReactMarkerConstants.FABRIC_FINISH_TRANSACTION_END ||
            name == ReactMarkerConstants.FABRIC_DIFF_START ||
            name == ReactMarkerConstants.FABRIC_DIFF_END ||
            name == ReactMarkerConstants.FABRIC_LAYOUT_START ||
            name == ReactMarkerConstants.FABRIC_LAYOUT_END ||
            name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_START ||
            name == ReactMarkerConstants.FABRIC_BATCH_EXECUTION_END ||
            name == ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_START ||
            name == ReactMarkerConstants.FABRIC_UPDATE_UI_MAIN_THREAD_END ||
            name == ReactMarkerConstants.FABRIC_LAYOUT_AFFECTED_NODES
  }
}
