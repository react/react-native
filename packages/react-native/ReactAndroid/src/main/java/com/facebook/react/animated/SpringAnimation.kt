/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import com.facebook.react.bridge.ReadableMap
import kotlin.math.*

/**
 * Implementation of [AnimationDriver] providing support for spring animations. The implementation
 * has been copied from android implementation of Rebound library (see
 * [http://facebook.github.io/rebound/](http://facebook.github.io/rebound/))
 */
internal class SpringAnimation(config: ReadableMap) : AnimationDriver() {
  // storage for the current and prior physics state while integration is occurring
  private data class PhysicsState(var position: Double = 0.0, var velocity: Double = 0.0)

  private var lastTime: Long = 0
  private var springStarted = false
  // configuration
  private var springStiffness = 0.0
  private var springDamping = 0.0
  private var springMass = 0.0
  private var initialVelocity = 0.0
  private var overshootClampingEnabled = false
  // all physics simulation objects are final and reused in each processing pass
  private val currentState = PhysicsState()
  private var startValue = 0.0
  private var endValue = 0.0
  // thresholds for determining when the spring is at rest
  private var restSpeedThreshold = 0.0
  private var displacementFromRestThreshold = 0.0
  private var timeAccumulator = 0.0
  // for controlling loop
  private var iterations = 0
  private var currentLoop = 0
  private var originalValue = 0.0

  private val isAtRest: Boolean
    /**
     * check if the current state is at rest
     *
     * @return is the spring at rest
     */
    get() =
        (abs(currentState.velocity) <= restSpeedThreshold &&
            (getDisplacementDistanceForState(currentState) <= displacementFromRestThreshold ||
                springStiffness == 0.0))

  /* Check if the spring is overshooting beyond its target. */
  private val isOvershooting: Boolean
    get() =
        (springStiffness > 0 &&
            ((startValue < endValue && currentState.position > endValue) ||
                (startValue > endValue && currentState.position < endValue)))

  init {
    currentState.velocity = config.getDouble("initialVelocity")
    resetConfig(config)
  }

  override fun resetConfig(config: ReadableMap) {
    springStiffness = config.getDouble("stiffness")
    springDamping = config.getDouble("damping")
    springMass = config.getDouble("mass")
    initialVelocity = currentState.velocity
    endValue = config.getDouble("toValue")
    restSpeedThreshold = config.getDouble("restSpeedThreshold")
    displacementFromRestThreshold = config.getDouble("restDisplacementThreshold")
    overshootClampingEnabled = config.getBoolean("overshootClamping")
    iterations = if (config.hasKey("iterations")) config.getInt("iterations") else 1
    hasFinished = iterations == 0
    currentLoop = 0
    timeAccumulator = 0.0
    springStarted = false
  }

  override fun runAnimationStep(frameTimeNanos: Long) {
    val animatedValue = requireNotNull(animatedValue) { "Animated value should not be null" }
    val frameTimeMillis = frameTimeNanos / 1_000_000
    if (!springStarted) {
      if (currentLoop == 0) {
        originalValue = animatedValue.nodeValue
        currentLoop = 1
      }
      currentState.position = animatedValue.nodeValue
      startValue = currentState.position
      lastTime = frameTimeMillis
      timeAccumulator = 0.0
      springStarted = true
    }
    advance((frameTimeMillis - lastTime) / 1000.0)
    lastTime = frameTimeMillis
    animatedValue.nodeValue = currentState.position
    if (isAtRest) {
      if (iterations == -1 || currentLoop < iterations) { // looping animation, return to start
        springStarted = false
        animatedValue.nodeValue = originalValue
        currentLoop++
      } else { // animation has completed
        hasFinished = true
      }
    }
  }

  /**
   * get the displacement from rest for a given physics state
   *
   * @param state the state to measure from
   * @return the distance displaced by
   */
  private fun getDisplacementDistanceForState(state: PhysicsState): Double =
      abs(endValue - state.position)

  private fun advance(realDeltaTime: Double) {
    if (isAtRest) {
      return
    }

    // clamp the amount of realTime to simulate to avoid stuttering in the UI. We should be able
    // to catch up in a subsequent advance if necessary.
    var adjustedDeltaTime = realDeltaTime
    if (realDeltaTime > MAX_DELTA_TIME_SEC) {
      adjustedDeltaTime = MAX_DELTA_TIME_SEC
    }
    timeAccumulator += adjustedDeltaTime
    val c = springDamping
    val m = springMass
    val k = springStiffness
    val v0 = -initialVelocity
    val zeta = c / (2 * sqrt(k * m))
    val omega0 = sqrt(k / m)
    val omega1 = omega0 * sqrt(1.0 - zeta * zeta)
    val x0 = endValue - startValue
    val velocity: Double
    val position: Double
    val t = timeAccumulator
    if (zeta < 1) {
      // Under damped
      val envelope = exp(-zeta * omega0 * t)
      position =
          (endValue -
              envelope *
                  ((v0 + zeta * omega0 * x0) / omega1 * sin(omega1 * t) + x0 * cos(omega1 * t)))
      // This looks crazy -- it's actually just the derivative of the
      // oscillation function
      velocity =
          ((zeta *
              omega0 *
              envelope *
              (sin(omega1 * t) * (v0 + zeta * omega0 * x0) / omega1 + x0 * cos(omega1 * t))) -
              envelope *
                  (cos(omega1 * t) * (v0 + zeta * omega0 * x0) - omega1 * x0 * sin(omega1 * t)))
    } else {
      // Critically damped spring
      val envelope = exp(-omega0 * t)
      position = endValue - envelope * (x0 + (v0 + omega0 * x0) * t)
      velocity = envelope * (v0 * (t * omega0 - 1) + t * x0 * (omega0 * omega0))
    }
    currentState.position = position
    currentState.velocity = velocity

    // End the spring immediately if it is overshooting and overshoot clamping is enabled.
    // Also make sure that if the spring was considered within a resting threshold that it's now
    // snapped to its end value.
    if (isAtRest || (overshootClampingEnabled && isOvershooting)) {
      // Don't call setCurrentValue because that forces a call to onSpringUpdate
      if (springStiffness > 0) {
        startValue = endValue
        currentState.position = endValue
      } else {
        endValue = currentState.position
        startValue = endValue
      }
      currentState.velocity = 0.0
    }
  }

  companion object {
    // maximum amount of time to simulate per physics iteration in seconds (4 frames at 60 FPS)
    private const val MAX_DELTA_TIME_SEC = 0.064
  }
}
