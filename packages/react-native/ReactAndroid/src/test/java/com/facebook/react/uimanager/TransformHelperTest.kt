/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class TransformHelperTest {

  @Test
  fun testTransformHoldingANonFiniteNumberIsIgnored() {
    val operations =
        listOf(
            "perspective",
            "rotate",
            "rotateX",
            "rotateY",
            "rotateZ",
            "scale",
            "scaleX",
            "scaleY",
            "skewX",
            "skewY",
            "translateX",
            "translateY",
        )

    for (nonFiniteNumber in
        doubleArrayOf(Double.NaN, Double.POSITIVE_INFINITY, Double.NEGATIVE_INFINITY)) {
      val matrix = MatrixMathHelper.createIdentityMatrix()
      matrix[0] = nonFiniteNumber
      val transforms =
          operations.map { operation -> JavaOnlyMap.of(operation, nonFiniteNumber) } +
              listOf(
                  JavaOnlyMap.of("translate", JavaOnlyArray.of(nonFiniteNumber, 0.0)),
                  JavaOnlyMap.of("translate", JavaOnlyArray.of(0.0, nonFiniteNumber)),
                  JavaOnlyMap.of("matrix", JavaOnlyArray.of(*matrix.toTypedArray())),
              )

      for (transform in transforms) {
        assertThat(processTranslatedBy10(transform))
            .describedAs("$transform")
            .containsExactly(*MatrixMathHelper.createIdentityMatrix())
      }
    }
  }

  @Test
  fun testIgnoredTransformLeavesTheNextOneAsItIs() {
    val scaledXBy2 = JavaOnlyMap.of("scaleX", 2.0)
    val alone = processTranslatedBy10(scaledXBy2)
    assertThat(alone).isNotEqualTo(MatrixMathHelper.createIdentityMatrix())

    // The perspective returns before its operation is applied, and the NaN rotation reaches the
    // result's check: neither may leave the per-thread scratch matrix in the next transform.
    for (ignored in
        listOf(
            JavaOnlyMap.of("perspective", Double.POSITIVE_INFINITY),
            JavaOnlyMap.of("rotate", Double.NaN),
        )) {
      processTranslatedBy10(ignored)
      assertThat(processTranslatedBy10(scaledXBy2)).describedAs("$ignored").containsExactly(*alone)
    }
  }

  @Test
  fun testTransformWithAnOperandParsingToANonFiniteNumberIsIgnored() {
    for (transform in
        listOf(
            JavaOnlyMap.of("rotate", "NaNdeg"),
            JavaOnlyMap.of("skewX", "Infinityrad"),
            JavaOnlyMap.of("translateX", "NaN%"),
        )) {
      assertThat(processTranslatedBy10(transform))
          .describedAs("$transform")
          .containsExactly(*MatrixMathHelper.createIdentityMatrix())
    }
  }

  @Test
  fun testTranslatePastTheLargestFloatIsIgnored() {
    assertThat(processTranslatedBy10(JavaOnlyMap.of("translateY", 1e39)))
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
  }

  @Test
  fun testPerspectivePastTheLargestFloatIsIgnored() {
    assertThat(processTranslatedBy10(JavaOnlyMap.of("perspective", 1e39)))
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
  }

  @Test
  fun testAnglePastTheLargestFloatIsIgnored() {
    // An angle with a unit is held in degrees, so 1e37rad is past the largest float.
    for (angle in listOf("1e39deg", "1e37rad", "1e39")) {
      assertThat(processTranslatedBy10(JavaOnlyMap.of("rotate", angle)))
          .describedAs(angle)
          .containsExactly(*MatrixMathHelper.createIdentityMatrix())
    }
  }

  @Test
  fun testNumbersPastTheLargestFloatThatCancelOutAreIgnored() {
    val pastTheLargestFloat = MatrixMathHelper.createIdentityMatrix().apply { this[0] = 1e39 }
    for (transforms in
        listOf(
            JavaOnlyArray.of(
                JavaOnlyMap.of("translateX", 1e39),
                JavaOnlyMap.of("translateX", -1e39),
                JavaOnlyMap.of("translateX", 10.0),
            ),
            JavaOnlyArray.of(
                JavaOnlyMap.of("scaleX", 1e39),
                JavaOnlyMap.of("scaleX", 1e-39),
                JavaOnlyMap.of("translateX", 10.0),
            ),
            JavaOnlyArray.of(
                JavaOnlyMap.of("matrix", JavaOnlyArray.of(*pastTheLargestFloat.toTypedArray())),
                JavaOnlyMap.of("scaleX", 1e-39),
                JavaOnlyMap.of("translateX", 10.0),
            ),
            JavaOnlyArray.of(
                JavaOnlyMap.of("translate", JavaOnlyArray.of(0.0, 0.0, 1e39)),
                JavaOnlyMap.of("translate", JavaOnlyArray.of(0.0, 0.0, -1e39)),
                JavaOnlyMap.of("translateX", 10.0),
            ),
            JavaOnlyArray.of(
                JavaOnlyMap.of("translateX", "1e39"),
                JavaOnlyMap.of("translateX", "-1e39"),
                JavaOnlyMap.of("translateX", 10.0),
            ),
        )) {
      assertThat(processTransform(transforms))
          .describedAs("$transforms")
          .containsExactly(*MatrixMathHelper.createIdentityMatrix())
    }

    // About the top left corner, the shorthand's translation cancels its scale's in doubles.
    val shorthand =
        MatrixMathHelper.createIdentityMatrix().apply {
          this[0] = -2e37
          this[12] = 1e39
        }
    assertThat(
            processTransform(
                JavaOnlyArray.of(*shorthand.toTypedArray()),
                JavaOnlyArray.of(0.0, 0.0, 0.0),
            )
        )
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
  }

  @Test
  fun testPercentageThatResolvesPastTheLargestFloatIsIgnored() {
    assertThat(processTransform(JavaOnlyArray.of(JavaOnlyMap.of("translateX", "1e37%"))))
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
    assertThat(processTransform(scaledXBy2, JavaOnlyArray.of("1e37%", "50%", 0.0)))
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
  }

  @Test
  fun testTransformWhoseMatrixOverflowsAFloatIsIgnored() {
    assertThat(
            processTransform(
                JavaOnlyArray.of(JavaOnlyMap.of("scale", 1e20), JavaOnlyMap.of("scale", 1e20)),
            )
        )
        .containsExactly(*MatrixMathHelper.createIdentityMatrix())
  }

  @Test
  fun testTransformOriginHoldingANonFiniteNumberIsIgnored() {
    for (transformOrigin in
        listOf(
            JavaOnlyArray.of(Double.NaN, 0.0, 0.0),
            JavaOnlyArray.of(0.0, Double.POSITIVE_INFINITY, 0.0),
            JavaOnlyArray.of(0.0, 0.0, Double.NaN),
            JavaOnlyArray.of("NaN%", 0.0, 0.0),
        )) {
      assertThat(processTransform(scaledXBy2, transformOrigin))
          .describedAs("$transformOrigin")
          .containsExactly(*scaledXBy2AboutTheCenter)
    }
  }

  @Test
  fun testTransformOriginPastTheLargestFloatIsIgnored() {
    for (transformOrigin in
        listOf(JavaOnlyArray.of(1e39, 0.0, 0.0), JavaOnlyArray.of("1e39%", 0.0, 0.0))) {
      assertThat(processTransform(scaledXBy2, transformOrigin))
          .describedAs("$transformOrigin")
          .containsExactly(*scaledXBy2AboutTheCenter)
    }
  }

  @Test
  fun testFiniteTransformOriginMovesThePivot() {
    val aboutTheTopLeftCorner =
        MatrixMathHelper.createIdentityMatrix().apply {
          this[0] = 2.0
          this[12] = 50.0
        }
    assertThat(processTransform(scaledXBy2, JavaOnlyArray.of(0.0, 0.0, 0.0)))
        .containsExactly(*aboutTheTopLeftCorner)
  }

  @Test
  fun testTransformOriginEntryDeclaringNoNumberLeavesItsAxisAtTheCenter() {
    val aboutTheTopEdge =
        MatrixMathHelper.createIdentityMatrix().apply {
          this[0] = 2.0
          this[5] = 2.0
          this[13] = 50.0
        }
    // Neither a word nor a percentage that is not a number declares a length.
    for (transformOrigin in
        listOf(JavaOnlyArray.of("center", "0%", null), JavaOnlyArray.of("abc%", "0%", 0.0))) {
      assertThat(processTransform(JavaOnlyArray.of(JavaOnlyMap.of("scale", 2.0)), transformOrigin))
          .describedAs("$transformOrigin")
          .containsExactly(*aboutTheTopEdge)
    }
  }

  @Test
  fun testPerspectiveBelowOnePixelRendersAsOnePixel() {
    assertThat(processTransform(JavaOnlyArray.of(JavaOnlyMap.of("perspective", 0.0)))[11])
        .isEqualTo(-1.0)
  }

  private val scaledXBy2: JavaOnlyArray
    get() = JavaOnlyArray.of(JavaOnlyMap.of("scaleX", 2.0))

  private val scaledXBy2AboutTheCenter: DoubleArray
    get() = MatrixMathHelper.createIdentityMatrix().apply { this[0] = 2.0 }

  private fun processTranslatedBy10(transform: JavaOnlyMap): DoubleArray =
      processTransform(JavaOnlyArray.of(JavaOnlyMap.of("translateX", 10.0), transform))

  private fun processTransform(
      transforms: JavaOnlyArray,
      transformOrigin: JavaOnlyArray? = null,
  ): DoubleArray =
      DoubleArray(16).also { result ->
        TransformHelper.processTransform(transforms, result, 100f, 100f, transformOrigin)
      }
}
