/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.shared

import kotlin.math.abs
import kotlin.math.ln
import kotlin.math.pow

/**
 * A gradient stop after the platform has converted its position to a fraction of the line length.
 */
public data class GradientStopInput(public val position: Double?, public val hasColor: Boolean)

/**
 * A resolved position and the original input colors to interpolate at that position.
 *
 * Equal color indices mean the platform should reuse that input color without interpolation.
 * Otherwise, [weight] is the contribution of [rightColorIndex], between zero and one. Colors stay
 * on the platform so that its color space, rounding, and rendering behavior are preserved.
 */
public data class ResolvedGradientStop(
    public val position: Double,
    public val leftColorIndex: Int,
    public val rightColorIndex: Int,
    public val weight: Double,
)

/** Pure CSS gradient stop position fix-up and transition hint calculations. */
public object GradientStops {
  /**
   * Resolves positions and expands each noncentral transition hint into nine interpolation stops.
   *
   * Input follows the parsed CSS gradient contract: endpoints have colors, and a transition hint is
   * a positioned stop without a color between two color stops. Positions may lie outside zero to
   * one. An empty input returns an empty result. The input is never modified.
   *
   * [epsilon] is the platform's existing absolute tolerance for equal distances. Keeping it
   * explicit preserves the established Android and Apple behavior near centered and endpoint hints.
   * [useDoublePrecision] preserves Apple's CGFloat (Double) arithmetic. Android uses Float
   * arithmetic, including the intermediate logarithm, and converts its positions at this boundary.
   */
  public fun resolve(
      stops: List<GradientStopInput>,
      epsilon: Double,
      useDoublePrecision: Boolean = false,
  ): List<ResolvedGradientStop> {
    if (stops.isEmpty()) {
      return emptyList()
    }

    val math = Arithmetic(useDoublePrecision)
    val positions = arrayOfNulls<Double>(stops.size)
    var maxPositionSoFar = math.round(stops[0].position ?: 0.0)
    var hasNullPositions = false

    // Set default endpoint positions and prevent specified positions from moving backwards.
    for (i in stops.indices) {
      val position =
          stops[i].position?.let(math::round)
              ?: when (i) {
                0 -> 0.0
                stops.lastIndex -> 1.0
                else -> null
              }
      if (position != null) {
        val fixedPosition = math.max(position, maxPositionSoFar)
        positions[i] = fixedPosition
        maxPositionSoFar = fixedPosition
      } else {
        hasNullPositions = true
      }
    }

    // Evenly distribute each run of unpositioned stops between its own surrounding positions.
    if (hasNullPositions) {
      var lastDefinedIndex = 0
      for (i in 1 until positions.size) {
        val endPosition = positions[i] ?: continue
        val startPosition = checkNotNull(positions[lastDefinedIndex])
        val unpositionedStops = i - lastDefinedIndex - 1
        if (unpositionedStops > 0) {
          val increment =
              math.divide(
                  math.subtract(endPosition, startPosition),
                  (unpositionedStops + 1).toDouble(),
              )
          for (j in 1..unpositionedStops) {
            positions[lastDefinedIndex + j] =
                math.add(startPosition, math.multiply(increment, j.toDouble()))
          }
        }
        lastDefinedIndex = i
      }
    }

    val resolved =
        stops.indices
            .map { i -> ResolvedGradientStop(checkNotNull(positions[i]), i, i, 0.0) }
            .toMutableList()
    var indexOffset = 0
    for (i in 1 until stops.lastIndex) {
      if (stops[i].hasColor) {
        continue
      }

      val index = i + indexOffset
      val left = resolved[index - 1]
      val right = resolved[index + 1]
      val position = resolved[index].position
      val leftDistance = math.subtract(position, left.position)
      val rightDistance = math.subtract(right.position, position)
      val totalDistance = math.subtract(right.position, left.position)

      if (math.equal(leftDistance, rightDistance, epsilon)) {
        resolved.removeAt(index)
        --indexOffset
        continue
      }
      if (math.equal(leftDistance, 0.0, epsilon)) {
        resolved[index] = right.copy(position = position)
        continue
      }
      if (math.equal(rightDistance, 0.0, epsilon)) {
        resolved[index] = left.copy(position = position)
        continue
      }

      // Use the same nine sample positions as the platform implementations, derived from Blink.
      val samples = ArrayList<Double>(9)
      if (leftDistance > rightDistance) {
        for (y in 0..6) {
          samples.add(math.sample(left.position, leftDistance, (7f + y) / 13f))
        }
        samples.add(math.sample(position, rightDistance, 1f / 3f))
        samples.add(math.sample(position, rightDistance, 2f / 3f))
      } else {
        samples.add(math.sample(left.position, leftDistance, 1f / 3f))
        samples.add(math.sample(left.position, leftDistance, 2f / 3f))
        for (y in 0..6) {
          samples.add(math.sample(position, rightDistance, y / 13f))
        }
      }

      val hintRelativeOffset = math.divide(leftDistance, totalDistance)
      val hintLogarithm = math.log(hintRelativeOffset)
      val logRatio = ln(0.5) / hintLogarithm
      val intermediateStops =
          samples.map { sample ->
            val pointRelativeOffset =
                math.divide(math.subtract(sample, left.position), totalDistance)
            ResolvedGradientStop(
                sample,
                left.leftColorIndex,
                right.rightColorIndex,
                pointRelativeOffset.pow(logRatio),
            )
          }
      resolved.removeAt(index)
      resolved.addAll(index, intermediateStops)
      indexOffset += 8
    }
    return resolved
  }

  /** Keeps every platform operation at its original precision without duplicating the algorithm. */
  private class Arithmetic(private val doublePrecision: Boolean) {
    fun round(value: Double): Double = if (doublePrecision) value else value.toFloat().toDouble()

    fun add(first: Double, second: Double): Double =
        if (doublePrecision) first + second else (first.toFloat() + second.toFloat()).toDouble()

    fun subtract(first: Double, second: Double): Double =
        if (doublePrecision) first - second else (first.toFloat() - second.toFloat()).toDouble()

    fun multiply(first: Double, second: Double): Double =
        if (doublePrecision) first * second else (first.toFloat() * second.toFloat()).toDouble()

    fun divide(first: Double, second: Double): Double =
        if (doublePrecision) first / second else (first.toFloat() / second.toFloat()).toDouble()

    fun max(first: Double, second: Double): Double =
        if (doublePrecision) {
          // Match std::max, including its behavior for NaN and signed zero.
          if (first < second) second else first
        } else {
          maxOf(first.toFloat(), second.toFloat()).toDouble()
        }

    fun log(value: Double): Double =
        if (doublePrecision) ln(value) else ln(value.toFloat()).toDouble()

    fun equal(first: Double, second: Double, epsilon: Double): Boolean =
        if (first.isNaN() || second.isNaN()) {
          first.isNaN() && second.isNaN()
        } else {
          abs(subtract(second, first)) < epsilon
        }

    fun sample(start: Double, distance: Double, fraction: Float): Double =
        // Both native implementations originally compute these sample fractions as Float.
        add(start, multiply(distance, fraction.toDouble()))
  }
}
