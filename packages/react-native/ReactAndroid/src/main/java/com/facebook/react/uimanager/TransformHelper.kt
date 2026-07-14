/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.ReactNativeJNISoLoader
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants

public object TransformHelper {
  init {
    ReactNativeJNISoLoader.staticInit()
  }

  private val helperMatrix: ThreadLocal<DoubleArray> =
      object : ThreadLocal<DoubleArray>() {
        override fun initialValue(): DoubleArray = DoubleArray(16)
      }

  internal fun convertToRadians(transformMap: ReadableMap, key: String): Double {
    var value: Double
    var inRadians = true
    if (transformMap.getType(key) == ReadableType.String) {
      var stringValue = transformMap.getString(key)!!
      if (stringValue.endsWith("rad")) {
        stringValue = stringValue.dropLast(3)
      } else if (stringValue.endsWith("deg")) {
        inRadians = false
        stringValue = stringValue.dropLast(3)
      }
      value = stringValue.toDouble()
    } else {
      value = transformMap.getDouble(key)
    }
    return if (inRadians) value else MatrixMathHelper.degreesToRadians(value)
  }

  @Deprecated(
      "Use processTransform(ReadableArray, DoubleArray, Float, Float, ReadableArray) instead",
      ReplaceWith("processTransform(...)"),
  )
  @JvmStatic
  public fun processTransform(transforms: ReadableArray, result: DoubleArray) {
    processTransform(transforms, result, 0f, 0f, null)
  }

  @Deprecated(
      "Use processTransform(ReadableArray, DoubleArray, Float, Float, ReadableArray) instead",
      ReplaceWith("processTransform(...)"),
  )
  @JvmStatic
  public fun processTransform(
      transforms: ReadableArray,
      result: DoubleArray,
      viewWidth: Float,
      viewHeight: Float,
      transformOrigin: ReadableArray?,
      allowPercentageResolution: Boolean,
  ) {
    processTransform(transforms, result, viewWidth, viewHeight, transformOrigin)
  }

  @JvmStatic
  public fun processTransform(
      transforms: ReadableArray,
      result: DoubleArray,
      viewWidth: Float,
      viewHeight: Float,
      transformOrigin: ReadableArray?,
  ) {
    if (transforms is NativeArray && transformOrigin is NativeArray?) {
      nativeProcessTransform(transforms, result, viewWidth, viewHeight, transformOrigin)
      return
    }

    val helperMatrix = helperMatrix.get()!!
    MatrixMathHelper.resetIdentityMatrix(result)
    val offsets = getTranslateForTransformOrigin(
        viewWidth,
        viewHeight,
        transformOrigin,
    )

    if (offsets != null) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix)
      MatrixMathHelper.applyTranslate3D(helperMatrix, offsets[0], offsets[1], offsets[2])
      MatrixMathHelper.multiplyInto(result, result, helperMatrix)
    }

    // If the transforms array is actually just the matrix itself,
    // copy that directly. This is for Fabric LayoutAnimations support.
    // All of the stuff this Java helper does is already done in C++ in Fabric, so we
    // can just use that matrix directly.
    if (transforms.size() == 16 && transforms.getType(0) == ReadableType.Number) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix)
      for (i in 0 until transforms.size()) {
        helperMatrix[i] = transforms.getDouble(i)
      }
      MatrixMathHelper.multiplyInto(result, result, helperMatrix)
    } else {
      for (transformIdx in 0 until transforms.size()) {
        val transform = transforms.getMap(transformIdx)!!
        val transformType = transform.keySetIterator().nextKey()

        MatrixMathHelper.resetIdentityMatrix(helperMatrix)
        when (transformType) {
          "matrix" -> {
            val matrix = transform.getArray(transformType)!!
            for (i in 0 until 16) {
              helperMatrix[i] = matrix.getDouble(i)
            }
          }
          "perspective" ->
              MatrixMathHelper.applyPerspective(helperMatrix, transform.getDouble(transformType))
          "rotateX" ->
              MatrixMathHelper.applyRotateX(
                  helperMatrix,
                  convertToRadians(transform, transformType),
              )
          "rotateY" ->
              MatrixMathHelper.applyRotateY(
                  helperMatrix,
                  convertToRadians(transform, transformType),
              )
          "rotate",
          "rotateZ" ->
              MatrixMathHelper.applyRotateZ(
                  helperMatrix,
                  convertToRadians(transform, transformType),
              )
          "scale" -> {
            val scale = transform.getDouble(transformType)
            MatrixMathHelper.applyScaleX(helperMatrix, scale)
            MatrixMathHelper.applyScaleY(helperMatrix, scale)
          }
          "scaleX" -> MatrixMathHelper.applyScaleX(helperMatrix, transform.getDouble(transformType))
          "scaleY" -> MatrixMathHelper.applyScaleY(helperMatrix, transform.getDouble(transformType))
          "translate" -> {
            val value = transform.getArray(transformType)!!
            val x =
                if (value.getType(0) == ReadableType.String)
                    parseTranslateValue(value.getString(0)!!, viewWidth.toDouble())
                else value.getDouble(0)
            val y =
                if (value.getType(1) == ReadableType.String)
                    parseTranslateValue(value.getString(1)!!, viewHeight.toDouble())
                else value.getDouble(1)
            val z = if (value.size() > 2) value.getDouble(2) else 0.0
            MatrixMathHelper.applyTranslate3D(helperMatrix, x, y, z)
          }
          "translateX" -> {
            val translateValue =
                if (transform.getType(transformType) == ReadableType.String)
                    parseTranslateValue(transform.getString(transformType)!!, viewWidth.toDouble())
                else transform.getDouble(transformType)
            MatrixMathHelper.applyTranslate2D(helperMatrix, translateValue, 0.0)
          }
          "translateY" -> {
            val translateValue =
                if (transform.getType(transformType) == ReadableType.String)
                    parseTranslateValue(transform.getString(transformType)!!, viewHeight.toDouble())
                else transform.getDouble(transformType)
            MatrixMathHelper.applyTranslate2D(helperMatrix, 0.0, translateValue)
          }
          "skewX" ->
              MatrixMathHelper.applySkewX(helperMatrix, convertToRadians(transform, transformType))
          "skewY" ->
              MatrixMathHelper.applySkewY(helperMatrix, convertToRadians(transform, transformType))
          else -> FLog.w(ReactConstants.TAG, "Unsupported transform type: $transformType")
        }

        MatrixMathHelper.multiplyInto(result, result, helperMatrix)
      }
    }

    if (offsets != null) {
      MatrixMathHelper.resetIdentityMatrix(helperMatrix)
      MatrixMathHelper.applyTranslate3D(helperMatrix, -offsets[0], -offsets[1], -offsets[2])
      MatrixMathHelper.multiplyInto(result, result, helperMatrix)
    }
  }

  internal fun parseTranslateValue(stringValue: String, dimension: Double): Double {
    return try {
      if (stringValue.endsWith("%")) {
        val percentage = stringValue.dropLast(1).toDouble()
        percentage * dimension / 100.0
      } else {
        stringValue.toDouble()
      }
    } catch (e: NumberFormatException) {
      FLog.w(ReactConstants.TAG, "Invalid translate value: $stringValue")
      0.0
    }
  }

  private fun getTranslateForTransformOrigin(
      viewWidth: Float,
      viewHeight: Float,
      transformOrigin: ReadableArray?,
  ): DoubleArray? {
    if (transformOrigin == null || (viewHeight == 0f && viewWidth == 0f)) {
      return null
    }

    val viewCenterX = viewWidth / 2.0
    val viewCenterY = viewHeight / 2.0
    val origin = doubleArrayOf(viewCenterX, viewCenterY, 0.0)

    for (i in 0 until minOf(transformOrigin.size(), 3)) {
      when (transformOrigin.getType(i)) {
        ReadableType.Number -> origin[i] = transformOrigin.getDouble(i)
        ReadableType.String -> {
          val part = transformOrigin.getString(i)!!
          if (part.endsWith("%")) {
            val valPercent = part.dropLast(1).toDouble()
            origin[i] = (if (i == 0) viewWidth else viewHeight) * valPercent / 100.0
          }
        }
        else -> {}
      }
    }

    val newTranslateX = -viewCenterX + origin[0]
    val newTranslateY = -viewCenterY + origin[1]
    val newTranslateZ = origin[2]

    return doubleArrayOf(newTranslateX, newTranslateY, newTranslateZ)
  }

  @JvmStatic
  private external fun nativeProcessTransform(
      transforms: NativeArray,
      result: DoubleArray,
      viewWidth: Float,
      viewHeight: Float,
      transformOrigin: NativeArray?,
  )
}
