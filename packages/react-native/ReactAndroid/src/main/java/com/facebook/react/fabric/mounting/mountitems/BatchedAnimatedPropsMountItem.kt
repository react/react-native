/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.fabric.mounting.mountitems

import android.view.View
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.uimanager.ViewProps

/**
 * A [MountItem] that decodes a batched buffer of animated prop updates and applies them
 * synchronously. The buffer protocol encodes multiple per-view prop updates into compact int/double
 * arrays, which this mount item decodes into [JavaOnlyMap] props and applies via
 * [MountingManager.updatePropsSynchronously].
 */
internal class BatchedAnimatedPropsMountItem(
    private val intBuffer: IntArray,
    private val doubleBuffer: DoubleArray,
) : MountItem {

  override fun execute(mountingManager: MountingManager) {
    var intIdx = 0
    var doubleIdx = 0
    while (intIdx < intBuffer.size) {
      val command = intBuffer[intIdx++]
      if (command != CMD_START_OF_VIEW) {
        break
      }
      val viewTag = intBuffer[intIdx++]
      val props = JavaOnlyMap()

      while (intIdx < intBuffer.size) {
        val cmd = intBuffer[intIdx++]
        if (cmd == CMD_END_OF_VIEW) {
          break
        }

        when (cmd) {
          in CMD_OPACITY..CMD_SHADOW_RADIUS ->
              props.putDouble(commandToString(cmd), doubleBuffer[doubleIdx++])
          in CMD_BACKGROUND_COLOR..CMD_TINT_COLOR,
          in CMD_BORDER_COLOR..CMD_BORDER_END_COLOR ->
              props.putInt(commandToString(cmd), intBuffer[intIdx++])
          in CMD_BORDER_RADIUS..CMD_BORDER_END_END_RADIUS -> {
            // Border radius: value in doubleBuffer, unit in intBuffer
            val value = doubleBuffer[doubleIdx++]
            val unit = intBuffer[intIdx++]
            if (unit == CMD_UNIT_PX) {
              props.putDouble(commandToString(cmd), value)
            } else if (unit == CMD_UNIT_PERCENT) {
              props.putString(commandToString(cmd), "$value%")
            }
          }
          CMD_START_OF_TRANSFORM -> {
            val transform = JavaOnlyArray()
            while (intIdx < intBuffer.size) {
              val transformCmd = intBuffer[intIdx++]
              if (transformCmd == CMD_END_OF_TRANSFORM) {
                props.putArray(ViewProps.TRANSFORM, transform)
                break
              }
              val name = transformCommandToString(transformCmd)
              when (transformCmd) {
                in CMD_SCALE..CMD_SCALE_Y,
                CMD_PERSPECTIVE -> {
                  val entry = JavaOnlyMap()
                  entry.putDouble(name, doubleBuffer[doubleIdx++])
                  transform.pushMap(entry)
                }
                in CMD_TRANSLATE_X..CMD_TRANSLATE_Y -> {
                  val value = doubleBuffer[doubleIdx++]
                  val unitCmd = intBuffer[intIdx++]
                  val entry = JavaOnlyMap()
                  if (unitCmd == CMD_UNIT_PX) {
                    entry.putDouble(name, value)
                  } else {
                    entry.putString(name, "$value%")
                  }
                  transform.pushMap(entry)
                }
                in CMD_ROTATE..CMD_SKEW_Y -> {
                  val angle = doubleBuffer[doubleIdx++]
                  val unitCmd = intBuffer[intIdx++]
                  val unitStr = if (unitCmd == CMD_UNIT_DEG) "deg" else "rad"
                  val entry = JavaOnlyMap()
                  entry.putString(name, "$angle$unitStr")
                  transform.pushMap(entry)
                }
                CMD_MATRIX -> {
                  // matrix
                  val size = intBuffer[intIdx++]
                  val matrix = JavaOnlyArray()
                  for (m in 0 until size) {
                    matrix.pushDouble(doubleBuffer[doubleIdx++])
                  }
                  val entry = JavaOnlyMap()
                  entry.putArray(name, matrix)
                  transform.pushMap(entry)
                }
              }
            }
          }
        }
      }

      try {
        mountingManager.updatePropsSynchronously(viewTag, props)
      } catch (ex: Exception) {
        // Same surface-teardown race as in SynchronousMountItem.
      }
    }
  }

  override fun toString(): String {
    val sb = StringBuilder("BATCHED UPDATE PROPS ")
    var intIdx = 0
    var doubleIdx = 0
    try {
      while (intIdx < intBuffer.size) {
        if (intBuffer[intIdx++] != CMD_START_OF_VIEW) break
        val viewTag = intBuffer[intIdx++]
        sb.append('[').append(viewTag).append("]: {")
        var firstProp = true

        view@ while (true) {
          val cmd = intBuffer[intIdx++]
          if (cmd == CMD_END_OF_VIEW) break@view

          if (!firstProp) sb.append(", ")
          firstProp = false

          when (cmd) {
            in CMD_OPACITY..CMD_SHADOW_RADIUS ->
                sb.append(commandToString(cmd)).append('=').append(doubleBuffer[doubleIdx++])
            in CMD_BACKGROUND_COLOR..CMD_TINT_COLOR,
            in CMD_BORDER_COLOR..CMD_BORDER_END_COLOR ->
                sb.append(commandToString(cmd)).append('=').append(intBuffer[intIdx++])
            in CMD_BORDER_RADIUS..CMD_BORDER_END_END_RADIUS -> {
              val value = doubleBuffer[doubleIdx++]
              val unit = intBuffer[intIdx++]
              sb.append(commandToString(cmd)).append('=').append(value)
              if (unit == CMD_UNIT_PERCENT) sb.append('%')
            }
            CMD_START_OF_TRANSFORM -> {
              sb.append(ViewProps.TRANSFORM).append("=[")
              var firstEntry = true
              while (true) {
                val transformCmd = intBuffer[intIdx++]
                if (transformCmd == CMD_END_OF_TRANSFORM) break
                if (!firstEntry) sb.append(", ")
                firstEntry = false
                sb.append(transformCommandToString(transformCmd)).append('=')
                when (transformCmd) {
                  in CMD_SCALE..CMD_SCALE_Y,
                  CMD_PERSPECTIVE -> sb.append(doubleBuffer[doubleIdx++])
                  in CMD_TRANSLATE_X..CMD_TRANSLATE_Y -> {
                    sb.append(doubleBuffer[doubleIdx++])
                    if (intBuffer[intIdx++] == CMD_UNIT_PERCENT) sb.append('%')
                  }
                  in CMD_ROTATE..CMD_SKEW_Y -> {
                    sb.append(doubleBuffer[doubleIdx++])
                    sb.append(if (intBuffer[intIdx++] == CMD_UNIT_DEG) "deg" else "rad")
                  }
                  CMD_MATRIX -> {
                    val size = intBuffer[intIdx++]
                    sb.append('[')
                    for (i in 0 until size) {
                      if (i > 0) sb.append(", ")
                      sb.append(doubleBuffer[doubleIdx++])
                    }
                    sb.append(']')
                  }
                }
              }
              sb.append(']')
            }
          }
        }
        sb.append("}; ")
      }
    } catch (t: Throwable) {
      sb.append("<decode failed: ").append(t.javaClass.simpleName).append('>')
    }
    return sb.toString()
  }

  override fun getSurfaceId(): Int = View.NO_ID

  companion object {
    // Buffer protocol commands
    private const val CMD_START_OF_VIEW = 1
    private const val CMD_START_OF_TRANSFORM = 2
    private const val CMD_END_OF_TRANSFORM = 3
    private const val CMD_END_OF_VIEW = 4
    private const val CMD_OPACITY = 10
    private const val CMD_ELEVATION = 11
    private const val CMD_Z_INDEX = 12
    private const val CMD_SHADOW_OPACITY = 13
    private const val CMD_SHADOW_RADIUS = 14
    private const val CMD_BACKGROUND_COLOR = 15
    private const val CMD_COLOR = 16
    private const val CMD_TINT_COLOR = 17
    private const val CMD_BORDER_RADIUS = 20
    private const val CMD_BORDER_TOP_LEFT_RADIUS = 21
    private const val CMD_BORDER_TOP_RIGHT_RADIUS = 22
    private const val CMD_BORDER_TOP_START_RADIUS = 23
    private const val CMD_BORDER_TOP_END_RADIUS = 24
    private const val CMD_BORDER_BOTTOM_LEFT_RADIUS = 25
    private const val CMD_BORDER_BOTTOM_RIGHT_RADIUS = 26
    private const val CMD_BORDER_BOTTOM_START_RADIUS = 27
    private const val CMD_BORDER_BOTTOM_END_RADIUS = 28
    private const val CMD_BORDER_START_START_RADIUS = 29
    private const val CMD_BORDER_START_END_RADIUS = 30
    private const val CMD_BORDER_END_START_RADIUS = 31
    private const val CMD_BORDER_END_END_RADIUS = 32
    private const val CMD_BORDER_COLOR = 40
    private const val CMD_BORDER_TOP_COLOR = 41
    private const val CMD_BORDER_BOTTOM_COLOR = 42
    private const val CMD_BORDER_LEFT_COLOR = 43
    private const val CMD_BORDER_RIGHT_COLOR = 44
    private const val CMD_BORDER_START_COLOR = 45
    private const val CMD_BORDER_END_COLOR = 46
    private const val CMD_TRANSLATE_X = 100
    private const val CMD_TRANSLATE_Y = 101
    private const val CMD_SCALE = 102
    private const val CMD_SCALE_X = 103
    private const val CMD_SCALE_Y = 104
    private const val CMD_ROTATE = 105
    private const val CMD_ROTATE_X = 106
    private const val CMD_ROTATE_Y = 107
    private const val CMD_ROTATE_Z = 108
    private const val CMD_SKEW_X = 109
    private const val CMD_SKEW_Y = 110
    private const val CMD_MATRIX = 111
    private const val CMD_PERSPECTIVE = 112
    private const val CMD_UNIT_DEG = 200
    private const val CMD_UNIT_PX = 202
    private const val CMD_UNIT_PERCENT = 203

    @JvmStatic
    fun commandToString(command: Int): String =
        when (command) {
          CMD_OPACITY -> ViewProps.OPACITY
          CMD_ELEVATION -> ViewProps.ELEVATION
          CMD_Z_INDEX -> ViewProps.Z_INDEX
          CMD_SHADOW_OPACITY -> "shadowOpacity"
          CMD_SHADOW_RADIUS -> "shadowRadius"
          CMD_BACKGROUND_COLOR -> ViewProps.BACKGROUND_COLOR
          CMD_COLOR -> ViewProps.COLOR
          CMD_TINT_COLOR -> "tintColor"
          CMD_BORDER_RADIUS -> ViewProps.BORDER_RADIUS
          CMD_BORDER_TOP_LEFT_RADIUS -> ViewProps.BORDER_TOP_LEFT_RADIUS
          CMD_BORDER_TOP_RIGHT_RADIUS -> ViewProps.BORDER_TOP_RIGHT_RADIUS
          CMD_BORDER_TOP_START_RADIUS -> ViewProps.BORDER_TOP_START_RADIUS
          CMD_BORDER_TOP_END_RADIUS -> ViewProps.BORDER_TOP_END_RADIUS
          CMD_BORDER_BOTTOM_LEFT_RADIUS -> ViewProps.BORDER_BOTTOM_LEFT_RADIUS
          CMD_BORDER_BOTTOM_RIGHT_RADIUS -> ViewProps.BORDER_BOTTOM_RIGHT_RADIUS
          CMD_BORDER_BOTTOM_START_RADIUS -> ViewProps.BORDER_BOTTOM_START_RADIUS
          CMD_BORDER_BOTTOM_END_RADIUS -> ViewProps.BORDER_BOTTOM_END_RADIUS
          CMD_BORDER_START_START_RADIUS -> ViewProps.BORDER_START_START_RADIUS
          CMD_BORDER_START_END_RADIUS -> ViewProps.BORDER_START_END_RADIUS
          CMD_BORDER_END_START_RADIUS -> ViewProps.BORDER_END_START_RADIUS
          CMD_BORDER_END_END_RADIUS -> ViewProps.BORDER_END_END_RADIUS
          CMD_BORDER_COLOR -> ViewProps.BORDER_COLOR
          CMD_BORDER_TOP_COLOR -> ViewProps.BORDER_TOP_COLOR
          CMD_BORDER_BOTTOM_COLOR -> ViewProps.BORDER_BOTTOM_COLOR
          CMD_BORDER_LEFT_COLOR -> ViewProps.BORDER_LEFT_COLOR
          CMD_BORDER_RIGHT_COLOR -> ViewProps.BORDER_RIGHT_COLOR
          CMD_BORDER_START_COLOR -> ViewProps.BORDER_START_COLOR
          CMD_BORDER_END_COLOR -> ViewProps.BORDER_END_COLOR
          else -> "unknown"
        }

    @JvmStatic
    fun transformCommandToString(command: Int): String =
        when (command) {
          CMD_TRANSLATE_X -> "translateX"
          CMD_TRANSLATE_Y -> "translateY"
          CMD_SCALE -> "scale"
          CMD_SCALE_X -> ViewProps.SCALE_X
          CMD_SCALE_Y -> ViewProps.SCALE_Y
          CMD_ROTATE -> "rotate"
          CMD_ROTATE_X -> "rotateX"
          CMD_ROTATE_Y -> "rotateY"
          CMD_ROTATE_Z -> "rotateZ"
          CMD_SKEW_X -> "skewX"
          CMD_SKEW_Y -> "skewY"
          CMD_MATRIX -> "matrix"
          CMD_PERSPECTIVE -> "perspective"
          else -> "unknown"
        }
  }
}
