/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

import kotlin.math.sqrt
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class GradientStopsTest {
  @Test
  fun emptyGradientHasNoStops() {
    assertEquals(emptyList(), GradientStops.resolve(emptyList(), ANDROID_EPSILON))
  }

  @Test
  fun singleColorDefaultsToStart() {
    assertEquals(listOf(original(0f, 0)), resolve(colors(null)))
  }

  @Test
  fun positionedColorsKeepTheirInputReferences() {
    assertEquals(
        listOf(original(0f, 0), original(.42f, 1)),
        resolve(colors(0f, .42f)),
    )
  }

  @Test
  fun missingEndpointsDefaultToZeroAndOne() {
    assertEquals(
        listOf(original(0f, 0), original(.3f, 1), original(1f, 2)),
        resolve(colors(null, .3f, null)),
    )
  }

  @Test
  fun allUnpositionedColorsAreEvenlySpaced() {
    assertEquals(
        listOf(original(0f, 0), original(1f / 3f, 1), original(2f / 3f, 2), original(1f, 3)),
        resolve(colors(null, null, null, null)),
    )
  }

  @Test
  fun decreasingPositionsUseTheLargestPreviousPosition() {
    assertEquals(
        listOf(0f, .3f, .3f, .6f, .6f),
        resolve(colors(null, .3f, .2f, .6f, .5f)).map { it.position.toFloat() },
    )
  }

  @Test
  fun positionsOutsideTheGradientArePreserved() {
    assertEquals(
        listOf(-1f, 0f, 1f, 2f),
        resolve(colors(-1f, null, 1f, 2f)).map { it.position.toFloat() },
    )
    assertEquals(listOf(2f, 2f), resolve(colors(2f, null)).map { it.position.toFloat() })
  }

  @Test
  fun eachUnpositionedRunUsesItsOwnAdjacentStops() {
    assertEquals(
        listOf(0f, .2f, .5f, .8f, .9f, 1f),
        resolve(colors(0f, .2f, null, .8f, null, 1f)).map { it.position.toFloat() },
    )
  }

  @Test
  fun centeredHintDoesNotAddAnInterpolationStop() {
    assertEquals(
        listOf(original(0f, 0), original(1f, 2)),
        resolve(listOf(color(0f), hint(.5f), color(1f))),
    )
  }

  @Test
  fun hintInCollapsedIntervalIsRemovedBeforeEndpointReplacement() {
    assertEquals(
        listOf(original(.3f, 0), original(.3f, 2)),
        resolve(listOf(color(.3f), hint(.2f), color(.1f))),
    )
  }

  @Test
  fun hintAtLeftEndpointReusesRightColor() {
    assertEquals(
        listOf(original(0f, 0), original(0f, 2), original(1f, 2)),
        resolve(listOf(color(0f), hint(0f), color(1f))),
    )
  }

  @Test
  fun hintAtRightEndpointReusesLeftColor() {
    assertEquals(
        listOf(original(0f, 0), original(1f, 0), original(1f, 2)),
        resolve(listOf(color(0f), hint(1f), color(1f))),
    )
  }

  @Test
  fun platformTolerancePreservesNearCenteredHintBehavior() {
    val inputs = listOf(color(0f), hint(.502f), color(1f))
    assertEquals(11, resolve(inputs).size)
    assertEquals(2, GradientStops.resolve(inputs, APPLE_EPSILON).size)
  }

  @Test
  fun platformTolerancePreservesNearEndpointHintBehavior() {
    val inputs = listOf(color(0f), hint(.002f), color(1f))
    assertEquals(11, resolve(inputs).size)
    assertEquals(
        listOf(original(0f, 0), original(.002f, 2), original(1f, 2)),
        GradientStops.resolve(inputs, APPLE_EPSILON),
    )
  }

  @Test
  fun leftHintUsesNineSamplesAndTheExpectedPowerCurve() {
    val resolved = resolve(listOf(color(0f), hint(.25f), color(1f)))
    assertEquals(11, resolved.size)
    assertEquals(original(0f, 0), resolved.first())
    assertEquals(original(1f, 2), resolved.last())
    val samples = resolved.subList(1, 10)
    val expectedPositions =
        listOf(
            .083333336f,
            .16666667f,
            .25f,
            .30769232f,
            .36538464f,
            .42307693f,
            .48076925f,
            .53846157f,
            .59615386f,
        )
    assertEquals(expectedPositions, samples.map { it.position.toFloat() })
    for (sample in samples) {
      assertEquals(0, sample.leftColorIndex)
      assertEquals(2, sample.rightColorIndex)
      // A quarter-position hint has exponent 1/2; Float logarithm rounding is retained.
      assertEquals(sqrt(sample.position.toDouble()), sample.weight, absoluteTolerance = 1e-7)
    }
  }

  @Test
  fun rightHintUsesNineSamplesAndEqualMixAtTheHint() {
    val resolved = resolve(listOf(color(0f), hint(.75f), color(1f)))
    val samples = resolved.subList(1, 10)
    assertEquals(
        listOf(
            .40384617f,
            .4615385f,
            .5192308f,
            .5769231f,
            .6346154f,
            .6923077f,
            .75f,
            .8333333f,
            .9166667f,
        ),
        samples.map { it.position.toFloat() },
    )
    assertEquals(.5, samples[6].weight, absoluteTolerance = 1e-7)
    assertTrue(samples.all { it.leftColorIndex == 0 && it.rightColorIndex == 2 })
    assertTrue(samples.all { it.weight.isFinite() && it.weight in 0.0..1.0 })
    assertTrue(samples.zipWithNext().all { (left, right) -> left.weight < right.weight })
  }

  @Test
  fun appleLogarithmKeepsDoublePrecision() {
    val inputs = listOf(color(0f), hint(.25f), color(1f))
    val apple = GradientStops.resolve(inputs, APPLE_EPSILON, useDoublePrecision = true)
    val android = resolve(inputs)

    assertEquals(.5, apple[3].weight)
    assertTrue(android[3].weight != apple[3].weight)
    for (sample in apple.subList(1, 10)) {
      assertEquals(sqrt(sample.position.toDouble()), sample.weight, absoluteTolerance = 1e-15)
    }
  }

  @Test
  fun appleUnpositionedStopsKeepDoublePrecision() {
    val inputs = colors(null, null, null, null)
    val apple = GradientStops.resolve(inputs, APPLE_EPSILON, useDoublePrecision = true)

    assertEquals(listOf(0.0, 1.0 / 3.0, 2.0 / 3.0, 1.0), apple.map { it.position })
    assertTrue(apple[1].position != resolve(inputs)[1].position)
  }

  @Test
  fun applePointDivisionDoesNotRoundAcrossTheCenteredHintThreshold() {
    // Native point positions use CGFloat division: 100.5 points / 200 points.
    // Rounding that position to Float changes whether the hint falls inside Apple's tolerance.
    val inputs =
        listOf(
            GradientStopInput(0.0, true),
            GradientStopInput(100.5 / 200.0, false),
            GradientStopInput(1.0, true),
        )

    assertEquals(11, GradientStops.resolve(inputs, APPLE_EPSILON, useDoublePrecision = true).size)
    assertEquals(2, GradientStops.resolve(inputs, APPLE_EPSILON).size)
  }

  @Test
  fun appleSamplesRetainDoublePositionsWithNativeFloatFractions() {
    val inputs = listOf(color(0f), hint(.25f), color(1f))
    val apple = GradientStops.resolve(inputs, APPLE_EPSILON, useDoublePrecision = true)

    assertEquals(.25 * (1f / 3f).toDouble(), apple[1].position)
    assertEquals(.25 + .75 * (6f / 13f).toDouble(), apple[9].position)
    assertTrue(apple[9].position != resolve(inputs)[9].position)
  }

  @Test
  fun multipleHintsReferenceOriginalColorsAfterInsertionsAndRemoval() {
    val inputs =
        listOf(color(0f), hint(.1f), color(.5f), hint(.6f), color(.7f), hint(.9f), color(1f))
    val resolved = resolve(inputs)
    assertEquals(22, resolved.size)
    assertEquals(original(.5f, 2), resolved[10])
    assertEquals(original(.7f, 4), resolved[11])
    assertEquals(original(1f, 6), resolved[21])
    assertTrue(resolved.subList(1, 10).all { it.leftColorIndex == 0 && it.rightColorIndex == 2 })
    assertTrue(resolved.subList(12, 21).all { it.leftColorIndex == 4 && it.rightColorIndex == 6 })
  }

  @Test
  fun repeatedResolutionDoesNotChangeTheInputs() {
    val inputs = listOf(color(null), hint(.2f), color(null), color(.8f), color(null))
    val snapshot = inputs.toList()
    assertEquals(resolve(inputs), resolve(inputs))
    assertEquals(snapshot, inputs)
  }

  private fun resolve(stops: List<GradientStopInput>): List<ResolvedGradientStop> =
      GradientStops.resolve(stops, ANDROID_EPSILON)

  private fun colors(vararg positions: Float?): List<GradientStopInput> = positions.map(::color)

  private fun color(position: Float?): GradientStopInput =
      GradientStopInput(position?.toDouble(), true)

  private fun hint(position: Float): GradientStopInput =
      GradientStopInput(position.toDouble(), false)

  private fun original(position: Float, colorIndex: Int): ResolvedGradientStop =
      ResolvedGradientStop(position.toDouble(), colorIndex, colorIndex, 0.0)

  private companion object {
    val ANDROID_EPSILON = .00001f.toDouble()
    val APPLE_EPSILON = .005f.toDouble()
  }
}
