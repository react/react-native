/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.common

import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import java.util.concurrent.TimeUnit
import kotlin.math.abs

/** Listens for the user shaking their phone. Allocation-less once it starts listening. */
public class ShakeDetector
@JvmOverloads
constructor(private val shakeListener: ShakeListener, private val minNumShakes: Int = 1) :
    SensorEventListener {

  private var accelerationX = 0f
  private var accelerationY = 0f
  private var accelerationZ = 0f

  public fun interface ShakeListener {
    public fun onShake()
  }

  private var sensorManager: SensorManager? = null
  private var lastTimestamp: Long = 0
  private var numShakes = 0
  private var lastShakeTimestamp: Long = 0

  /** Start listening for shakes. */
  public fun start(manager: SensorManager) {
    val accelerometer = manager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER) ?: return
    sensorManager = manager
    lastTimestamp = -1
    manager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI)
    lastShakeTimestamp = 0
    reset()
  }

  /** Stop listening for shakes. */
  public fun stop() {
    sensorManager?.unregisterListener(this)
    sensorManager = null
  }

  /** Reset all variables used to keep track of number of shakes recorded. */
  private fun reset() {
    numShakes = 0
    accelerationX = 0f
    accelerationY = 0f
    accelerationZ = 0f
  }

  /**
   * Determine if acceleration applied to sensor is large enough to count as a rage shake.
   *
   * @param a acceleration in x, y, or z applied to the sensor
   * @return true if the magnitude of the force exceeds the minimum required amount of force. false
   *   otherwise.
   */
  private fun atLeastRequiredForce(a: Float): Boolean = abs(a) > REQUIRED_FORCE

  /**
   * Save data about last shake
   *
   * @param timestamp (ns) of last sensor event
   */
  private fun recordShake(timestamp: Long) {
    lastShakeTimestamp = timestamp
    numShakes++
  }

  override fun onSensorChanged(sensorEvent: SensorEvent) {
    if (sensorEvent.timestamp - lastTimestamp < MIN_TIME_BETWEEN_SAMPLES_NS) {
      return
    }
    val ax = sensorEvent.values[0]
    val ay = sensorEvent.values[1]
    val az = sensorEvent.values[2] - SensorManager.GRAVITY_EARTH
    lastTimestamp = sensorEvent.timestamp
    when {
      atLeastRequiredForce(ax) && ax * accelerationX <= 0 -> {
        recordShake(sensorEvent.timestamp)
        accelerationX = ax
      }
      atLeastRequiredForce(ay) && ay * accelerationY <= 0 -> {
        recordShake(sensorEvent.timestamp)
        accelerationY = ay
      }
      atLeastRequiredForce(az) && az * accelerationZ <= 0 -> {
        recordShake(sensorEvent.timestamp)
        accelerationZ = az
      }
    }
    maybeDispatchShake(sensorEvent.timestamp)
  }

  override fun onAccuracyChanged(sensor: Sensor, i: Int): Unit = Unit

  private fun maybeDispatchShake(currentTimestamp: Long) {
    if (numShakes >= 8 * minNumShakes) {
      reset()
      shakeListener.onShake()
    }
    if (currentTimestamp - lastShakeTimestamp > SHAKING_WINDOW_NS) {
      reset()
    }
  }
}

// Collect sensor data in this interval (nanoseconds)
private val MIN_TIME_BETWEEN_SAMPLES_NS = TimeUnit.NANOSECONDS.convert(20, TimeUnit.MILLISECONDS)

// Number of nanoseconds to listen for and count shakes (nanoseconds)
private val SHAKING_WINDOW_NS = TimeUnit.NANOSECONDS.convert(3, TimeUnit.SECONDS).toFloat()

// Required force to constitute a rage shake. Need to multiply gravity by 1.33 because a rage
// shake in one direction should have more force than just the magnitude of free fall.
private const val REQUIRED_FORCE = SensorManager.GRAVITY_EARTH * 1.33f
