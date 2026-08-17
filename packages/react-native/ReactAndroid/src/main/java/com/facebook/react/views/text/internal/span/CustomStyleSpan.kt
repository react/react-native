/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text.internal.span

import android.content.res.AssetManager
import android.graphics.Paint
import android.graphics.Typeface
import android.text.TextPaint
import android.text.style.MetricAffectingSpan
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.views.text.ReactTypefaceUtils

/**
 * A [MetricAffectingSpan] that allows to change the style of the displayed font. CustomStyleSpan
 * will try to load the fontFamily with the right style and weight from the assets. The custom fonts
 * will have to be located in the res/assets folder of the application. The supported custom fonts
 * extensions are .ttf and .otf. For each font family the bold, italic and bold_italic variants are
 * supported. Given a "family" font family the files in the assets/fonts folder need to be
 * family.ttf(.otf) family_bold.ttf(.otf) family_italic.ttf(.otf) and family_bold_italic.ttf(.otf).
 * If the right font is not found in the assets folder CustomStyleSpan will fallback on the most
 * appropriate default typeface depending on the style. Fonts are retrieved and cached using the
 * [ReactFontManager]
 *
 * Construct this with named arguments. Several parameters share a type — three `String?` and two
 * `Boolean` — so a transposed pair compiles cleanly and misrenders silently. Kotlin cannot enforce
 * naming at the call site, so the convention is the only guard.
 */
internal class CustomStyleSpan(
    private val fontStyle: Int,
    private val fontWeight: Int,
    val fontFeatureSettings: String?,
    val fontVariationSettings: String?,
    val fontFamily: String?,
    private val assetManager: AssetManager,
    private val fontWeightAdjustment: Int = 0,
) : MetricAffectingSpan(), ReactSpan {
  /**
   * [fontStyle] with [ReactConstants.UNSET] resolved to the face that is actually drawn.
   *
   * The unresolved value is what reaches the typeface lookup, which reads [ReactConstants.UNSET] as
   * "take this axis from the other one" — an unset weight becomes bold when the style carries the
   * bold bit. Resolving in place would lose that, so the two values are kept apart.
   */
  val effectiveStyle: Int = if (fontStyle == ReactConstants.UNSET) Typeface.NORMAL else fontStyle

  /** [fontWeight] with [ReactConstants.UNSET] resolved to the weight that is actually drawn. */
  val effectiveWeight: Int =
      if (fontWeight == ReactConstants.UNSET) ReactFontManager.TypefaceStyle.NORMAL else fontWeight

  override fun updateDrawState(ds: TextPaint) {
    apply(
        ds,
        fontStyle,
        fontWeight,
        fontFeatureSettings,
        fontVariationSettings,
        fontFamily,
        assetManager,
        fontWeightAdjustment,
    )
  }

  override fun updateMeasureState(paint: TextPaint) {
    apply(
        paint,
        fontStyle,
        fontWeight,
        fontFeatureSettings,
        fontVariationSettings,
        fontFamily,
        assetManager,
        fontWeightAdjustment,
    )
  }

  companion object {
    private fun apply(
        paint: Paint,
        style: Int,
        weight: Int,
        fontFeatureSettingsParam: String?,
        fontVariationSettingsParam: String?,
        family: String?,
        assetManager: AssetManager,
        fontWeightAdjustment: Int,
    ) {
      val typeface =
          ReactTypefaceUtils.applyStyles(paint.typeface, style, weight, family, assetManager)
      val adjustedTypeface =
          ReactTypefaceUtils.applyFontWeightAdjustment(typeface, fontWeightAdjustment)
      paint.apply {
        fontFeatureSettings = fontFeatureSettingsParam
        setTypeface(adjustedTypeface)
        ReactTypefaceUtils.applyFontVariationSettings(this, fontVariationSettingsParam)
        isSubpixelText = true
        isLinearText = true
      }
    }
  }
}
