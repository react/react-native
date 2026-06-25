/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.annotation.SuppressLint
import android.annotation.TargetApi
import android.graphics.BlendMode
import android.graphics.BlendModeColorFilter
import android.graphics.Color
import android.graphics.ColorMatrix
import android.graphics.ColorMatrixColorFilter
import android.graphics.RenderEffect
import android.graphics.Shader
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.uimanager.PixelUtil.dpToPx
import kotlin.math.cos
import kotlin.math.sin

/**
 * Helper object for parsing and applying CSS filter effects on Android S+ (API 31+).
 *
 * This object provides utilities to convert CSS filter arrays into Android [RenderEffect] chains
 * and [ColorMatrixColorFilter] objects. Supports filters like blur, brightness, contrast,
 * grayscale, sepia, saturate, hue-rotate, invert, opacity, and drop-shadow.
 *
 * @see <a href="https://www.w3.org/TR/filter-effects-1/">CSS Filter Effects Module Level 1</a>
 */
@SuppressLint("UseRequiresApi")
@TargetApi(31)
internal object FilterHelper {

  /**
   * Parses a ReadableArray of CSS filter definitions into a chained [RenderEffect].
   *
   * @param filters The array of filter definitions, or null
   * @return A chained RenderEffect representing all filters, or null if no filters provided
   * @throws IllegalArgumentException if an invalid filter name is encountered
   */
  @JvmStatic
  fun parseFilters(filters: ReadableArray?): RenderEffect? {
    filters ?: return null
    var chainedEffects: RenderEffect? = null
    for (i in 0 until filters.size()) {
      val filter = checkNotNull(filters.getMap(i)).entryIterator.next()
      val filterName = filter.key

      chainedEffects =
          when (filterName) {
            "brightness" ->
                createBrightnessEffect((filter.value as Double).toFloat(), chainedEffects)
            "contrast" -> createContrastEffect((filter.value as Double).toFloat(), chainedEffects)
            "grayscale" -> createGrayscaleEffect((filter.value as Double).toFloat(), chainedEffects)
            "sepia" -> createSepiaEffect((filter.value as Double).toFloat(), chainedEffects)
            "saturate" -> createSaturateEffect((filter.value as Double).toFloat(), chainedEffects)
            "hueRotate" -> createHueRotateEffect((filter.value as Double).toFloat(), chainedEffects)
            "invert" -> createInvertEffect((filter.value as Double).toFloat(), chainedEffects)
            "blur" -> createBlurEffect((filter.value as Double).toFloat(), chainedEffects)
            "opacity" -> createOpacityEffect((filter.value as Double).toFloat(), chainedEffects)
            "dropShadow" ->
                parseAndCreateDropShadowEffect(filter.value as ReadableMap, chainedEffects)
            else -> throw IllegalArgumentException("Invalid filter name: $filterName")
          }
    }
    return chainedEffects
  }

  @JvmStatic
  fun parseColorMatrixFilters(filters: ReadableArray?): ColorMatrixColorFilter? {
    filters ?: return null
    // New ColorMatrix objects represent the identity matrix
    val resultColorMatrix = ColorMatrix()
    for (i in 0 until filters.size()) {
      val filter = checkNotNull(filters.getMap(i)).entryIterator.next()
      val filterName = filter.key
      val amount = (filter.value as Double).toFloat()

      val tempColorMatrix =
          when (filterName) {
            "brightness" -> createBrightnessColorMatrix(amount)
            "contrast" -> createContrastColorMatrix(amount)
            "grayscale" -> createGrayscaleColorMatrix(amount)
            "sepia" -> createSepiaColorMatrix(amount)
            "saturate" -> createSaturateColorMatrix(amount)
            "hueRotate" -> createHueRotateColorMatrix(amount)
            "invert" -> createInvertColorMatrix(amount)
            "opacity" -> createOpacityColorMatrix(amount)
            else -> throw IllegalArgumentException("Invalid color matrix filter: $filterName")
          }

      resultColorMatrix.preConcat(tempColorMatrix)
    }

    return ColorMatrixColorFilter(resultColorMatrix)
  }

  @JvmStatic
  fun isOnlyColorMatrixFilters(filters: ReadableArray?): Boolean {
    if (filters == null || filters.size() == 0) {
      return false
    }

    for (i in 0 until filters.size()) {
      val filter = checkNotNull(filters.getMap(i)).entryIterator.next()
      val filterName = filter.key
      if (filterName == "blur" || filterName == "dropShadow") {
        return false
      }
    }
    return true
  }

  // https://www.w3.org/TR/filter-effects-1/#blurEquivalent
  fun createBlurEffect(sigma: Float, chainedEffects: RenderEffect? = null): RenderEffect? {
    if (sigma <= 0.5) {
      return null
    }

    val radius: Float = sigmaToRadius(sigma)
    return if (chainedEffects == null) {
      RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.DECAL)
    } else {
      RenderEffect.createBlurEffect(radius, radius, chainedEffects, Shader.TileMode.DECAL)
    }
  }

  // https://www.w3.org/TR/filter-effects-1/#brightnessEquivalent
  fun createBrightnessEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createBrightnessColorMatrix(amount), chainedEffects)
  }

  private fun createBrightnessColorMatrix(amount: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setScale(amount, amount, amount, 1f)
    return matrix
  }

  // https://www.w3.org/TR/filter-effects-1/#opacityEquivalent
  fun createOpacityEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createOpacityColorMatrix(amount), chainedEffects)
  }

  // https://www.w3.org/TR/filter-effects-1/#dropshadowEquivalent
  fun createDropShadowEffect(
      offsetX: Float,
      offsetY: Float,
      blurRadius: Float,
      color: Int,
      chainedEffects: RenderEffect? = null,
  ): RenderEffect {
    val identity: RenderEffect
    val offsetEffect: RenderEffect

    /*
     * identity is set to an offset RenderEffect of 0 to keep track of the identity/original content.
     * we then create offset effect for the first step of the shadow
     */
    if (chainedEffects == null) {
      identity = RenderEffect.createOffsetEffect(0f, 0f)
      offsetEffect = RenderEffect.createOffsetEffect(offsetX, offsetY)
    } else {
      identity = RenderEffect.createOffsetEffect(0f, 0f, chainedEffects)
      offsetEffect = RenderEffect.createOffsetEffect(offsetX, offsetY, chainedEffects)
    }

    /*
     * create color effect, blend with offset effect with SRC_IN and apply blur on top
     * SRC_IN finds the alpha intersection of colorEffect and offset
     * https://developer.android.com/reference/android/graphics/BlendMode#SRC_IN
     */
    val colorEffect: RenderEffect =
        RenderEffect.createColorFilterEffect(
            BlendModeColorFilter(color, BlendMode.SRC_IN),
            offsetEffect,
        )
    val blurEffect: RenderEffect =
        RenderEffect.createBlurEffect(blurRadius, blurRadius, colorEffect, Shader.TileMode.DECAL)

    /*
     * at this point blurEffect contains all of drop-shadow's combined effects (offset, color & blur)
     * we then blend it with identity/original content with SRC_OVER
     * SRC_OVER layers blurEffect's alpha behind identity for the desired result
     * https://developer.android.com/reference/android/graphics/BlendMode#SRC_OVER
     */
    return RenderEffect.createBlendModeEffect(blurEffect, identity, BlendMode.SRC_OVER)
  }

  fun parseAndCreateDropShadowEffect(
      filterValues: ReadableMap,
      chainedEffects: RenderEffect? = null,
  ): RenderEffect {
    val offsetX: Float = filterValues.getDouble("offsetX").dpToPx()
    val offsetY: Float = filterValues.getDouble("offsetY").dpToPx()
    val color: Int = if (filterValues.hasKey("color")) filterValues.getInt("color") else Color.BLACK
    val radius: Float =
        if (filterValues.hasKey("standardDeviation"))
            sigmaToRadius(filterValues.getDouble("standardDeviation").toFloat())
        else 0f

    return createDropShadowEffect(offsetX, offsetY, radius, color, chainedEffects)
  }

  fun createOpacityColorMatrix(amount: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setScale(1f, 1f, 1f, amount)
    return matrix
  }

  // https://www.w3.org/TR/filter-effects-1/#contrastEquivalent
  fun createContrastEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createContrastColorMatrix(amount), chainedEffects)
  }

  private fun createContrastColorMatrix(amount: Float): ColorMatrix {
    // Multiply by 255 as Android operates in [0, 255] while the spec operates in [0, 1].
    // This really only matters if there is an intercept that needs to be added
    val intercept = 255 * (-(amount / 2.0f) + 0.5f)
    return ColorMatrix(
        floatArrayOf(
            amount,
            0f,
            0f,
            0f,
            intercept,
            0f,
            amount,
            0f,
            0f,
            intercept,
            0f,
            0f,
            amount,
            0f,
            intercept,
            0f,
            0f,
            0f,
            1f,
            0f,
        )
    )
  }

  // https://www.w3.org/TR/filter-effects-1/#grayscaleEquivalent
  fun createGrayscaleEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createGrayscaleColorMatrix(amount), chainedEffects)
  }

  private fun createGrayscaleColorMatrix(amount: Float): ColorMatrix {
    val inverseAmount = 1 - amount
    return ColorMatrix(
        floatArrayOf(
            0.2_126f + 0.7_874f * inverseAmount,
            0.7_152f - 0.7_152f * inverseAmount,
            0.0_722f - 0.0_722f * inverseAmount,
            0f,
            0f,
            0.2_126f - 0.2_126f * inverseAmount,
            0.7_152f + 0.2_848f * inverseAmount,
            0.0_722f - 0.0_722f * inverseAmount,
            0f,
            0f,
            0.2_126f - 0.2_126f * inverseAmount,
            0.7_152f - 0.7_152f * inverseAmount,
            0.0_722f + 0.9_278f * inverseAmount,
            0f,
            0f,
            0f,
            0f,
            0f,
            1f,
            0f,
        )
    )
  }

  // https://www.w3.org/TR/filter-effects-1/#sepiaEquivalent
  fun createSepiaEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createSepiaColorMatrix(amount), chainedEffects)
  }

  private fun createSepiaColorMatrix(amount: Float): ColorMatrix {
    val inverseAmount = 1 - amount
    return ColorMatrix(
        floatArrayOf(
            0.393f + 0.607f * inverseAmount,
            0.769f - 0.769f * inverseAmount,
            0.189f - 0.189f * inverseAmount,
            0f,
            0f,
            0.349f - 0.349f * inverseAmount,
            0.686f + 0.314f * inverseAmount,
            0.168f - 0.168f * inverseAmount,
            0f,
            0f,
            0.272f - 0.272f * inverseAmount,
            0.534f - 0.534f * inverseAmount,
            0.131f + 0.869f * inverseAmount,
            0f,
            0f,
            0f,
            0f,
            0f,
            1f,
            0f,
        )
    )
  }

  // https://www.w3.org/TR/filter-effects-1/#saturateEquivalent
  fun createSaturateEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createSaturateColorMatrix(amount), chainedEffects)
  }

  private fun createSaturateColorMatrix(amount: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setSaturation(amount)
    return matrix
  }

  // https://www.w3.org/TR/filter-effects-1/#huerotateEquivalent
  fun createHueRotateEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createHueRotateColorMatrix(amount), chainedEffects)
  }

  private fun createHueRotateColorMatrix(amount: Float): ColorMatrix {
    val amountRads = Math.toRadians(amount.toDouble())
    val cos = cos(amountRads).toFloat()
    val sin = sin(amountRads).toFloat()
    return ColorMatrix(
        floatArrayOf(
            0.213f + 0.787f * cos - 0.213f * sin,
            0.715f - 0.715f * cos - 0.715f * sin,
            0.072f - 0.072f * cos + 0.928f * sin,
            0f,
            0f,
            0.213f - 0.213f * cos + 0.143f * sin,
            0.715f + 0.285f * cos + 0.140f * sin,
            0.072f - 0.072f * cos - 0.283f * sin,
            0f,
            0f,
            0.213f - 0.213f * cos - 0.787f * sin,
            0.715f - 0.715f * cos + 0.715f * sin,
            0.072f + 0.928f * cos + 0.072f * sin,
            0f,
            0f,
            0f,
            0f,
            0f,
            1f,
            0f,
        )
    )
  }

  // https://www.w3.org/TR/filter-effects-1/#invertEquivalent
  fun createInvertEffect(amount: Float, chainedEffects: RenderEffect? = null): RenderEffect {
    return createColorMatrixEffect(createInvertColorMatrix(amount), chainedEffects)
  }

  private fun createInvertColorMatrix(amount: Float): ColorMatrix {
    val slope = 1 - 2 * amount
    val intercept = amount * 255
    return ColorMatrix(
        floatArrayOf(
            slope,
            0f,
            0f,
            0f,
            intercept,
            0f,
            slope,
            0f,
            0f,
            intercept,
            0f,
            0f,
            slope,
            0f,
            intercept,
            0f,
            0f,
            0f,
            1f,
            0f,
        )
    )
  }

  private fun createColorMatrixEffect(
      colorMatrix: ColorMatrix,
      chainedEffects: RenderEffect? = null,
  ): RenderEffect {
    return if (chainedEffects == null) {
      RenderEffect.createColorFilterEffect(ColorMatrixColorFilter(colorMatrix))
    } else {
      RenderEffect.createColorFilterEffect(ColorMatrixColorFilter(colorMatrix), chainedEffects)
    }
  }

  internal fun sigmaToRadius(sigma: Float): Float {
    // Android takes blur amount as a radius while web takes a sigma. This value
    // is used under the hood to convert between them on Android
    // https://cs.android.com/android/platform/superproject/main/+/main:frameworks/base/libs/hwui/utils/Blur.cpp;l=34
    val sigmaToRadiusRatio = 0.57_735f
    val pxSigma = PixelUtil.toPixelFromDIP(sigma)
    return if (pxSigma > 0.5f) (pxSigma - 0.5f) / sigmaToRadiusRatio else 0f
  }
}
