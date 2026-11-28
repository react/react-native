/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Matrix
import com.facebook.react.bridge.NativeArray
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/**
 * Builds a 2D-affine [Matrix] from a `transform` array for the subset of operations Android `View`
 * cannot represent through its individual property setters (specifically skew, from `skewX` /
 * `skewY` or a `matrix`). Used by [BaseViewManager.setTransformProperty] to apply such transforms
 * via `View.setAnimationMatrix` on Android Q+.
 */
internal object SkewMatrixHelper {
  private const val SKEW_EPSILON = 1e-5

  /**
   * Returns true if [transforms] contains only operations representable by a Skia [Matrix] in 2D:
   * `rotate` / `rotateZ`, `scale`, `scaleX` / `scaleY`, `translate` / `translateX` / `translateY`
   * with zero Z, `skewX`, `skewY`, and a 16-element 2D-affine `matrix`; and at least one of them
   * skews: `skewX`, `skewY`, or a `matrix` whose X and Y axes are not perpendicular. Returns false
   * for `perspective`, `rotateX`, `rotateY`, a `translate` with a non-zero Z component, any other
   * `matrix`, and the raw 16-element matrix shorthand used by Fabric LayoutAnimations.
   */
  @JvmStatic
  fun isAffine2DTransformWithSkew(transforms: ReadableArray): Boolean {
    // Read Fabric's arrays in C++ rather than crossing JNI for every element and key.
    if (transforms is NativeArray) {
      return TransformHelper.isAffine2DTransformWithSkew(transforms)
    }
    if (isRawMatrixShorthand(transforms)) {
      return false
    }

    var hasSkewTransform = false
    for (i in 0 until transforms.size()) {
      if (transforms.getType(i) != ReadableType.Map) continue
      val map = transforms.getMap(i) ?: continue
      val iterator = map.keySetIterator()
      if (!iterator.hasNextKey()) continue
      val type = iterator.nextKey()
      when (type) {
        "matrix" -> {
          val matrix = map.getArray(type)
          if (matrix == null || !isAffine2DMatrix(matrix)) {
            return false
          }
          if (hasSkew(matrix)) {
            hasSkewTransform = true
          }
        }
        "perspective",
        "rotateX",
        "rotateY" -> return false
        "translate" -> {
          val value = map.getArray(type)
          if (
              value != null &&
                  value.size() > 2 &&
                  value.getType(2) == ReadableType.Number &&
                  value.getDouble(2) != 0.0
          ) {
            return false
          }
        }
        "skewX",
        "skewY" -> hasSkewTransform = true
      }
    }
    return hasSkewTransform
  }

  /**
   * Builds a [Matrix] in pixel coordinates by walking [transforms] left-to-right and applying each
   * operation via `Matrix.preX` around the resolved pivot. Pivot is the view center; if
   * [transformOrigin] is set, it overrides per-axis (Number values are DIP, "P%" strings are P/100
   * of the view dimension; Z is ignored).
   *
   * Composition is pre-multiplication: when the resulting matrix is applied to a point, the
   * rightmost (last) array entry is applied first. Matches CSS / iOS conventions and the
   * left-to-right-iteration / right-multiply contract of [MatrixMathHelper.multiplyInto] used by
   * [TransformHelper.processTransform].
   */
  @JvmStatic
  fun buildAffine2DMatrix(
      transforms: ReadableArray,
      viewWidthDip: Float,
      viewHeightDip: Float,
      transformOrigin: ReadableArray?,
  ): Matrix {
    val pivotXPx: Float
    val pivotYPx: Float
    if (transformOrigin == null) {
      pivotXPx = PixelUtil.toPixelFromDIP(viewWidthDip / 2f)
      pivotYPx = PixelUtil.toPixelFromDIP(viewHeightDip / 2f)
    } else {
      pivotXPx =
          PixelUtil.toPixelFromDIP(
              resolveOriginAxis(transformOrigin, 0, viewWidthDip, viewWidthDip / 2f),
          )
      pivotYPx =
          PixelUtil.toPixelFromDIP(
              resolveOriginAxis(transformOrigin, 1, viewHeightDip, viewHeightDip / 2f),
          )
    }

    val matrix = Matrix()
    for (i in 0 until transforms.size()) {
      if (transforms.getType(i) != ReadableType.Map) continue
      val map = transforms.getMap(i) ?: continue
      val iterator = map.keySetIterator()
      if (!iterator.hasNextKey()) continue
      val type = iterator.nextKey()
      when (type) {
        "rotate",
        "rotateZ" ->
            matrix.preRotate(
                Math.toDegrees(TransformHelper.convertToRadians(map, type)).toFloat(),
                pivotXPx,
                pivotYPx,
            )
        "scale" -> {
          val s = map.getDouble(type).toFloat()
          matrix.preScale(s, s, pivotXPx, pivotYPx)
        }
        "scaleX" -> matrix.preScale(map.getDouble(type).toFloat(), 1f, pivotXPx, pivotYPx)
        "scaleY" -> matrix.preScale(1f, map.getDouble(type).toFloat(), pivotXPx, pivotYPx)
        "skewX" ->
            matrix.preSkew(
                Math.tan(TransformHelper.convertToRadians(map, type)).toFloat(),
                0f,
                pivotXPx,
                pivotYPx,
            )
        "skewY" ->
            matrix.preSkew(
                0f,
                Math.tan(TransformHelper.convertToRadians(map, type)).toFloat(),
                pivotXPx,
                pivotYPx,
            )
        "matrix" -> {
          val values = map.getArray(type) ?: continue
          matrix.preTranslate(pivotXPx, pivotYPx)
          matrix.preConcat(toAndroidMatrix(values))
          matrix.preTranslate(-pivotXPx, -pivotYPx)
        }
        "translate" -> {
          val value = map.getArray(type)
          if (value != null && value.size() >= 1) {
            val tx = parseTranslateValue(value, 0, viewWidthDip)
            val ty = if (value.size() > 1) parseTranslateValue(value, 1, viewHeightDip) else 0.0
            matrix.preTranslate(
                PixelUtil.toPixelFromDIP(tx.toFloat()),
                PixelUtil.toPixelFromDIP(ty.toFloat()),
            )
          }
        }
        "translateX" ->
            matrix.preTranslate(
                PixelUtil.toPixelFromDIP(parseScalarTranslate(map, type, viewWidthDip).toFloat()),
                0f,
            )
        "translateY" ->
            matrix.preTranslate(
                0f,
                PixelUtil.toPixelFromDIP(parseScalarTranslate(map, type, viewHeightDip).toFloat()),
            )
      }
    }
    return matrix
  }

  private fun isRawMatrixShorthand(transforms: ReadableArray): Boolean =
      transforms.size() == 16 && transforms.getType(0) == ReadableType.Number

  // `matrix` is column-major: x' = m[0] x + m[4] y + m[12], y' = m[1] x + m[5] y + m[13].
  // The other entries are the Z axis, perspective and the homogeneous scale.
  private fun isAffine2DMatrix(matrix: ReadableArray): Boolean {
    if (matrix.size() != 16) {
      return false
    }
    for (i in intArrayOf(2, 3, 6, 7, 8, 9, 11, 14)) {
      if (matrix.getDouble(i) != 0.0) {
        return false
      }
    }
    return matrix.getDouble(10) == 1.0 && matrix.getDouble(15) == 1.0
  }

  private fun hasSkew(matrix: ReadableArray): Boolean {
    val xAxisX = matrix.getDouble(0)
    val xAxisY = matrix.getDouble(1)
    val yAxisX = matrix.getDouble(4)
    val yAxisY = matrix.getDouble(5)
    val cosineBetweenAxes =
        (xAxisX * yAxisX + xAxisY * yAxisY) /
            (Math.hypot(xAxisX, xAxisY) * Math.hypot(yAxisX, yAxisY))
    return Math.abs(cosineBetweenAxes) > SKEW_EPSILON
  }

  private fun toAndroidMatrix(matrix: ReadableArray): Matrix =
      Matrix().apply {
        setValues(
            floatArrayOf(
                matrix.getDouble(0).toFloat(),
                matrix.getDouble(4).toFloat(),
                PixelUtil.toPixelFromDIP(matrix.getDouble(12).toFloat()),
                matrix.getDouble(1).toFloat(),
                matrix.getDouble(5).toFloat(),
                PixelUtil.toPixelFromDIP(matrix.getDouble(13).toFloat()),
                0f,
                0f,
                1f,
            )
        )
      }

  private fun resolveOriginAxis(
      origin: ReadableArray,
      axis: Int,
      dimensionDip: Float,
      defaultDip: Float,
  ): Float {
    if (origin.size() <= axis) return defaultDip
    return when (origin.getType(axis)) {
      ReadableType.Number -> origin.getDouble(axis).toFloat()
      ReadableType.String -> {
        val part = origin.getString(axis) ?: return defaultDip
        if (!part.endsWith("%")) return defaultDip
        try {
          (part.dropLast(1).toDouble() * dimensionDip / 100.0).toFloat()
        } catch (e: NumberFormatException) {
          defaultDip
        }
      }
      else -> defaultDip
    }
  }

  private fun parseTranslateValue(value: ReadableArray, index: Int, dimensionDip: Float): Double {
    if (value.getType(index) != ReadableType.String) {
      return value.getDouble(index)
    }
    val s = value.getString(index) ?: return 0.0
    return TransformHelper.parseTranslateValue(s, dimensionDip.toDouble())
  }

  private fun parseScalarTranslate(map: ReadableMap, key: String, dimensionDip: Float): Double {
    if (map.getType(key) != ReadableType.String) {
      return map.getDouble(key)
    }
    val s = map.getString(key) ?: return 0.0
    return TransformHelper.parseTranslateValue(s, dimensionDip.toDouble())
  }
}
