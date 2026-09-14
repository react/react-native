/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

import kotlin.test.Test
import kotlin.test.assertEquals

class ScrollSnapOffsetsTest {
  private val offsets = ScrollSnapOffsets(doubleArrayOf(20.0, 60.0, 100.0))

  @Test
  fun directionAndMidpointTies() {
    assertEquals(20.0, offsets.resolve(20.0, 39.0, 120.0, 0.0, true, true).targetOffset)
    assertEquals(60.0, offsets.resolve(20.0, 40.0, 120.0, 0.0, true, true).targetOffset)
    val forward = offsets.resolve(20.0, 21.0, 120.0, 0.01, true, true)
    assertEquals(60.0, forward.targetOffset)
    assertEquals(ScrollSnapDirection.FORWARD, forward.direction)
    val backward = offsets.resolve(100.0, 99.0, 120.0, -0.01, true, true)
    assertEquals(60.0, backward.targetOffset)
    assertEquals(ScrollSnapDirection.BACKWARD, backward.direction)
    assertEquals(60.0, offsets.resolve(20.0, 60.0, 120.0, 1.0, true, true).targetOffset)
  }

  @Test
  fun disabledBoundariesAllowFreeScrollingOnlyAfterCrossing() {
    assertEquals(20.0, offsets.resolve(30.0, 10.0, 120.0, -1.0, false, false).targetOffset)
    val freeStart = offsets.resolve(20.0, 10.0, 120.0, -1.0, false, false)
    assertEquals(10.0, freeStart.targetOffset)
    assertEquals(ScrollSnapDirection.NONE, freeStart.direction)
    assertEquals(100.0, offsets.resolve(90.0, 110.0, 120.0, 1.0, false, false).targetOffset)
    val freeEnd = offsets.resolve(100.0, 110.0, 120.0, 1.0, false, false)
    assertEquals(110.0, freeEnd.targetOffset)
    assertEquals(ScrollSnapDirection.NONE, freeEnd.direction)
  }

  @Test
  fun boundingDoesNotChangeThePointUsedForVelocityAdjustment() {
    val result =
        ScrollSnapOffsets(doubleArrayOf(20.0, 140.0)).resolve(0.0, 150.0, 120.0, -1.0, true, true)
    assertEquals(120.0, result.targetOffset)
    assertEquals(140.0, result.selectedOffset)
    assertEquals(ScrollSnapDirection.BACKWARD, result.direction)
    assertEquals(0.0, offsets.resolve(0.0, -50.0, 0.0, 0.0, true, true).targetOffset)
  }

  @Test
  fun fractionalDuplicateAndEmptyOffsets() {
    val fractional = ScrollSnapOffsets(doubleArrayOf(0.25, 0.25, 1.75))
    assertEquals(1.75, fractional.resolve(0.0, 1.0, 2.0, 0.0, true, true).targetOffset)
    assertEquals(0.25, fractional.resolve(0.0, 0.25, 2.0, -1.0, true, true).targetOffset)
    assertEquals(
        1.0,
        ScrollSnapOffsets(doubleArrayOf()).resolve(0.0, 1.0, 2.0, 1.0, true, true).targetOffset,
    )
  }

  @Test
  fun propertySnapshotPreservesOrderAndIgnoresLaterInputMutation() {
    val input = doubleArrayOf(100.0, 20.0, 60.0)
    val snapshot = ScrollSnapOffsets(input)
    input[0] = 0.0
    // The first property value is 100, not the sorted minimum of 20.
    assertEquals(100.0, snapshot.resolve(110.0, 50.0, 120.0, 0.0, false, true).targetOffset)
    assertEquals(60.0, snapshot.resolve(0.0, 50.0, 120.0, 0.0, true, true).targetOffset)
  }

  @Test
  fun integerListsRetainNativeMutationsAndWrappingArithmetic() {
    val input = mutableListOf(20, 60, 100)
    val retained = ScrollSnapOffsets.fromIntegerOffsets(input)
    input[1] = 90
    assertEquals(90.0, retained.resolve(0.0, 40.0, 300.0, 1.0, true, true).targetOffset)
    input.add(50)
    assertEquals(50.0, retained.resolve(0.0, 40.0, 300.0, 1.0, true, true).targetOffset)
    val extreme = ScrollSnapOffsets.fromIntegerOffsets(listOf(Int.MIN_VALUE, 20, 100))
    assertEquals(300.0, extreme.resolve(0.0, 150.0, 300.0, 0.0, true, true).targetOffset)
  }
}
