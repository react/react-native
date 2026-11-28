/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.ColorMatrix
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Tests for [FilterHelper]. */
@RunWith(RobolectricTestRunner::class)
class FilterHelperTest {

  @Test
  fun parseColorMatrixFilters_appliesFiltersInOrder() {
    val filters = JavaOnlyArray.of(JavaOnlyMap.of("invert", 1.0), JavaOnlyMap.of("sepia", 1.0))
    val matrix = ColorMatrix()
    checkNotNull(FilterHelper.parseColorMatrixFilters(filters)).getColorMatrix(matrix)

    // rgb(255, 0, 0) is rgb(0, 255, 255) after invert(1), then rgb(244, 218, 170) after sepia(1)
    assertThat(applyToOpaqueRed(matrix, 0)).isCloseTo(244.3f, within(0.5f))
    assertThat(applyToOpaqueRed(matrix, 1)).isCloseTo(217.8f, within(0.5f))
    assertThat(applyToOpaqueRed(matrix, 2)).isCloseTo(169.6f, within(0.5f))
  }

  private fun applyToOpaqueRed(matrix: ColorMatrix, channel: Int): Float {
    val row = channel * 5
    return matrix.array[row] * 255f + matrix.array[row + 3] * 255f + matrix.array[row + 4]
  }
}
