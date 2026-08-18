/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.infer.annotation.Assertions
import kotlin.math.abs
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.sqrt
import kotlin.math.tan

/**
 * Provides helper methods for converting transform operations into a matrix and then into a list of
 * translate, scale and rotate commands.
 */
public object MatrixMathHelper {
  private const val EPSILON = .00001

  private fun isZero(d: Double): Boolean {
    return if (java.lang.Double.isNaN(d)) {
      false
    } else abs(d) < EPSILON
  }

  @JvmStatic
  public fun multiplyInto(out: DoubleArray, a: DoubleArray, b: DoubleArray) {
    val a00 = a[0]
    val a01 = a[1]
    val a02 = a[2]
    val a03 = a[3]
    val a10 = a[4]
    val a11 = a[5]
    val a12 = a[6]
    val a13 = a[7]
    val a20 = a[8]
    val a21 = a[9]
    val a22 = a[10]
    val a23 = a[11]
    val a30 = a[12]
    val a31 = a[13]
    val a32 = a[14]
    val a33 = a[15]
    var b0 = b[0]
    var b1 = b[1]
    var b2 = b[2]
    var b3 = b[3]
    out[0] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[1] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[2] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[3] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
    b0 = b[4]
    b1 = b[5]
    b2 = b[6]
    b3 = b[7]
    out[4] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[5] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[6] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[7] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
    b0 = b[8]
    b1 = b[9]
    b2 = b[10]
    b3 = b[11]
    out[8] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[9] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[10] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[11] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
    b0 = b[12]
    b1 = b[13]
    b2 = b[14]
    b3 = b[15]
    out[12] = b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30
    out[13] = b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31
    out[14] = b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32
    out[15] = b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33
  }

  /** @param transformMatrix 16-element array of numbers representing 4x4 transform matrix */
  @JvmStatic
  public fun decomposeMatrix(transformMatrix: DoubleArray, ctx: MatrixDecompositionContext) {
    Assertions.assertCondition(transformMatrix.size == 16)

    // output values
    val perspective = ctx.perspective
    val scale = ctx.scale
    val skew = ctx.skew
    val translation = ctx.translation
    val rotationDegrees = ctx.rotationDegrees

    // create normalized, 2d array matrix
    // and normalized 1d array perspectiveMatrix with redefined 4th column
    if (isZero(transformMatrix[15])) {
      return
    }
    val matrix = Array(4) { DoubleArray(4) }
    val perspectiveMatrix = DoubleArray(16)
    for (i in 0..3) {
      for (j in 0..3) {
        val value = transformMatrix[i * 4 + j] / transformMatrix[15]
        matrix[i][j] = value
        perspectiveMatrix[i * 4 + j] = if (j == 3) 0.0 else value
      }
    }
    perspectiveMatrix[15] = 1.0

    // test for singularity of upper 3x3 part of the perspective matrix
    if (isZero(determinant(perspectiveMatrix))) {
      return
    }

    // isolate perspective
    if (!isZero(matrix[0][3]) || !isZero(matrix[1][3]) || !isZero(matrix[2][3])) {
      // rightHandSide is the right hand side of the equation.
      // rightHandSide is a vector, or point in 3d space relative to the origin.
      val rightHandSide = doubleArrayOf(matrix[0][3], matrix[1][3], matrix[2][3], matrix[3][3])

      // Solve the equation by inverting perspectiveMatrix and multiplying
      // rightHandSide by the inverse.
      val inversePerspectiveMatrix = inverse(perspectiveMatrix)
      val transposedInversePerspectiveMatrix = transpose(inversePerspectiveMatrix)
      multiplyVectorByMatrix(rightHandSide, transposedInversePerspectiveMatrix, perspective)
    } else {
      // no perspective
      perspective[2] = 0.0
      perspective[1] = perspective[2]
      perspective[0] = perspective[1]
      perspective[3] = 1.0
    }

    // translation is simple
    for (i in 0..2) {
      translation[i] = matrix[3][i]
    }

    // Now get scale and shear.
    // 'row' is a 3 element array of 3 component vectors
    val row = Array(3) { DoubleArray(3) }
    for (i in 0..2) {
      row[i][0] = matrix[i][0]
      row[i][1] = matrix[i][1]
      row[i][2] = matrix[i][2]
    }

    // Compute X scale factor and normalize first row.
    scale[0] = v3Length(row[0])
    row[0] = v3Normalize(row[0], scale[0])

    // Compute XY shear factor and make 2nd row orthogonal to 1st.
    skew[0] = v3Dot(row[0], row[1])
    row[1] = v3Combine(row[1], row[0], 1.0, -skew[0])

    // Now, compute Y scale and normalize 2nd row.
    scale[1] = v3Length(row[1])
    row[1] = v3Normalize(row[1], scale[1])
    skew[0] /= scale[1]

    // Compute XZ and YZ shears, orthogonalize 3rd row
    skew[1] = v3Dot(row[0], row[2])
    row[2] = v3Combine(row[2], row[0], 1.0, -skew[1])
    skew[2] = v3Dot(row[1], row[2])
    row[2] = v3Combine(row[2], row[1], 1.0, -skew[2])

    // Next, get Z scale and normalize 3rd row.
    scale[2] = v3Length(row[2])
    row[2] = v3Normalize(row[2], scale[2])
    skew[1] /= scale[2]
    skew[2] /= scale[2]

    // At this point, the matrix (in rows) is orthonormal.
    // Check for a coordinate system flip.  If the determinant
    // is -1, then negate the matrix and the scaling factors.
    val pdum3 = v3Cross(row[1], row[2])
    if (v3Dot(row[0], pdum3) < 0) {
      for (i in 0..2) {
        scale[i] *= -1.0
        row[i][0] *= -1.0
        row[i][1] *= -1.0
        row[i][2] *= -1.0
      }
    }

    // Now, get the rotations out
    // Based on: http://nghiaho.com/?page_id=846
    val conv = 180 / Math.PI
    rotationDegrees[0] = roundTo3Places(-atan2(row[2][1], row[2][2]) * conv)
    rotationDegrees[1] =
        roundTo3Places(
            -atan2(-row[2][0], sqrt(row[2][1] * row[2][1] + row[2][2] * row[2][2])) * conv,
        )
    rotationDegrees[2] = roundTo3Places(-atan2(row[1][0], row[0][0]) * conv)
  }

  @JvmStatic
  public fun determinant(matrix: DoubleArray): Double {
    val m00 = matrix[0]
    val m01 = matrix[1]
    val m02 = matrix[2]
    val m03 = matrix[3]
    val m10 = matrix[4]
    val m11 = matrix[5]
    val m12 = matrix[6]
    val m13 = matrix[7]
    val m20 = matrix[8]
    val m21 = matrix[9]
    val m22 = matrix[10]
    val m23 = matrix[11]
    val m30 = matrix[12]
    val m31 = matrix[13]
    val m32 = matrix[14]
    val m33 = matrix[15]
    return (m03 * m12 * m21 * m30 - m02 * m13 * m21 * m30 - m03 * m11 * m22 * m30 +
        m01 * m13 * m22 * m30 +
        m02 * m11 * m23 * m30 - m01 * m12 * m23 * m30 - m03 * m12 * m20 * m31 +
        m02 * m13 * m20 * m31 +
        m03 * m10 * m22 * m31 - m00 * m13 * m22 * m31 - m02 * m10 * m23 * m31 +
        m00 * m12 * m23 * m31 +
        m03 * m11 * m20 * m32 - m01 * m13 * m20 * m32 - m03 * m10 * m21 * m32 +
        m00 * m13 * m21 * m32 +
        m01 * m10 * m23 * m32 - m00 * m11 * m23 * m32 - m02 * m11 * m20 * m33 +
        m01 * m12 * m20 * m33 +
        m02 * m10 * m21 * m33 - m00 * m12 * m21 * m33 - m01 * m10 * m22 * m33 +
        m00 * m11 * m22 * m33)
  }

  /**
   * Inverse of a matrix. Multiplying by the inverse is used in matrix math instead of division.
   *
   * Formula from:
   * http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
   */
  @JvmStatic
  public fun inverse(matrix: DoubleArray): DoubleArray {
    val det = determinant(matrix)
    if (isZero(det)) {
      return matrix
    }
    val m00 = matrix[0]
    val m01 = matrix[1]
    val m02 = matrix[2]
    val m03 = matrix[3]
    val m10 = matrix[4]
    val m11 = matrix[5]
    val m12 = matrix[6]
    val m13 = matrix[7]
    val m20 = matrix[8]
    val m21 = matrix[9]
    val m22 = matrix[10]
    val m23 = matrix[11]
    val m30 = matrix[12]
    val m31 = matrix[13]
    val m32 = matrix[14]
    val m33 = matrix[15]
    return doubleArrayOf(
        ((m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32) - m11 * m23 * m32 - m12 * m21 * m33 +
            m11 * m22 * m33) / det,
        (m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 -
            m01 * m22 * m33) / det,
        ((m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32) - m01 * m13 * m32 - m02 * m11 * m33 +
            m01 * m12 * m33) / det,
        (m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 -
            m01 * m12 * m23) / det,
        (m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 -
            m10 * m22 * m33) / det,
        ((m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32) - m00 * m23 * m32 - m02 * m20 * m33 +
            m00 * m22 * m33) / det,
        (m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 -
            m00 * m12 * m33) / det,
        ((m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22) - m00 * m13 * m22 - m02 * m10 * m23 +
            m00 * m12 * m23) / det,
        ((m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31) - m10 * m23 * m31 - m11 * m20 * m33 +
            m10 * m21 * m33) / det,
        (m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 -
            m00 * m21 * m33) / det,
        ((m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31) - m00 * m13 * m31 - m01 * m10 * m33 +
            m00 * m11 * m33) / det,
        (m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 -
            m00 * m11 * m23) / det,
        (m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 -
            m10 * m21 * m32) / det,
        ((m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31) - m00 * m22 * m31 - m01 * m20 * m32 +
            m00 * m21 * m32) / det,
        (m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 -
            m00 * m11 * m32) / det,
        ((m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21) - m00 * m12 * m21 - m01 * m10 * m22 +
            m00 * m11 * m22) / det,
    )
  }

  /** Turns columns into rows and rows into columns. */
  @JvmStatic
  public fun transpose(m: DoubleArray): DoubleArray {
    return doubleArrayOf(
        m[0],
        m[4],
        m[8],
        m[12],
        m[1],
        m[5],
        m[9],
        m[13],
        m[2],
        m[6],
        m[10],
        m[14],
        m[3],
        m[7],
        m[11],
        m[15],
    )
  }

  /** Based on: http://tog.acm.org/resources/GraphicsGems/gemsii/unmatrix.c */
  @JvmStatic
  public fun multiplyVectorByMatrix(v: DoubleArray, m: DoubleArray, result: DoubleArray) {
    val vx = v[0]
    val vy = v[1]
    val vz = v[2]
    val vw = v[3]
    result[0] = vx * m[0] + vy * m[4] + vz * m[8] + vw * m[12]
    result[1] = vx * m[1] + vy * m[5] + vz * m[9] + vw * m[13]
    result[2] = vx * m[2] + vy * m[6] + vz * m[10] + vw * m[14]
    result[3] = vx * m[3] + vy * m[7] + vz * m[11] + vw * m[15]
  }

  /** From: https://code.google.com/p/webgl-mjs/source/browse/mjs.js */
  @JvmStatic
  public fun v3Length(a: DoubleArray): Double {
    return sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2])
  }

  /** Based on: https://code.google.com/p/webgl-mjs/source/browse/mjs.js */
  @JvmStatic
  public fun v3Normalize(vector: DoubleArray, norm: Double): DoubleArray {
    val im = 1 / if (isZero(norm)) v3Length(vector) else norm
    return doubleArrayOf(vector[0] * im, vector[1] * im, vector[2] * im)
  }

  /**
   * The dot product of a and b, two 3-element vectors. From:
   * https://code.google.com/p/webgl-mjs/source/browse/mjs.js
   */
  @JvmStatic
  public fun v3Dot(a: DoubleArray, b: DoubleArray): Double {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
  }

  /**
   * From:
   * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
   */
  @JvmStatic
  public fun v3Combine(
      a: DoubleArray,
      b: DoubleArray,
      aScale: Double,
      bScale: Double,
  ): DoubleArray {
    return doubleArrayOf(
        aScale * a[0] + bScale * b[0],
        aScale * a[1] + bScale * b[1],
        aScale * a[2] + bScale * b[2],
    )
  }

  /**
   * From:
   * http://www.opensource.apple.com/source/WebCore/WebCore-514/platform/graphics/transforms/TransformationMatrix.cpp
   */
  @JvmStatic
  public fun v3Cross(a: DoubleArray, b: DoubleArray): DoubleArray {
    return doubleArrayOf(
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )
  }

  @JvmStatic
  public fun roundTo3Places(n: Double): Double {
    return Math.round(n * 1000.0) * 0.001
  }

  @JvmStatic
  public fun createIdentityMatrix(): DoubleArray {
    val res = DoubleArray(16)
    resetIdentityMatrix(res)
    return res
  }

  @JvmStatic
  public fun degreesToRadians(degrees: Double): Double {
    return degrees * Math.PI / 180
  }

  @JvmStatic
  public fun resetIdentityMatrix(matrix: DoubleArray) {
    matrix[14] = 0.0
    matrix[13] = matrix[14]
    matrix[12] = matrix[13]
    matrix[11] = matrix[12]
    matrix[9] = matrix[11]
    matrix[8] = matrix[9]
    matrix[7] = matrix[8]
    matrix[6] = matrix[7]
    matrix[4] = matrix[6]
    matrix[3] = matrix[4]
    matrix[2] = matrix[3]
    matrix[1] = matrix[2]
    matrix[15] = 1.0
    matrix[10] = matrix[15]
    matrix[5] = matrix[10]
    matrix[0] = matrix[5]
  }

  @JvmStatic
  public fun applyPerspective(m: DoubleArray, perspective: Double) {
    m[11] = -1 / perspective
  }

  @JvmStatic
  public fun applyScaleX(m: DoubleArray, factor: Double) {
    m[0] = factor
  }

  @JvmStatic
  public fun applyScaleY(m: DoubleArray, factor: Double) {
    m[5] = factor
  }

  public fun applyScaleZ(m: DoubleArray, factor: Double) {
    m[10] = factor
  }

  @JvmStatic
  public fun applyTranslate2D(m: DoubleArray, x: Double, y: Double) {
    m[12] = x
    m[13] = y
  }

  @JvmStatic
  public fun applyTranslate3D(m: DoubleArray, x: Double, y: Double, z: Double) {
    m[12] = x
    m[13] = y
    m[14] = z
  }

  @JvmStatic
  public fun applySkewX(m: DoubleArray, radians: Double) {
    m[4] = tan(radians)
  }

  @JvmStatic
  public fun applySkewY(m: DoubleArray, radians: Double) {
    m[1] = tan(radians)
  }

  @JvmStatic
  public fun applyRotateX(m: DoubleArray, radians: Double) {
    m[5] = cos(radians)
    m[6] = sin(radians)
    m[9] = -sin(radians)
    m[10] = cos(radians)
  }

  @JvmStatic
  public fun applyRotateY(m: DoubleArray, radians: Double) {
    m[0] = cos(radians)
    m[2] = -sin(radians)
    m[8] = sin(radians)
    m[10] = cos(radians)
  }

  // http://www.w3.org/TR/css3-transforms/#recomposing-to-a-2d-matrix
  @JvmStatic
  public fun applyRotateZ(m: DoubleArray, radians: Double) {
    m[0] = cos(radians)
    m[1] = sin(radians)
    m[4] = -sin(radians)
    m[5] = cos(radians)
  }

  public open class MatrixDecompositionContext {
    @JvmField public var perspective: DoubleArray = DoubleArray(4)
    @JvmField public var scale: DoubleArray = DoubleArray(3)
    @JvmField public var skew: DoubleArray = DoubleArray(3)
    @JvmField public var translation: DoubleArray = DoubleArray(3)
    @JvmField public var rotationDegrees: DoubleArray = DoubleArray(3)

    public fun reset() {
      resetArray(perspective)
      resetArray(scale)
      resetArray(skew)
      resetArray(translation)
      resetArray(rotationDegrees)
    }

    private companion object {
      private fun resetArray(arr: DoubleArray) {
        for (i in arr.indices) {
          arr[i] = 0.0
        }
      }
    }
  }
}
