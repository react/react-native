/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner

/** Tests method used by [InterpolationAnimatedNode] to interpolate value of the input nodes. */
@RunWith(RobolectricTestRunner::class)
class NativeAnimatedInterpolationTest {

  @Test
  fun testSimpleOneToOneMapping() {
    val input = doubleArrayOf(0.0, 1.0)
    val output = doubleArrayOf(0.0, 1.0)
    assertThat(simpleInterpolation(0.0, input, output)).isEqualTo(0.0)
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(0.5)
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(0.8)
    assertThat(simpleInterpolation(1.0, input, output)).isEqualTo(1.0)
  }

  @Test
  fun testWiderOutputRange() {
    val input = doubleArrayOf(0.0, 1.0)
    val output = doubleArrayOf(100.0, 200.0)
    assertThat(simpleInterpolation(0.0, input, output)).isEqualTo(100.0)
    assertThat(simpleInterpolation(0.5, input, output)).isEqualTo(150.0)
    assertThat(simpleInterpolation(0.8, input, output)).isEqualTo(180.0)
    assertThat(simpleInterpolation(1.0, input, output)).isEqualTo(200.0)
  }

  @Test
  fun testWiderInputRange() {
    val input = doubleArrayOf(2000.0, 3000.0)
    val output = doubleArrayOf(1.0, 2.0)
    assertThat(simpleInterpolation(2000.0, input, output)).isEqualTo(1.0)
    assertThat(simpleInterpolation(2250.0, input, output)).isEqualTo(1.25)
    assertThat(simpleInterpolation(2800.0, input, output)).isEqualTo(1.8)
    assertThat(simpleInterpolation(3000.0, input, output)).isEqualTo(2.0)
  }

  @Test
  fun testManySegments() {
    val input = doubleArrayOf(-1.0, 1.0, 5.0)
    val output = doubleArrayOf(0.0, 10.0, 20.0)
    assertThat(simpleInterpolation(-1.0, input, output)).isEqualTo(0.0)
    assertThat(simpleInterpolation(0.0, input, output)).isEqualTo(5.0)
    assertThat(simpleInterpolation(1.0, input, output)).isEqualTo(10.0)
    assertThat(simpleInterpolation(2.0, input, output)).isEqualTo(12.5)
    assertThat(simpleInterpolation(5.0, input, output)).isEqualTo(20.0)
  }

  @Test
  fun testExtendExtrapolate() {
    val input = doubleArrayOf(10.0, 20.0)
    val output = doubleArrayOf(0.0, 1.0)
    assertThat(simpleInterpolation(30.0, input, output)).isEqualTo(2.0)
    assertThat(simpleInterpolation(5.0, input, output)).isEqualTo(-0.5)
  }

  @Test
  fun testClampExtrapolate() {
    val input = doubleArrayOf(10.0, 20.0)
    val output = doubleArrayOf(0.0, 1.0)
    assertThat(
            InterpolationAnimatedNode.interpolate(
                30.0,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
            )
        )
        .isEqualTo(1.0)
    assertThat(
            InterpolationAnimatedNode.interpolate(
                5.0,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_CLAMP,
            )
        )
        .isEqualTo(0.0)
  }

  @Test
  fun testIdentityExtrapolate() {
    val input = doubleArrayOf(10.0, 20.0)
    val output = doubleArrayOf(0.0, 1.0)
    assertThat(
            InterpolationAnimatedNode.interpolate(
                30.0,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
            )
        )
        .isEqualTo(30.0)
    assertThat(
            InterpolationAnimatedNode.interpolate(
                5.0,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
            )
        )
        .isEqualTo(5.0)
  }

  @Test
  fun testInterpolateColor() {
    val input = doubleArrayOf(0.0, 1.0)
    val output = intArrayOf(0xFF000000.toInt(), 0xFFFF0000.toInt())
    assertThat(InterpolationAnimatedNode.interpolateColor(0.0, input, output))
        .isEqualTo(0xFF000000.toInt())
    assertThat(InterpolationAnimatedNode.interpolateColor(0.5, input, output))
        .isEqualTo(0xFF7F0000.toInt())
  }

  @Test
  fun testInterpolateString() {
    val input = doubleArrayOf(0.0, 1.0)
    val output = arrayOf(
        doubleArrayOf(20.0, 20.0, 20.0, 80.0, 80.0, 80.0, 80.0, 20.0),
        doubleArrayOf(40.0, 40.0, 33.0, 60.0, 60.0, 60.0, 65.0, 40.0),
    )
    val pattern = "M20,20L20,80L80,80L80,20Z"
    assertThat(
            InterpolationAnimatedNode.interpolateString(
                pattern,
                0.0,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
            )
        )
        .isEqualTo("M20,20L20,80L80,80L80,20Z")
    assertThat(
            InterpolationAnimatedNode.interpolateString(
                pattern,
                0.5,
                input,
                output,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
                InterpolationAnimatedNode.EXTRAPOLATE_TYPE_IDENTITY,
            )
        )
        .isEqualTo("M30,30L26.5,70L70,70L72.5,30Z")
  }

  private fun simpleInterpolation(value: Double, input: DoubleArray, output: DoubleArray): Double =
      InterpolationAnimatedNode.interpolate(
          value,
          input,
          output,
          InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND,
          InterpolationAnimatedNode.EXTRAPOLATE_TYPE_EXTEND,
      )
}
