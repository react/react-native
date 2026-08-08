/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.react.uimanager.MatrixMathHelper.MatrixDecompositionContext
import kotlin.math.cos
import kotlin.math.sin
import org.assertj.core.api.Assertions.assertThat
import org.junit.Before
import org.junit.Test

/** Test for [MatrixMathHelper] */
class MatrixMathHelperTest {

  @Before
  fun setup() {
    ReactNativeFeatureFlagsForTests.setUp()
  }

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateZaxisAngles() {
    val ctx = MatrixDecompositionContext()

    MatrixMathHelper.decomposeMatrix(
        doubleArrayOf(
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        ),
        ctx,
    )

    assertThat(ctx.rotationDegrees).containsSequence(0.0, 0.0, 0.0)

    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0, 100.0, 115.0, 120.0, 133.0, 167.0)
    for (angle in angles) {
      verifyZRotatedMatrix(angle, 0.0, 0.0, angle)
      verifyZRotatedMatrix(-angle, 0.0, 0.0, -angle)
    }

    verifyZRotatedMatrix(180.0, 0.0, 0.0, 180.0)

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyZRotatedMatrix(222.0, 0.0, 0.0, -138.0)

    verifyZRotatedMatrix(270.0, 0.0, 0.0, -90.0)

    // 360 is expressed as 0
    verifyZRotatedMatrix(360.0, 0.0, 0.0, 0.0)

    verifyZRotatedMatrix(33.33333333, 0.0, 0.0, 33.333)

    verifyZRotatedMatrix(86.75309, 0.0, 0.0, 86.753)

    verifyZRotatedMatrix(42.00000000001, 0.0, 0.0, 42.0)

    verifyZRotatedMatrix(42.99999999999, 0.0, 0.0, 43.0)

    verifyZRotatedMatrix(42.99999999999, 0.0, 0.0, 43.0)

    verifyZRotatedMatrix(42.49999999999, 0.0, 0.0, 42.5)

    verifyZRotatedMatrix(42.55555555555, 0.0, 0.0, 42.556)
  }

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateYaxisAngles() {
    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0)
    for (angle in angles) {
      verifyYRotatedMatrix(angle, 0.0, angle, 0.0)
      verifyYRotatedMatrix(-angle, 0.0, -angle, 0.0)
    }

    // all values are between -90 and 90;
    // change of sign and direction in the third and fourth quadrant
    verifyYRotatedMatrix(222.0, -180.0, -42.0, -180.0)

    verifyYRotatedMatrix(270.0, -180.0, -90.0, -180.0)

    verifyYRotatedMatrix(360.0, 0.0, 0.0, 0.0)
  }

  @Test
  fun testDecomposing4x4MatrixToProduceAccurateXaxisAngles() {
    val angles = doubleArrayOf(30.0, 45.0, 60.0, 75.0, 90.0, 100.0, 110.0, 120.0, 133.0, 167.0)
    for (angle in angles) {
      verifyXRotatedMatrix(angle, angle, 0.0, 0.0)
      verifyXRotatedMatrix(-angle, -angle, 0.0, 0.0)
    }

    // all values are between 0 and 180;
    // change of sign and direction in the third and fourth quadrant
    verifyXRotatedMatrix(222.0, -138.0, 0.0, 0.0)

    verifyXRotatedMatrix(270.0, -90.0, 0.0, 0.0)

    verifyXRotatedMatrix(360.0, 0.0, 0.0, 0.0)
  }

  @Test
  fun testDecomposingComplex4x4MatrixToProduceAccurateAngles() {
    verifyRotatedMatrix(10.0, -80.0, 0.0, 10.0, -80.0, 0.0)
    // x and y will flip
    verifyRotatedMatrix(10.0, -95.0, 0.0, -170.0, -85.0, -180.0)
  }

  @Test
  fun testMultiplyInto() {
    val matrixA =
        doubleArrayOf(
            1.0,
            2.0,
            3.0,
            4.0,
            5.0,
            6.0,
            7.0,
            8.0,
            9.0,
            10.0,
            11.0,
            12.0,
            13.0,
            14.0,
            15.0,
            16.0,
        )
    val matrixB =
        doubleArrayOf(
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
        )
    val result = DoubleArray(16)

    MatrixMathHelper.multiplyInto(result, matrixA, matrixB)

    val expected =
        doubleArrayOf(
            2.0,
            4.0,
            6.0,
            8.0,
            10.0,
            12.0,
            14.0,
            16.0,
            18.0,
            20.0,
            22.0,
            24.0,
            26.0,
            28.0,
            30.0,
            32.0,
        )

    assertThat(result).containsExactly(*expected)
  }

  @Test
  fun testCreateIdentityMatrix() {
    val identity = MatrixMathHelper.createIdentityMatrix()

    val expected =
        doubleArrayOf(
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        )

    assertThat(identity).containsExactly(*expected)
  }

  @Test
  fun testResetIdentityMatrix() {
    val matrix =
        doubleArrayOf(
            5.0,
            2.0,
            3.0,
            4.0,
            1.0,
            6.0,
            7.0,
            8.0,
            9.0,
            10.0,
            11.0,
            12.0,
            13.0,
            14.0,
            15.0,
            16.0,
        )

    MatrixMathHelper.resetIdentityMatrix(matrix)

    val expected =
        doubleArrayOf(
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        )

    assertThat(matrix).containsExactly(*expected)
  }

  @Test
  fun testDeterminant() {
    val identityMatrix = MatrixMathHelper.createIdentityMatrix()
    assertThat(MatrixMathHelper.determinant(identityMatrix)).isEqualTo(1.0)

    val matrix =
        doubleArrayOf(
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
        )
    assertThat(MatrixMathHelper.determinant(matrix)).isEqualTo(16.0)
  }

  @Test
  fun testInverse() {
    val matrix =
        doubleArrayOf(
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
        )

    val inverse = MatrixMathHelper.inverse(matrix)

    val expected =
        doubleArrayOf(
            0.5,
            0.0,
            0.0,
            0.0,
            0.0,
            0.5,
            0.0,
            0.0,
            0.0,
            0.0,
            0.5,
            0.0,
            0.0,
            0.0,
            0.0,
            0.5,
        )

    assertThat(inverse).containsExactly(*expected)
  }

  @Test
  fun testTranspose() {
    val matrix =
        doubleArrayOf(
            1.0,
            2.0,
            3.0,
            4.0,
            5.0,
            6.0,
            7.0,
            8.0,
            9.0,
            10.0,
            11.0,
            12.0,
            13.0,
            14.0,
            15.0,
            16.0,
        )

    val transposed = MatrixMathHelper.transpose(matrix)

    val expected =
        doubleArrayOf(
            1.0,
            5.0,
            9.0,
            13.0,
            2.0,
            6.0,
            10.0,
            14.0,
            3.0,
            7.0,
            11.0,
            15.0,
            4.0,
            8.0,
            12.0,
            16.0,
        )

    assertThat(transposed).containsExactly(*expected)
  }

  @Test
  fun testMultiplyVectorByMatrix() {
    val vector = doubleArrayOf(1.0, 2.0, 3.0, 1.0)
    val matrix =
        doubleArrayOf(
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            2.0,
            0.0,
            0.0,
            0.0,
            0.0,
            1.0,
        )
    val result = DoubleArray(4)

    MatrixMathHelper.multiplyVectorByMatrix(vector, matrix, result)

    val expected = doubleArrayOf(2.0, 4.0, 6.0, 1.0)
    assertThat(result).containsExactly(*expected)
  }

  @Test
  fun testV3Length() {
    val vector = doubleArrayOf(3.0, 4.0, 0.0)
    val length = MatrixMathHelper.v3Length(vector)
    assertThat(length).isEqualTo(5.0)

    val unitVector = doubleArrayOf(1.0, 0.0, 0.0)
    assertThat(MatrixMathHelper.v3Length(unitVector)).isEqualTo(1.0)
  }

  @Test
  fun testV3Normalize() {
    val vector = doubleArrayOf(3.0, 4.0, 0.0)
    val norm = MatrixMathHelper.v3Length(vector)

    val result = MatrixMathHelper.v3Normalize(vector, norm)

    val expected = doubleArrayOf(0.6, 0.8, 0.0)
    assertThat(result[0]).isCloseTo(expected[0], org.assertj.core.data.Offset.offset(1e-10))
    assertThat(result[1]).isCloseTo(expected[1], org.assertj.core.data.Offset.offset(1e-10))
    assertThat(result[2]).isCloseTo(expected[2], org.assertj.core.data.Offset.offset(1e-10))

    // Verify the normalized vector has length 1
    assertThat(MatrixMathHelper.v3Length(result))
        .isCloseTo(1.0, org.assertj.core.data.Offset.offset(1e-10))
  }

  @Test
  fun testV3Dot() {
    val vectorA = doubleArrayOf(1.0, 2.0, 3.0)
    val vectorB = doubleArrayOf(4.0, 5.0, 6.0)

    val dotProduct = MatrixMathHelper.v3Dot(vectorA, vectorB)

    // 1*4 + 2*5 + 3*6 = 4 + 10 + 18 = 32
    assertThat(dotProduct).isEqualTo(32.0)

    // Test orthogonal vectors
    val orthogonalA = doubleArrayOf(1.0, 0.0, 0.0)
    val orthogonalB = doubleArrayOf(0.0, 1.0, 0.0)
    assertThat(MatrixMathHelper.v3Dot(orthogonalA, orthogonalB)).isEqualTo(0.0)
  }

  @Test
  fun testV3Combine() {
    val vectorA = doubleArrayOf(1.0, 2.0, 3.0)
    val vectorB = doubleArrayOf(4.0, 5.0, 6.0)

    val result = MatrixMathHelper.v3Combine(vectorA, vectorB, 2.0, 3.0)

    // result = 2*vectorA + 3*vectorB = 2*(1,2,3) + 3*(4,5,6) = (2,4,6) + (12,15,18) = (14,19,24)
    val expected = doubleArrayOf(14.0, 19.0, 24.0)
    assertThat(result).containsExactly(*expected)
  }

  @Test
  fun testV3Cross() {
    val vectorA = doubleArrayOf(1.0, 0.0, 0.0)
    val vectorB = doubleArrayOf(0.0, 1.0, 0.0)

    val result = MatrixMathHelper.v3Cross(vectorA, vectorB)

    // Cross product of (1,0,0) x (0,1,0) = (0,0,1)
    val expected = doubleArrayOf(0.0, 0.0, 1.0)
    assertThat(result).containsExactly(*expected)

    // Test another cross product: (1,2,3) x (4,5,6)
    val vectorC = doubleArrayOf(1.0, 2.0, 3.0)
    val vectorD = doubleArrayOf(4.0, 5.0, 6.0)

    val result2 = MatrixMathHelper.v3Cross(vectorC, vectorD)

    // (1,2,3) x (4,5,6) = (2*6-3*5, 3*4-1*6, 1*5-2*4) = (12-15, 12-6, 5-8) = (-3,6,-3)
    val expected2 = doubleArrayOf(-3.0, 6.0, -3.0)
    assertThat(result2).containsExactly(*expected2)
  }

  @Test
  fun testRoundTo3Places() {
    assertThat(MatrixMathHelper.roundTo3Places(1.23456789)).isEqualTo(1.235)
    assertThat(MatrixMathHelper.roundTo3Places(1.2344)).isEqualTo(1.234)
    assertThat(MatrixMathHelper.roundTo3Places(1.0)).isEqualTo(1.0)
    assertThat(MatrixMathHelper.roundTo3Places(-1.23456789)).isEqualTo(-1.235)
  }

  @Test
  fun testDegreesToRadians() {
    assertThat(MatrixMathHelper.degreesToRadians(0.0)).isEqualTo(0.0)
    assertThat(MatrixMathHelper.degreesToRadians(90.0))
        .isCloseTo(Math.PI / 2, org.assertj.core.data.Offset.offset(1e-10))
    assertThat(MatrixMathHelper.degreesToRadians(180.0))
        .isCloseTo(Math.PI, org.assertj.core.data.Offset.offset(1e-10))
    assertThat(MatrixMathHelper.degreesToRadians(360.0))
        .isCloseTo(2 * Math.PI, org.assertj.core.data.Offset.offset(1e-10))
  }

  @Test
  fun testApplyPerspective() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyPerspective(matrix, 100.0)

    // Perspective should modify the matrix[11] element
    assertThat(matrix[11]).isEqualTo(-0.01)

    // Other elements should remain unchanged for identity matrix
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyScaleX() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyScaleX(matrix, 2.0)

    // ScaleX should modify the matrix[0] element
    assertThat(matrix[0]).isEqualTo(2.0)

    // Other diagonal elements should remain unchanged
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyScaleY() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyScaleY(matrix, 3.0)

    // ScaleY should modify the matrix[5] element
    assertThat(matrix[5]).isEqualTo(3.0)

    // Other diagonal elements should remain unchanged
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyScaleZ() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyScaleZ(matrix, 4.0)

    // ScaleZ should modify the matrix[10] element
    assertThat(matrix[10]).isEqualTo(4.0)

    // Other diagonal elements should remain unchanged
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyTranslate2D() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyTranslate2D(matrix, 10.0, 20.0)

    // Translation should modify the matrix[12] and matrix[13] elements
    assertThat(matrix[12]).isEqualTo(10.0)
    assertThat(matrix[13]).isEqualTo(20.0)

    // Other elements should remain unchanged for identity matrix
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
    assertThat(matrix[14]).isEqualTo(0.0) // Z translation should remain 0
  }

  @Test
  fun testApplyTranslate3D() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    MatrixMathHelper.applyTranslate3D(matrix, 10.0, 20.0, 30.0)

    // Translation should modify the matrix[12], matrix[13], and matrix[14] elements
    assertThat(matrix[12]).isEqualTo(10.0)
    assertThat(matrix[13]).isEqualTo(20.0)
    assertThat(matrix[14]).isEqualTo(30.0)

    // Other elements should remain unchanged for identity matrix
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyRotateX() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    val angle = Math.PI / 4 // 45 degrees
    MatrixMathHelper.applyRotateX(matrix, angle)

    // For X rotation, elements [5], [6], [9], [10] should be modified
    assertThat(matrix[5]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[6]).isCloseTo(sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[9]).isCloseTo(-sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[10]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))

    // Other diagonal elements should remain unchanged
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyRotateY() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    val angle = Math.PI / 4 // 45 degrees
    MatrixMathHelper.applyRotateY(matrix, angle)

    // For Y rotation, elements [0], [2], [8], [10] should be modified
    assertThat(matrix[0]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[2]).isCloseTo(-sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[8]).isCloseTo(sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[10]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))

    // Other diagonal elements should remain unchanged
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplyRotateZ() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    val angle = Math.PI / 4 // 45 degrees
    MatrixMathHelper.applyRotateZ(matrix, angle)

    // For Z rotation, elements [0], [1], [4], [5] should be modified
    assertThat(matrix[0]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[1]).isCloseTo(sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[4]).isCloseTo(-sin(angle), org.assertj.core.data.Offset.offset(1e-10))
    assertThat(matrix[5]).isCloseTo(cos(angle), org.assertj.core.data.Offset.offset(1e-10))

    // Other diagonal elements should remain unchanged
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplySkewX() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    val angle = Math.PI / 6 // 30 degrees
    MatrixMathHelper.applySkewX(matrix, angle)

    // For X skew, element [4] should be modified with tan(angle)
    assertThat(matrix[4])
        .isCloseTo(kotlin.math.tan(angle), org.assertj.core.data.Offset.offset(1e-10))

    // Other diagonal elements should remain unchanged
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  @Test
  fun testApplySkewY() {
    val matrix = MatrixMathHelper.createIdentityMatrix()
    val angle = Math.PI / 6 // 30 degrees
    MatrixMathHelper.applySkewY(matrix, angle)

    // For Y skew, element [1] should be modified with tan(angle)
    assertThat(matrix[1])
        .isCloseTo(kotlin.math.tan(angle), org.assertj.core.data.Offset.offset(1e-10))

    // Other diagonal elements should remain unchanged
    assertThat(matrix[0]).isEqualTo(1.0)
    assertThat(matrix[5]).isEqualTo(1.0)
    assertThat(matrix[10]).isEqualTo(1.0)
    assertThat(matrix[15]).isEqualTo(1.0)
  }

  private fun verifyZRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateZ(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyYRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateY(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyXRotatedMatrix(degrees: Double, rotX: Double, rotY: Double, rotZ: Double) {
    val ctx = MatrixDecompositionContext()
    val matrix = createRotateX(degreesToRadians(degrees))

    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  private fun verifyRotatedMatrix(
      degreesX: Double,
      degreesY: Double,
      degreesZ: Double,
      rotX: Double,
      rotY: Double,
      rotZ: Double,
  ) {
    val ctx = MatrixDecompositionContext()
    val matrixX = createRotateX(degreesToRadians(degreesX))
    val matrixY = createRotateY(degreesToRadians(degreesY))
    val matrixZ = createRotateZ(degreesToRadians(degreesZ))
    val matrix = MatrixMathHelper.createIdentityMatrix()

    MatrixMathHelper.multiplyInto(matrix, matrix, matrixX)
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixY)
    MatrixMathHelper.multiplyInto(matrix, matrix, matrixZ)
    MatrixMathHelper.decomposeMatrix(matrix, ctx)

    assertThat(ctx.rotationDegrees).containsSequence(rotX, rotY, rotZ)
  }

  companion object {
    private fun degreesToRadians(degrees: Double): Double {
      return degrees * Math.PI / 180
    }

    private fun createRotateZ(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[0] = cos(radians)
      mat[1] = sin(radians)
      mat[4] = -sin(radians)
      mat[5] = cos(radians)

      return mat
    }

    private fun createRotateY(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[0] = cos(radians)
      mat[2] = -sin(radians)
      mat[8] = sin(radians)
      mat[10] = cos(radians)

      return mat
    }

    private fun createRotateX(radians: Double): DoubleArray {
      val mat = MatrixMathHelper.createIdentityMatrix()
      mat[5] = cos(radians)
      mat[6] = sin(radians)
      mat[9] = -sin(radians)
      mat[10] = cos(radians)

      return mat
    }
  }
}
