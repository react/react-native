/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager.drawable

import android.graphics.Bitmap
import org.assertj.core.api.Assertions.*
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.GraphicsMode

/** Tests for [BackgroundImageURLLoader.OrientedBitmap] */
@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
class BackgroundImageURLLoaderTest {
  private val bitmap = Bitmap.createBitmap(60, 40, Bitmap.Config.ARGB_8888)

  /**
   * Maps the first and the last pixel corner of the bitmap's first row into a 0..1 box of the
   * upright image.
   */
  private fun firstRowCorners(exifOrientation: Int, rotationAngle: Int = 0): List<Float> {
    val image = BackgroundImageURLLoader.OrientedBitmap(bitmap, exifOrientation, rotationAngle)
    val points = floatArrayOf(0f, 0f, bitmap.width.toFloat(), 0f)
    image.drawMatrix(1f, 1f).mapPoints(points)
    return points.map { Math.round(it * 100) / 100f }
  }

  @Test
  fun testKeepsSizeWithoutOrientation() {
    val image = BackgroundImageURLLoader.OrientedBitmap(bitmap, 1, 0)
    assertThat(image.width).isEqualTo(60f)
    assertThat(image.height).isEqualTo(40f)
    assertThat(firstRowCorners(1)).containsExactly(0f, 0f, 1f, 0f)
  }

  @Test
  fun testMirrorsAndRotatesWithoutSwappingAxes() {
    assertThat(firstRowCorners(2)).containsExactly(1f, 0f, 0f, 0f)
    assertThat(firstRowCorners(3, 180)).containsExactly(1f, 1f, 0f, 1f)
    assertThat(firstRowCorners(4)).containsExactly(0f, 1f, 1f, 1f)
  }

  @Test
  fun testSwapsAxesForQuarterTurns() {
    for (orientation in listOf(5 to 0, 6 to 90, 7 to 0, 8 to 270)) {
      val image =
          BackgroundImageURLLoader.OrientedBitmap(bitmap, orientation.first, orientation.second)
      assertThat(image.width).isEqualTo(40f)
      assertThat(image.height).isEqualTo(60f)
    }
    // The first row becomes the left, right, right, and left edge.
    assertThat(firstRowCorners(5)).containsExactly(0f, 0f, 0f, 1f)
    assertThat(firstRowCorners(6, 90)).containsExactly(1f, 0f, 1f, 1f)
    assertThat(firstRowCorners(7)).containsExactly(1f, 1f, 1f, 0f)
    assertThat(firstRowCorners(8, 270)).containsExactly(0f, 1f, 0f, 0f)
  }
}
