/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Matrix
import android.util.DisplayMetrics
import com.facebook.react.bridge.JavaOnlyArray
import com.facebook.react.bridge.JavaOnlyMap
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlagsForTests
import com.facebook.testutils.shadows.ShadowSoLoader
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.within
import org.junit.After
import org.junit.Before
import org.junit.Test
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config

/** Tests for [SkewMatrixHelper]. */
@RunWith(RobolectricTestRunner::class)
@Config(shadows = [ShadowSoLoader::class])
class SkewMatrixHelperTest {

  @Before
  fun setUp() {
    ReactNativeFeatureFlagsForTests.setUp()
    val metrics =
        DisplayMetrics().apply {
          density = 1f
          widthPixels = 1080
          heightPixels = 1920
          densityDpi = DisplayMetrics.DENSITY_MEDIUM
        }
    DisplayMetricsHolder.setScreenDisplayMetrics(metrics)
  }

  @After
  fun tearDown() {
    DisplayMetricsHolder.setScreenDisplayMetrics(null)
  }

  @Test
  fun isAffine2DTransformWithSkew_trueForSkewX() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewX", "20deg"))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isTrue()
  }

  @Test
  fun isAffine2DTransformWithSkew_trueForSkewY() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewY", "10deg"))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isTrue()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForRotate() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("rotate", "30deg"))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForEmpty() {
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(JavaOnlyArray())).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForRawMatrixShorthand() {
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(identityMatrixShorthand())).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForRotateX() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("rotateX", "10deg"))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForRotateY() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("rotateY", "10deg"))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForPerspective() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("perspective", 800.0))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForMatrix() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("matrix", identityMatrixShorthand()))
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_falseForTranslateWithZ() {
    val translate = JavaOnlyArray.of(10.0, 20.0, 5.0)
    val transforms =
        JavaOnlyArray.of(
            JavaOnlyMap.of("skewX", "20deg"),
            JavaOnlyMap.of("translate", translate),
        )
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isFalse()
  }

  @Test
  fun isAffine2DTransformWithSkew_trueForSkewScaleTranslateRotateZ() {
    val transforms =
        JavaOnlyArray.of(
            JavaOnlyMap.of("skewX", "20deg"),
            JavaOnlyMap.of("scale", 1.5),
            JavaOnlyMap.of("translate", JavaOnlyArray.of(10.0, 20.0)),
            JavaOnlyMap.of("rotateZ", "30deg"),
        )
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isTrue()
  }

  @Test
  fun buildAffine2DMatrix_pureSkewX_producesExpectedEntries() {
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewX", "20deg"))
    val values = matrixValues(SkewMatrixHelper.buildAffine2DMatrix(transforms, 0f, 0f, null))
    val tan20 = Math.tan(Math.toRadians(20.0)).toFloat()
    assertThat(values[Matrix.MSCALE_X]).isCloseTo(1f, within(EPSILON))
    assertThat(values[Matrix.MSCALE_Y]).isCloseTo(1f, within(EPSILON))
    assertThat(values[Matrix.MSKEW_X]).isCloseTo(tan20, within(EPSILON))
    assertThat(values[Matrix.MSKEW_Y]).isCloseTo(0f, within(EPSILON))
    assertThat(values[Matrix.MTRANS_X]).isCloseTo(0f, within(EPSILON))
    assertThat(values[Matrix.MTRANS_Y]).isCloseTo(0f, within(EPSILON))
  }

  @Test
  fun buildAffine2DMatrix_scaleThenTranslate_appliesInCorrectOrder() {
    // [scale: 2, translateX: 30] under pre-multiplication -> M = Scale * Translate.
    // Applied to a point, translate runs first; mapping (0, 0) gives (60, 0).
    val transforms =
        JavaOnlyArray.of(
            JavaOnlyMap.of("scale", 2.0),
            JavaOnlyMap.of("translateX", 30.0),
        )
    val values = matrixValues(SkewMatrixHelper.buildAffine2DMatrix(transforms, 0f, 0f, null))
    assertThat(values[Matrix.MSCALE_X]).isCloseTo(2f, within(EPSILON))
    assertThat(values[Matrix.MSCALE_Y]).isCloseTo(2f, within(EPSILON))
    assertThat(values[Matrix.MTRANS_X]).isCloseTo(60f, within(EPSILON))
    assertThat(values[Matrix.MTRANS_Y]).isCloseTo(0f, within(EPSILON))
  }

  @Test
  fun buildAffine2DMatrix_pivotIsViewCenter_whenTransformOriginNull() {
    // skewX 20deg around pivot (50, 50) introduces MTRANS_X = -tan(20deg) * 50.
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewX", "20deg"))
    val values = matrixValues(SkewMatrixHelper.buildAffine2DMatrix(transforms, 100f, 100f, null))
    val tan20 = Math.tan(Math.toRadians(20.0)).toFloat()
    assertThat(values[Matrix.MSKEW_X]).isCloseTo(tan20, within(EPSILON))
    assertThat(values[Matrix.MTRANS_X]).isCloseTo(-tan20 * 50f, within(EPSILON))
    assertThat(values[Matrix.MTRANS_Y]).isCloseTo(0f, within(EPSILON))
  }

  @Test
  fun buildAffine2DMatrix_pivotRespectsTransformOrigin_numberValues() {
    // Origin (0, 0) DIP overrides the view-center default; no pivot translation.
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewX", "20deg"))
    val origin = JavaOnlyArray.of(0.0, 0.0)
    val values = matrixValues(SkewMatrixHelper.buildAffine2DMatrix(transforms, 100f, 100f, origin))
    val tan20 = Math.tan(Math.toRadians(20.0)).toFloat()
    assertThat(values[Matrix.MSKEW_X]).isCloseTo(tan20, within(EPSILON))
    assertThat(values[Matrix.MTRANS_X]).isCloseTo(0f, within(EPSILON))
  }

  @Test
  fun buildAffine2DMatrix_pivotRespectsTransformOrigin_percentValues() {
    // "0%" "0%" -> pivot (0, 0); no pivot translation introduced.
    val transforms = JavaOnlyArray.of(JavaOnlyMap.of("skewX", "20deg"))
    val origin = JavaOnlyArray.of("0%", "0%")
    val values = matrixValues(SkewMatrixHelper.buildAffine2DMatrix(transforms, 100f, 100f, origin))
    assertThat(values[Matrix.MTRANS_X]).isCloseTo(0f, within(EPSILON))
  }

  @Test
  fun emptyMapInTransforms_doesNotThrow() {
    // Regression test for T274692242: an empty map in the transforms array caused
    // NoSuchElementException from keySetIterator().nextKey() without hasNextKey() guard.
    val transforms =
        JavaOnlyArray.of(
            JavaOnlyMap(), // empty map — previously crashed
            JavaOnlyMap.of("skewX", "20deg"),
        )

    // isAffine2DTransformWithSkew must not throw and should still detect skew
    assertThat(SkewMatrixHelper.isAffine2DTransformWithSkew(transforms)).isTrue()

    // buildAffine2DMatrix must not throw when encountering the empty map
    val matrix = SkewMatrixHelper.buildAffine2DMatrix(transforms, 100f, 100f, null)
    val values = matrixValues(matrix)
    // The empty map is skipped; only the skewX entry contributes
    val tan20 = Math.tan(Math.toRadians(20.0)).toFloat()
    assertThat(values[Matrix.MSKEW_X]).isCloseTo(tan20, within(EPSILON))
  }

  private fun matrixValues(matrix: Matrix): FloatArray {
    val values = FloatArray(9)
    matrix.getValues(values)
    return values
  }

  private fun identityMatrixShorthand(): JavaOnlyArray {
    val arr = JavaOnlyArray()
    for (i in 0 until 16) {
      arr.pushDouble(if (i == 0 || i == 5 || i == 10 || i == 15) 1.0 else 0.0)
    }
    return arr
  }

  private companion object {
    private const val EPSILON = 1e-4f
  }
}
