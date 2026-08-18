/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.util.DisplayMetrics
import com.facebook.common.logging.FLog
import com.facebook.react.common.ReactConstants
import com.facebook.react.uimanager.DisplayMetricsHolder
import com.facebook.react.uimanager.PixelUtil
import com.facebook.react.uimanager.ViewDefaults

/*
 * Currently, TextAttributes consists of a subset of text props that need to be passed from parent
 * to child so inheritance can be implemented correctly. An example complexity that causes a prop
 * to end up in TextAttributes is when multiple props need to be considered together to determine
 * the rendered aka effective value. For example, to figure out the rendered/effective font size,
 * you need to take into account the fontSize, maxFontSizeMultiplier, and allowFontScaling props.
 */
public class TextAttributes
@JvmOverloads
constructor(
    /**
     * The metrics `sp` and `dp` values are resolved against, or `null` to fall back to the
     * process-wide [DisplayMetricsHolder]. Views should pass the metrics of their own context so
     * that text on a secondary display is sized for that display; see [PixelUtil.displayMetricsOf].
     */
    private val displayMetrics: DisplayMetrics? = null,
) {
  private val metrics: DisplayMetrics
    get() = displayMetrics ?: DisplayMetricsHolder.getScreenDisplayMetrics()

  public var allowFontScaling: Boolean = true
  public var fontSize: Float = Float.NaN
  public var lineHeight: Float = Float.NaN
  public var letterSpacing: Float = Float.NaN
  public var heightOfTallestInlineViewOrImage: Float = Float.NaN

  @JvmField internal var textTransform: TextTransform = TextTransform.UNSET

  public fun applyChild(child: TextAttributes): TextAttributes {
    val result = TextAttributes(displayMetrics)

    // allowFontScaling is always determined by the root Text
    // component so don't allow the child to overwrite it.
    result.allowFontScaling = allowFontScaling

    result.fontSize = if (!child.fontSize.isNaN()) child.fontSize else fontSize
    result.lineHeight = if (!child.lineHeight.isNaN()) child.lineHeight else lineHeight
    result.letterSpacing = if (!child.letterSpacing.isNaN()) child.letterSpacing else letterSpacing
    result.maxFontSizeMultiplier =
        if (!child.maxFontSizeMultiplier.isNaN()) child.maxFontSizeMultiplier
        else maxFontSizeMultiplier
    result.heightOfTallestInlineViewOrImage =
        if (!child.heightOfTallestInlineViewOrImage.isNaN()) child.heightOfTallestInlineViewOrImage
        else heightOfTallestInlineViewOrImage
    result.textTransform =
        if (child.textTransform != TextTransform.UNSET) child.textTransform else textTransform

    return result
  }

  public var maxFontSizeMultiplier: Float = Float.NaN
    set(maxFontSizeMultiplier) {
      if (
          maxFontSizeMultiplier != 0f && maxFontSizeMultiplier < 1 && !maxFontSizeMultiplier.isNaN()
      ) {
        FLog.w(ReactConstants.TAG, "maxFontSizeMultiplier must be NaN, 0, or >= 1")
        field = Float.NaN
        return
      }
      field = maxFontSizeMultiplier
    }

  public val effectiveFontSize: Int
    get() {
      val fontSize = if (!fontSize.isNaN()) fontSize else ViewDefaults.FONT_SIZE_SP
      return if (allowFontScaling) {
        Math.ceil(
            PixelUtil.toPixelFromSP(fontSize, effectiveMaxFontSizeMultiplier, metrics).toDouble(),
        )
            .toInt()
      } else {
        Math.ceil(PixelUtil.toPixelFromDIP(fontSize, metrics).toDouble()).toInt()
      }
    }

  public val effectiveLineHeight: Float
    get() {
      if (lineHeight.isNaN()) {
        return Float.NaN
      }

      val lineHeight: Float =
          if (allowFontScaling)
              PixelUtil.toPixelFromSP(lineHeight, effectiveMaxFontSizeMultiplier, metrics)
          else PixelUtil.toPixelFromDIP(lineHeight, metrics)

      // Take into account the requested line height
      // and the height of the inline images.
      val useInlineViewHeight =
          !heightOfTallestInlineViewOrImage.isNaN() && heightOfTallestInlineViewOrImage > lineHeight
      return if (useInlineViewHeight) heightOfTallestInlineViewOrImage else lineHeight
    }

  public val effectiveLetterSpacing: Float
    get() {
      if (letterSpacing.isNaN()) {
        return Float.NaN
      }

      val letterSpacingPixels: Float =
          if (allowFontScaling)
              PixelUtil.toPixelFromSP(letterSpacing, effectiveMaxFontSizeMultiplier, metrics)
          else PixelUtil.toPixelFromDIP(letterSpacing, metrics)

      // `letterSpacingPixels` and `getEffectiveFontSize` are both in pixels,
      // yielding an accurate em value.
      return letterSpacingPixels / effectiveFontSize
    }

  public val effectiveMaxFontSizeMultiplier: Float
    // Never returns NaN
    get() =
        if (!maxFontSizeMultiplier.isNaN()) maxFontSizeMultiplier
        else DEFAULT_MAX_FONT_SIZE_MULTIPLIER

  override fun toString(): String =
      """
        TextAttributes {
          getAllowFontScaling(): $allowFontScaling
          getFontSize(): $fontSize
          getEffectiveFontSize(): $effectiveFontSize
          getHeightOfTallestInlineViewOrImage(): $heightOfTallestInlineViewOrImage
          getLetterSpacing(): $letterSpacing
          getEffectiveLetterSpacing(): $effectiveLetterSpacing
          getLineHeight(): $lineHeight
          getEffectiveLineHeight(): $effectiveLineHeight
          getTextTransform(): $textTransform
          getMaxFontSizeMultiplier(): $maxFontSizeMultiplier
          getEffectiveMaxFontSizeMultiplier(): $effectiveMaxFontSizeMultiplier
        }
      """
          .trimIndent()

  internal companion object {
    // Setting the default to 0 indicates that there is no max.
    public const val DEFAULT_MAX_FONT_SIZE_MULTIPLIER: Float = 0.0f
  }
}
