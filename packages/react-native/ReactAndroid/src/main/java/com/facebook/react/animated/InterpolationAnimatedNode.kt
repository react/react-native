/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.animated

import androidx.core.graphics.ColorUtils
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.JSApplicationIllegalArgumentException
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import java.util.regex.Pattern

/**
 * Animated node that corresponds to `AnimatedInterpolation` from AnimatedImplementation.js.
 *
 * Currently only a linear interpolation is supported on an input range of an arbitrary size.
 */
internal class InterpolationAnimatedNode(config: ReadableMap) : ValueAnimatedNode() {
  private enum class OutputType {
    Number,
    Color,
    String,
  }

  private val inputRange: DoubleArray = fromDoubleArray(config.getArray("inputRange"))
  private var outputRange: Any? = null
  private var outputType: OutputType? = null
  private var pattern: String? = null
  private val extrapolateLeft: String? = config.getString("extrapolateLeft")
  private val extrapolateRight: String? = config.getString("extrapolateRight")
  private var parent: ValueAnimatedNode? = null
  private var objectValue: Any? = null

  init {
    val output = config.getArray("outputRange")
    if (COLOR_OUTPUT_TYPE == config.getString("outputType")) {
      outputType = OutputType.Color
      outputRange = fromIntArray(output)
    } else if (output?.getType(0) == ReadableType.String) {
      outputType = OutputType.String
      outputRange = fromStringPattern(output)
      pattern = output.getString(0)
    } else if (output != null && output.size() > 0 && output.getType(0) != ReadableType.Number) {
      FLog.e(
          TAG,
          "Unsupported value type in interpolation outputRange: expected Number but got " +
              "${output.getType(0)}. This may indicate PlatformColor or other unsupported " +
              "values are being used. Interpolation will not work correctly.",
      )
      outputType = OutputType.Number
      outputRange = DoubleArray(output.size())
    } else {
      outputType = OutputType.Number
      outputRange = fromDoubleArray(output)
    }
  }

  override fun onAttachedToNode(parent: AnimatedNode) {
    check(this.parent == null) { "Parent already attached" }
    require(parent is ValueAnimatedNode) { "Parent is of an invalid type" }
    this.parent = parent
  }

  override fun onDetachedFromNode(parent: AnimatedNode) {
    require(parent === this.parent) { "Invalid parent node provided" }
    this.parent = null
  }

  override fun update() {
    // If the graph is in the middle of being created, just skip this unattached node.
    val parentValue = parent?.getValue() ?: return
    when (outputType) {
      OutputType.Number ->
          nodeValue =
              interpolate(
                  parentValue,
                  inputRange,
                  outputRange as DoubleArray,
                  extrapolateLeft,
                  extrapolateRight,
              )
      OutputType.Color ->
          objectValue =
              Integer.valueOf(interpolateColor(parentValue, inputRange, outputRange as IntArray))
      OutputType.String ->
          pattern?.let {
            @Suppress("UNCHECKED_CAST")
            objectValue =
                interpolateString(
                    it,
                    parentValue,
                    inputRange,
                    outputRange as Array<DoubleArray>,
                    extrapolateLeft,
                    extrapolateRight,
                )
          }

      else -> {}
    }
  }

  override fun getAnimatedObject(): Any? = objectValue

  override fun prettyPrint(): String =
      "InterpolationAnimatedNode[$tag] super: ${super.prettyPrint()}"

  companion object {
    private const val TAG = "InterpolationAnimatedNode"

    const val EXTRAPOLATE_TYPE_IDENTITY: String = "identity"
    const val EXTRAPOLATE_TYPE_CLAMP: String = "clamp"
    const val EXTRAPOLATE_TYPE_EXTEND: String = "extend"

    private val numericPattern: Pattern =
        Pattern.compile("[+-]?(\\d+\\.?\\d*|\\.\\d+)([eE][+-]?\\d+)?")
    private const val COLOR_OUTPUT_TYPE: String = "color"

    private fun fromDoubleArray(array: ReadableArray?): DoubleArray {
      val size = array?.size() ?: return DoubleArray(0)
      val res = DoubleArray(size)
      for (i in res.indices) {
        res[i] = array.getDouble(i)
      }
      return res
    }

    private fun fromIntArray(array: ReadableArray?): IntArray {
      val size = array?.size() ?: return IntArray(0)
      val res = IntArray(size)
      for (i in res.indices) {
        res[i] = array.getInt(i)
      }
      return res
    }

    private fun fromStringPattern(array: ReadableArray): Array<DoubleArray?> {
      val size = array.size()
      val outputRange = arrayOfNulls<DoubleArray>(size)

      // Match the first pattern into a List, since we don't know its length yet
      var m = numericPattern.matcher(array.getString(0).orEmpty())
      val firstOutputRange: MutableList<Double> = ArrayList()
      while (m.find()) {
        firstOutputRange.add(m.group().toDouble())
      }
      val firstOutputRangeArr = DoubleArray(firstOutputRange.size)
      for (i in firstOutputRange.indices) {
        firstOutputRangeArr[i] = firstOutputRange[i]
      }
      outputRange[0] = firstOutputRangeArr
      for (i in 1 until size) {
        val outputArr = DoubleArray(firstOutputRangeArr.size)
        var j = 0
        m = numericPattern.matcher(array.getString(i).orEmpty())
        while (m.find() && j < firstOutputRangeArr.size) {
          outputArr[j++] = m.group().toDouble()
        }
        outputRange[i] = outputArr
      }
      return outputRange
    }

    fun interpolate(
        value: Double,
        inputMin: Double,
        inputMax: Double,
        outputMin: Double,
        outputMax: Double,
        extrapolateLeft: String?,
        extrapolateRight: String?,
    ): Double {
      var result = value

      // Extrapolate
      if (result < inputMin) {
        when (extrapolateLeft) {
          EXTRAPOLATE_TYPE_IDENTITY -> return result
          EXTRAPOLATE_TYPE_CLAMP -> result = inputMin
          EXTRAPOLATE_TYPE_EXTEND -> {}
          else ->
              throw JSApplicationIllegalArgumentException(
                  "Invalid extrapolation type " + extrapolateLeft + "for left extrapolation"
              )
        }
      }
      if (result > inputMax) {
        when (extrapolateRight) {
          EXTRAPOLATE_TYPE_IDENTITY -> return result
          EXTRAPOLATE_TYPE_CLAMP -> result = inputMax
          EXTRAPOLATE_TYPE_EXTEND -> {}
          else ->
              throw JSApplicationIllegalArgumentException(
                  "Invalid extrapolation type " + extrapolateRight + "for right extrapolation"
              )
        }
      }
      if (outputMin == outputMax) {
        return outputMin
      }
      return if (inputMin == inputMax) {
        if (value <= inputMin) {
          outputMin
        } else outputMax
      } else outputMin + (outputMax - outputMin) * (result - inputMin) / (inputMax - inputMin)
    }

    fun interpolate(
        value: Double,
        inputRange: DoubleArray,
        outputRange: DoubleArray,
        extrapolateLeft: String?,
        extrapolateRight: String?,
    ): Double {
      val rangeIndex = findRangeIndex(value, inputRange)
      return interpolate(
          value,
          inputRange[rangeIndex],
          inputRange[rangeIndex + 1],
          outputRange[rangeIndex],
          outputRange[rangeIndex + 1],
          extrapolateLeft,
          extrapolateRight,
      )
    }

    fun interpolateColor(value: Double, inputRange: DoubleArray, outputRange: IntArray): Int {
      val rangeIndex = findRangeIndex(value, inputRange)
      val outputMin = outputRange[rangeIndex]
      val outputMax = outputRange[rangeIndex + 1]
      if (outputMin == outputMax) {
        return outputMin
      }
      val inputMin = inputRange[rangeIndex]
      val inputMax = inputRange[rangeIndex + 1]
      if (inputMin == inputMax) {
        return if (value <= inputMin) {
          outputMin
        } else outputMax
      }
      val ratio = (value - inputMin) / (inputMax - inputMin)
      return ColorUtils.blendARGB(outputMin, outputMax, ratio.toFloat())
    }

    fun interpolateString(
        pattern: String,
        value: Double,
        inputRange: DoubleArray,
        outputRange: Array<DoubleArray>,
        extrapolateLeft: String?,
        extrapolateRight: String?,
    ): String {
      val rangeIndex = findRangeIndex(value, inputRange)
      val sb = StringBuffer(pattern.length)
      val m = numericPattern.matcher(pattern)
      var i = 0
      while (m.find() && i < outputRange[rangeIndex].size) {
        val v =
            interpolate(
                value,
                inputRange[rangeIndex],
                inputRange[rangeIndex + 1],
                outputRange[rangeIndex][i],
                outputRange[rangeIndex + 1][i],
                extrapolateLeft,
                extrapolateRight,
            )
        val intVal = v.toInt()
        m.appendReplacement(sb, if (intVal.toDouble() != v) v.toString() else intVal.toString())
        i++
      }
      m.appendTail(sb)
      return sb.toString()
    }

    private fun findRangeIndex(value: Double, ranges: DoubleArray): Int {
      var index = 1
      while (index < ranges.size - 1) {
        if (ranges[index] >= value) {
          break
        }
        index++
      }
      return index - 1
    }
  }
}
