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
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.fabric.FabricUIManager.IS_DEVELOPMENT_ENVIRONMENT
import com.facebook.react.fabric.mounting.MountItemDispatcher
import com.facebook.react.fabric.mounting.MountingManager
import com.facebook.react.uimanager.ViewProps

internal class BatchedAnimatedPropsMountItem(
    private val intBuffer: IntArray,
    private val doubleBuffer: DoubleArray,
    private val rawPropsBuffer: Array<Any?>,
    private val mountItemDispatcher: MountItemDispatcher,
) : MountItem {

  override fun execute(mountingManager: MountingManager) {
    decode { viewTag, props ->
      try {
        if (!mountingManager.updateAnimatedPropsSynchronously(viewTag, props)) {
          mountItemDispatcher.addMountItem(SynchronousMountItem(viewTag, props))
        }
      } catch (ex: Exception) {
        // Match SynchronousMountItem's handling of view-manager failures.
      }
    }
  }

  internal fun decode(apply: (Int, ReadableMap) -> Unit) {
    var intIdx = 0
    var doubleIdx = 0
    var rawIdx = 0
    while (intIdx < intBuffer.size) {
      val command = intBuffer[intIdx++]
      require(command == CMD_START_OF_VIEW) { "Expected start of animated view, got $command" }
      val viewTag = intBuffer[intIdx++]

      if (intBuffer[intIdx] == CMD_RAW_PROPS) {
        require(intBuffer[intIdx + 1] == CMD_END_OF_VIEW) { "Raw props must be the whole view" }
        intIdx += 2
        apply(viewTag, rawPropsBuffer[rawIdx++] as ReadableMap)
        continue
      }

      val props = JavaOnlyMap()
      while (true) {
        val cmd = intBuffer[intIdx++]
        if (cmd == CMD_END_OF_VIEW) {
          break
        }

        when (cmd) {
          CMD_OPACITY,
          CMD_ELEVATION,
          CMD_Z_INDEX,
          CMD_SHADOW_OPACITY,
          CMD_SHADOW_RADIUS,
          CMD_OUTLINE_OFFSET,
          CMD_OUTLINE_WIDTH -> props.putDouble(commandToString(cmd), doubleBuffer[doubleIdx++])
          CMD_BACKGROUND_COLOR,
          CMD_COLOR,
          CMD_TINT_COLOR,
          CMD_PLACEHOLDER_TEXT_COLOR,
          CMD_SHADOW_COLOR,
          CMD_BORDER_COLOR,
          CMD_BORDER_TOP_COLOR,
          CMD_BORDER_BOTTOM_COLOR,
          CMD_BORDER_LEFT_COLOR,
          CMD_BORDER_RIGHT_COLOR,
          CMD_BORDER_START_COLOR,
          CMD_BORDER_END_COLOR,
          CMD_BORDER_BLOCK_COLOR,
          CMD_BORDER_BLOCK_START_COLOR,
          CMD_BORDER_BLOCK_END_COLOR,
          CMD_OUTLINE_COLOR -> props.putInt(commandToString(cmd), intBuffer[intIdx++])
          CMD_BORDER_RADIUS,
          CMD_BORDER_TOP_LEFT_RADIUS,
          CMD_BORDER_TOP_RIGHT_RADIUS,
          CMD_BORDER_TOP_START_RADIUS,
          CMD_BORDER_TOP_END_RADIUS,
          CMD_BORDER_BOTTOM_LEFT_RADIUS,
          CMD_BORDER_BOTTOM_RIGHT_RADIUS,
          CMD_BORDER_BOTTOM_START_RADIUS,
          CMD_BORDER_BOTTOM_END_RADIUS,
          CMD_BORDER_START_START_RADIUS,
          CMD_BORDER_START_END_RADIUS,
          CMD_BORDER_END_START_RADIUS,
          CMD_BORDER_END_END_RADIUS ->
              putLength(
                  props,
                  commandToString(cmd),
                  intBuffer[intIdx++],
                  doubleBuffer[doubleIdx++],
              )
          CMD_START_OF_TRANSFORM -> {
            val transform = JavaOnlyArray()
            while (true) {
              val transformCmd = intBuffer[intIdx++]
              if (transformCmd == CMD_END_OF_TRANSFORM) {
                break
              }
              val name = transformCommandToString(transformCmd)
              val entry = JavaOnlyMap()
              when (transformCmd) {
                CMD_TRANSLATE_X,
                CMD_TRANSLATE_Y ->
                    putLength(entry, name, intBuffer[intIdx++], doubleBuffer[doubleIdx++])
                CMD_MATRIX -> {
                  val matrix = JavaOnlyArray()
                  repeat(16) { matrix.pushDouble(doubleBuffer[doubleIdx++]) }
                  entry.putArray(name, matrix)
                }
                // Angles are in radians.
                else -> entry.putDouble(name, doubleBuffer[doubleIdx++])
              }
              transform.pushMap(entry)
            }
            props.putArray(ViewProps.TRANSFORM, transform)
          }
          else -> error("Unknown animated prop command: $cmd")
        }
      }

      apply(viewTag, props)
    }
    require(doubleIdx == doubleBuffer.size && rawIdx == rawPropsBuffer.size) {
      "Unused values in animated props buffer"
    }
  }

  override fun toString(): String {
    if (!IS_DEVELOPMENT_ENVIRONMENT) return "BATCHED UPDATE PROPS <hidden>"
    val updates = mutableListOf<String>()
    decode { tag, props -> updates.add("[$tag]: ${props.toHashMap()}") }
    return "BATCHED UPDATE PROPS ${updates.joinToString()}"
  }

  override fun getSurfaceId(): Int = View.NO_ID

  companion object {
    // Keep command values in sync with AnimatedPropBufferEncoder.cpp.
    private const val CMD_START_OF_VIEW = 1
    private const val CMD_START_OF_TRANSFORM = 2
    private const val CMD_END_OF_TRANSFORM = 3
    private const val CMD_END_OF_VIEW = 4
    private const val CMD_RAW_PROPS = 5
    private const val CMD_OPACITY = 10
    private const val CMD_ELEVATION = 11
    private const val CMD_Z_INDEX = 12
    private const val CMD_SHADOW_OPACITY = 13
    private const val CMD_SHADOW_RADIUS = 14
    private const val CMD_BACKGROUND_COLOR = 15
    private const val CMD_COLOR = 16
    private const val CMD_TINT_COLOR = 17
    private const val CMD_PLACEHOLDER_TEXT_COLOR = 18
    private const val CMD_SHADOW_COLOR = 19
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
    private const val CMD_BORDER_BLOCK_COLOR = 47
    private const val CMD_BORDER_BLOCK_START_COLOR = 48
    private const val CMD_BORDER_BLOCK_END_COLOR = 49
    private const val CMD_OUTLINE_COLOR = 50
    private const val CMD_OUTLINE_OFFSET = 51
    private const val CMD_OUTLINE_WIDTH = 52
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
    private const val CMD_UNIT_PX = 202
    private const val CMD_UNIT_PERCENT = 203

    private fun putLength(map: JavaOnlyMap, name: String, unit: Int, value: Double) =
        when (unit) {
          CMD_UNIT_PX -> map.putDouble(name, value)
          CMD_UNIT_PERCENT -> map.putString(name, "$value%")
          else -> error("Unknown length unit: $unit")
        }

    private fun commandToString(command: Int): String =
        when (command) {
          CMD_OPACITY -> ViewProps.OPACITY
          CMD_ELEVATION -> ViewProps.ELEVATION
          CMD_Z_INDEX -> ViewProps.Z_INDEX
          CMD_SHADOW_OPACITY -> "shadowOpacity"
          CMD_SHADOW_RADIUS -> "shadowRadius"
          CMD_BACKGROUND_COLOR -> ViewProps.BACKGROUND_COLOR
          CMD_COLOR -> ViewProps.COLOR
          CMD_TINT_COLOR -> "tintColor"
          CMD_PLACEHOLDER_TEXT_COLOR -> "placeholderTextColor"
          CMD_SHADOW_COLOR -> ViewProps.SHADOW_COLOR
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
          CMD_BORDER_BLOCK_COLOR -> ViewProps.BORDER_BLOCK_COLOR
          CMD_BORDER_BLOCK_START_COLOR -> ViewProps.BORDER_BLOCK_START_COLOR
          CMD_BORDER_BLOCK_END_COLOR -> ViewProps.BORDER_BLOCK_END_COLOR
          CMD_OUTLINE_COLOR -> ViewProps.OUTLINE_COLOR
          CMD_OUTLINE_OFFSET -> ViewProps.OUTLINE_OFFSET
          CMD_OUTLINE_WIDTH -> ViewProps.OUTLINE_WIDTH
          else -> error("Unknown animated prop command: $command")
        }

    private fun transformCommandToString(command: Int): String =
        when (command) {
          CMD_TRANSLATE_X -> ViewProps.TRANSLATE_X
          CMD_TRANSLATE_Y -> ViewProps.TRANSLATE_Y
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
          else -> error("Unknown animated prop command: $command")
        }
  }
}
