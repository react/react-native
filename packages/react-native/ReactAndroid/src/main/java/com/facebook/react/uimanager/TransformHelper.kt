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
    if (transformMap.getType(key) != ReadableType.String) {
      return asFloat(transformMap.getDouble(key))
    }
    val stringValue = transformMap.getString(key)!!
    // The C++ transform parser holds an angle with a unit in degrees.
    val degrees =
        when {
          stringValue.endsWith("rad") -> Math.toDegrees(stringValue.dropLast(3).toDouble())
          stringValue.endsWith("deg") -> stringValue.dropLast(3).toDouble()
          else -> return asFloat(stringValue.toDouble())
        }
    return MatrixMathHelper.degreesToRadians(asFloat(degrees))
  }

  /**
   * Resolves a percentage of [referenceLength] in floats, as the C++ renderer resolves it, so one
   * whose length is past the largest float is infinite on this path too.
   */
  internal fun resolvePercentage(percentage: Float, referenceLength: Float): Double =
      (referenceLength * percentage / 100f).toDouble()

  /**
   * Resolves [transformOrigin] on a [viewWidth] by [viewHeight] view, in floats, from its top left
   * corner: a number is a length, and "P%" is P% of the view's width, or of its height past the
   * first axis. An axis that declares no length stays at the center, and the depth at 0. NaN and
   * infinity are not CSS numbers, so an origin declaring one is ignored: the answer is null, and
   * the view turns about its center.
   */
  internal fun resolveTransformOrigin(
      transformOrigin: ReadableArray,
      viewWidth: Float,
      viewHeight: Float,
  ): DoubleArray? {
    val origin = doubleArrayOf(viewWidth / 2.0, viewHeight / 2.0, 0.0)
    for (i in 0 until minOf(transformOrigin.size(), 3)) {
      when (transformOrigin.getType(i)) {
        ReadableType.Number -> {
          val length = transformOrigin.getDouble(i).toFloat()
          if (!length.isFinite()) {
            return null
          }
          origin[i] = length.toDouble()
        }
        ReadableType.String -> {
          val part = transformOrigin.getString(i)!!
          val declared = if (part.endsWith("%")) part.dropLast(1).toDoubleOrNull() else null
          if (declared != null) {
            val percentage = declared.toFloat()
            if (!percentage.isFinite()) {
              return null
            }
            origin[i] = resolvePercentage(percentage, if (i == 0) viewWidth else viewHeight)
          }
        }
        else -> {}
      }
    }
    return origin
  }

  // The C++ transform parser holds a transform's numbers as floats, so a number past the largest
  // float is infinite on this path too.
  private fun asFloat(value: Double): Double = value.toFloat().toDouble()

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
    val offsets =
        getTranslateForTransformOrigin(
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
        helperMatrix[i] = asFloat(transforms.getDouble(i))
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
              helperMatrix[i] = asFloat(matrix.getDouble(i))
            }
          }
          "perspective" -> {
            val perspective = asFloat(transform.getDouble(transformType))
            // -1 / ±Infinity is a finite m34, so the result's own check below cannot see it.
            if (!perspective.isFinite()) {
              MatrixMathHelper.resetIdentityMatrix(result)
              return
            }
            MatrixMathHelper.applyPerspective(helperMatrix, perspective)
          }
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
            val scale = asFloat(transform.getDouble(transformType))
            MatrixMathHelper.applyScaleX(helperMatrix, scale)
            MatrixMathHelper.applyScaleY(helperMatrix, scale)
          }
          "scaleX" ->
              MatrixMathHelper.applyScaleX(
                  helperMatrix,
                  asFloat(transform.getDouble(transformType)),
              )
          "scaleY" ->
              MatrixMathHelper.applyScaleY(
                  helperMatrix,
                  asFloat(transform.getDouble(transformType)),
              )
          "translate" -> {
            val value = transform.getArray(transformType)!!
            val x =
                if (value.getType(0) == ReadableType.String)
                    parseTranslateValue(value.getString(0)!!, viewWidth.toDouble())
                else asFloat(value.getDouble(0))
            val y =
                if (value.getType(1) == ReadableType.String)
                    parseTranslateValue(value.getString(1)!!, viewHeight.toDouble())
                else asFloat(value.getDouble(1))
            val z = if (value.size() > 2) asFloat(value.getDouble(2)) else 0.0
            MatrixMathHelper.applyTranslate3D(helperMatrix, x, y, z)
          }
          "translateX" -> {
            val translateValue =
                if (transform.getType(transformType) == ReadableType.String)
                    parseTranslateValue(transform.getString(transformType)!!, viewWidth.toDouble())
                else asFloat(transform.getDouble(transformType))
            MatrixMathHelper.applyTranslate2D(helperMatrix, translateValue, 0.0)
          }
          "translateY" -> {
            val translateValue =
                if (transform.getType(transformType) == ReadableType.String)
                    parseTranslateValue(transform.getString(transformType)!!, viewHeight.toDouble())
                else asFloat(transform.getDouble(transformType))
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

    // NaN and infinity are not CSS numbers, so a transform holding one is an invalid declaration
    // and is ignored: https://drafts.csswg.org/css-values-4/#numbers. Every non-finite operand but
    // a perspective's makes the matrix non-finite, and a valid transform whose matrix overflows a
    // float cannot be drawn, so it is ignored too.
    if (!result.all { it.toFloat().isFinite() }) {
      MatrixMathHelper.resetIdentityMatrix(result)
    }
  }

  internal fun parseTranslateValue(stringValue: String, dimension: Double): Double {
    return try {
      if (stringValue.endsWith("%")) {
        resolvePercentage(stringValue.dropLast(1).toDouble().toFloat(), dimension.toFloat())
      } else {
        asFloat(stringValue.toDouble())
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
    val origin = resolveTransformOrigin(transformOrigin, viewWidth, viewHeight) ?: return null

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
