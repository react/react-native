/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric

import java.util.PriorityQueue
import java.util.Queue
import kotlin.comparisons.reverseOrder

internal class LongStreamingStats {

  // TODO(T138627466): Calculate median value with better algorithm after Android API 24.
  private val minHeap: Queue<Long> = PriorityQueue(11)
  private val maxHeap: Queue<Long> = PriorityQueue(11, reverseOrder())
  var average: Double = 0.0
    private set

  private var len = 0
  var max: Long = 0L
    private set

  fun add(n: Long) {
    // To make medians more useful, we discard all zero values
    // This isn't perfect and certainly makes this a totally invalid median, but, alas...
    if (n != 0L) {
      if (minHeap.size == maxHeap.size) {
        maxHeap.offer(n)
        minHeap.offer(maxHeap.poll())
      } else {
        minHeap.offer(n)
        maxHeap.offer(minHeap.poll())
      }
    }

    len++
    average =
        if (len == 1) {
          n.toDouble()
        } else {
          (average / (len / (len - 1))) + (n / len)
        }

    max = (if (n > max) n else max)
  }

  val median: Double
    get() {
      if (minHeap.isEmpty() && maxHeap.isEmpty()) {
        return 0.0
      }
      val median =
          if (minHeap.size > maxHeap.size) {
            minHeap.peek()
          } else {
            ((minHeap.peek() ?: 0L) + (maxHeap.peek() ?: 0L)) / 2
          }
      return median.toDouble()
    }
}
