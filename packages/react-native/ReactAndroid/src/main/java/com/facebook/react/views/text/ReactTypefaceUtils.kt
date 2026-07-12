/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.content.Context
import android.content.res.AssetManager
import android.content.res.Configuration
import android.graphics.Typeface
import android.os.Build
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.assets.ReactFontManager
import com.facebook.react.internal.featureflags.ReactNativeFeatureFlags
import kotlin.math.max
import kotlin.math.min

public object ReactTypefaceUtils {

  private const val FONT_WEIGHT_MIN = 1
  private const val FONT_WEIGHT_MAX = 1000

  @JvmStatic
  public fun parseFontWeight(fontWeightString: String?): Int =
      when (fontWeightString) {
        "100" -> 100
        "200" -> 200
        "300" -> 300
        "normal",
        "400" -> 400
        "500" -> 500
        "600" -> 600
        "bold",
        "700" -> 700
        "800" -> 800
        "900" -> 900
        else -> ReactConstants.UNSET
      }

  @JvmStatic
  public fun parseFontStyle(fontStyleString: String?): Int =
      when (fontStyleString) {
        "italic" -> Typeface.ITALIC
        "normal" -> Typeface.NORMAL
        else -> ReactConstants.UNSET
      }

  @JvmStatic
  public fun parseFontVariant(fontVariantArray: ReadableArray?): String? {
    if (fontVariantArray == null || fontVariantArray.size() == 0) {
      return null
    }

    val features = mutableListOf<String>()
    for (i in 0 until fontVariantArray.size()) {
      // see https://docs.microsoft.com/en-us/typography/opentype/spec/featurelist
      val fontVariant = fontVariantArray.getString(i)
      when (fontVariant) {
        "small-caps" -> features.add("'smcp'")
        "oldstyle-nums" -> features.add("'onum'")
        "lining-nums" -> features.add("'lnum'")
        "tabular-nums" -> features.add("'tnum'")
        "proportional-nums" -> features.add("'pnum'")
        "common-ligatures" -> {
          features.add("'liga'")
          features.add("'clig'")
        }
        "no-common-ligatures" -> {
          features.add("'liga' off")
          features.add("'clig' off")
        }
        "discretionary-ligatures" -> features.add("'dlig'")
        "no-discretionary-ligatures" -> features.add("'dlig' off")
        "historical-ligatures" -> features.add("'hlig'")
        "no-historical-ligatures" -> features.add("'hlig' off")
        "contextual" -> features.add("'calt'")
        "no-contextual" -> features.add("'calt' off")
        "stylistic-one" -> features.add("'ss01'")
        "stylistic-two" -> features.add("'ss02'")
        "stylistic-three" -> features.add("'ss03'")
        "stylistic-four" -> features.add("'ss04'")
        "stylistic-five" -> features.add("'ss05'")
        "stylistic-six" -> features.add("'ss06'")
        "stylistic-seven" -> features.add("'ss07'")
        "stylistic-eight" -> features.add("'ss08'")
        "stylistic-nine" -> features.add("'ss09'")
        "stylistic-ten" -> features.add("'ss10'")
        "stylistic-eleven" -> features.add("'ss11'")
        "stylistic-twelve" -> features.add("'ss12'")
        "stylistic-thirteen" -> features.add("'ss13'")
        "stylistic-fourteen" -> features.add("'ss14'")
        "stylistic-fifteen" -> features.add("'ss15'")
        "stylistic-sixteen" -> features.add("'ss16'")
        "stylistic-seventeen" -> features.add("'ss17'")
        "stylistic-eighteen" -> features.add("'ss18'")
        "stylistic-nineteen" -> features.add("'ss19'")
        "stylistic-twenty" -> features.add("'ss20'")
      }
    }
    return features.joinToString(", ")
  }

  @JvmStatic
  public fun applyStyles(
      typeface: Typeface?,
      style: Int,
      weight: Int,
      fontFamilyName: String?,
      assetManager: AssetManager,
  ): Typeface {
    val typefaceStyle = ReactFontManager.TypefaceStyle(style, weight)
    return if (fontFamilyName == null) {
      typefaceStyle.apply(typeface ?: Typeface.DEFAULT)
    } else {
      ReactFontManager.getInstance().getTypeface(fontFamilyName, typefaceStyle, assetManager)
    }
  }

  @JvmStatic
  public fun getFontWeightAdjustment(context: Context): Int =
      if (
          Build.VERSION.SDK_INT >= Build.VERSION_CODES.S &&
              ReactNativeFeatureFlags.enableAndroidFontWeightAdjustment()
      ) {
        context.resources.configuration.fontWeightAdjustment
      } else {
        0
      }

  @JvmStatic
  public fun applyFontWeightAdjustment(
      typeface: Typeface?,
      fontWeightAdjustment: Int,
  ): Typeface? {
    if (
        Build.VERSION.SDK_INT < Build.VERSION_CODES.S ||
            fontWeightAdjustment == 0 ||
            fontWeightAdjustment == Configuration.FONT_WEIGHT_ADJUSTMENT_UNDEFINED
    ) {
      return typeface
    }

    val baseTypeface = typeface ?: Typeface.DEFAULT
    val adjustedWeight =
        min(max(baseTypeface.weight + fontWeightAdjustment, FONT_WEIGHT_MIN), FONT_WEIGHT_MAX)
    val italic = baseTypeface.style and Typeface.ITALIC != 0

    return Typeface.create(baseTypeface, adjustedWeight, italic)
  }
}
