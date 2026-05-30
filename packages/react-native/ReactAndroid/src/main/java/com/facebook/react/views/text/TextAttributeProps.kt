/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.views.text

import android.os.Build
import android.text.Layout
import android.text.TextUtils.TruncateAt
import android.util.LayoutDirection
import android.view.Gravity
import com.facebook.common.logging.FLog
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.mapbuffer.MapBuffer
import com.facebook.react.uimanager.PixelUtil.toPixelFromDIP
import com.facebook.react.uimanager.PixelUtil.toPixelFromSP
import com.facebook.react.uimanager.ReactAccessibilityDelegate
import com.facebook.react.uimanager.ReactAccessibilityDelegate.AccessibilityRole
import com.facebook.react.uimanager.ReactStylesDiffMap
import com.facebook.react.uimanager.ViewProps
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontStyle
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontVariant
import com.facebook.react.views.text.ReactTypefaceUtils.parseFontWeight
import kotlin.math.ceil

// TODO: T63643819 refactor naming of TextAttributeProps to make explicit that this represents
// TextAttributes and not TextProps. As part of this refactor extract methods that don't belong to
// TextAttributeProps (e.g. TextAlign)
public class TextAttributeProps private constructor() {
  public var lineHeight: Float = Float.NaN
    private set(value) {
      lineHeightInput = value
      field =
          if (value == ReactConstants.UNSET.toFloat()) {
            Float.NaN
          } else {
            if (allowFontScaling) toPixelFromSP(value) else toPixelFromDIP(value)
          }
    }

  public var isColorSet: Boolean = false
    private set

  public var allowFontScaling: Boolean = true
    private set(value) {
      if (value != field) {
        field = value
        setFontSize(fontSizeInput)
        lineHeight = lineHeightInput
      }
    }

  public var maxFontSizeMultiplier: Float = Float.NaN
    private set(value) {
      if (value != field) {
        field = value
        setFontSize(fontSizeInput)
        lineHeight = lineHeightInput
      }
    }

  public var isBackgroundColorSet: Boolean = false
    private set

  public var opacity: Float = Float.NaN
    private set

  public var numberOfLines: Int = ReactConstants.UNSET
    private set

  public var fontSize: Int = ReactConstants.UNSET
    private set

  private var fontSizeInput: Float = ReactConstants.UNSET.toFloat()
  private var lineHeightInput: Float = ReactConstants.UNSET.toFloat()
  private var letterSpacingInput: Float = Float.NaN

  // `ReactConstants.UNSET` is -1, same as `LayoutDirection.UNDEFINED` (which is a hidden symbol)
  public var layoutDirection: Int = ReactConstants.UNSET
    private set

  internal var textTransform: TextTransform = TextTransform.NONE

  public var isUnderlineTextDecorationSet: Boolean = false
    private set

  public var isLineThroughTextDecorationSet: Boolean = false
    private set

  /**
   * Decoration color for underlines and strikethroughs. `Color.TRANSPARENT` (the default) means
   * "fall back to the text color" so existing call sites that don't pass a value retain the prior
   * behavior. Honored by `ReactUnderlineSpan` and `ReactStrikethroughSpan`.
   */
  internal var textDecorationColor: Int = android.graphics.Color.TRANSPARENT
    private set

  /**
   * CSS `text-decoration-style`. Defaults to `SOLID` so existing call sites retain the prior visual
   * behavior. Honored by `ReactUnderlineSpan` and `ReactStrikethroughSpan`.
   */
  internal var textDecorationStyle: TextDecorationStyle = TextDecorationStyle.SOLID
    private set

  private var includeFontPadding: Boolean = true

  public var accessibilityRole: AccessibilityRole? = null
    private set

  public var role: ReactAccessibilityDelegate.Role? = null
    private set

  internal data class TextEffectEntry(val name: String, val props: String?)

  internal var textEffects: List<TextEffectEntry> = emptyList()
    private set

  public var fontStyle: Int = ReactConstants.UNSET
    private set

  public var fontWeight: Int = ReactConstants.UNSET
    private set

  /**
   * NB: If a font family is used that does not have a style in a certain Android version (ie.
   * monospace bold pre Android 5.0), that style (ie. bold) will not be inherited by nested Text
   * nodes. To retain that style, you have to add it to those nodes explicitly.
   *
   * Example, Android 4.4:
   * <pre>
   * <Text style={{fontFamily="serif" fontWeight="bold" }}>Bold Text</Text>
   * <Text style={{fontFamily="sans-serif"}}>Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold" }}>Not Bold Text</Text>
   * <Text style={{fontFamily="sans-serif"}}>Not Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Not Bold Text</Text>
   *
   * <Text style={{fontFamily="monospace" fontWeight="bold" }}>Not Bold Text</Text>
   * <Text style={{fontFamily="sans-serif" fontWeight="bold" }}>Bold Text</Text>
   * <Text style={{fontFamily="serif"}}>Bold Text</Text>
   * </pre> *
   */
  public var fontFamily: String? = null
    private set

  /** @see android.graphics.Paint.setFontFeatureSettings */
  public var fontFeatureSettings: String? = null
    private set

  @Deprecated("Use lineHeight instead", ReplaceWith("lineHeight"))
  public val effectiveLineHeight: Float
    get() = lineHeight

  private fun setNumberOfLines(numberOfLines: Int) {
    this.numberOfLines = if (numberOfLines == 0) ReactConstants.UNSET else numberOfLines
  }

  public var letterSpacing: Float
    get() {
      val letterSpacingPixels =
          if (allowFontScaling) toPixelFromSP(letterSpacingInput)
          else toPixelFromDIP(letterSpacingInput)

      require(fontSize > 0) { "FontSize should be a positive value. Current value: $fontSize" }
      // `letterSpacingPixels` and `fontSize` are both in pixels,
      // yielding an accurate em value.
      return letterSpacingPixels / fontSize
    }
    private set(letterSpacing) {
      letterSpacingInput = letterSpacing
    }

  public val effectiveLetterSpacing: Float
    get() = letterSpacing

  private fun setFontSize(fontSize: Float) {
    var fontSizeLocal = fontSize
    fontSizeInput = fontSizeLocal
    if (fontSizeLocal != ReactConstants.UNSET.toFloat()) {
      fontSizeLocal =
          if (allowFontScaling)
              ceil(toPixelFromSP(fontSize, maxFontSizeMultiplier).toDouble()).toFloat()
          else ceil(toPixelFromDIP(fontSize).toDouble()).toFloat()
    }
    this.fontSize = fontSizeLocal.toInt()
  }

  public var color: Int? = null
    private set(value) {
      isColorSet = (value != null)
      if (value != null) {
        field = value
      }
    }

  public var backgroundColor: Int? = 0
    private set(color) {
      // TODO: Don't apply background color to anchor TextView since it will be applied on the
      // View directly
      // if (!isVirtualAnchor()) {
      isBackgroundColorSet = (color != null)
      if (color != null) {
        field = color
      }
      // }
    }

  private fun setFontVariant(fontVariant: ReadableArray?) {
    fontFeatureSettings = parseFontVariant(fontVariant)
  }

  private fun setFontVariant(fontVariant: MapBuffer?) {
    if (fontVariant == null || fontVariant.count == 0) {
      fontFeatureSettings = null
      return
    }

    val features: MutableList<String?> = ArrayList()
    val iterator = fontVariant.iterator()
    while (iterator.hasNext()) {
      val entry = iterator.next()
      val value = entry.stringValue
      @Suppress("SENSELESS_COMPARISON")
      if (value != null) {
        when (value) {
          "small-caps" -> features.add("'smcp'")
          "oldstyle-nums" -> features.add("'onum'")
          "lining-nums" -> features.add("'lnum'")
          "tabular-nums" -> features.add("'tnum'")
          "proportional-nums" -> features.add("'pnum'")
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
    }
    fontFeatureSettings = features.joinToString(", ")
  }

  private fun setFontWeight(fontWeightString: String?) {
    fontWeight = parseFontWeight(fontWeightString)
  }

  private fun setFontStyle(fontStyleString: String?) {
    fontStyle = parseFontStyle(fontStyleString)
  }

  private fun setTextDecorationLine(textDecorationLineString: String?) {
    isUnderlineTextDecorationSet = false
    isLineThroughTextDecorationSet = false
    if (textDecorationLineString != null) {
      for (textDecorationLineSubString in
          textDecorationLineString
              .split("-".toRegex())
              .dropLastWhile { it.isEmpty() }
              .toTypedArray()) {
        if ("underline" == textDecorationLineSubString) {
          isUnderlineTextDecorationSet = true
        } else if ("strikethrough" == textDecorationLineSubString) {
          isLineThroughTextDecorationSet = true
        }
      }
    }
  }

  private fun setTextShadowOffset(offsetMap: ReadableMap?) {
    textShadowOffsetDx = 0f
    textShadowOffsetDy = 0f

    if (offsetMap != null) {
      if (
          offsetMap.hasKey(PROP_SHADOW_OFFSET_WIDTH) && !offsetMap.isNull(PROP_SHADOW_OFFSET_WIDTH)
      ) {
        textShadowOffsetDx = toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_WIDTH))
      }
      if (
          offsetMap.hasKey(PROP_SHADOW_OFFSET_HEIGHT) &&
              !offsetMap.isNull(PROP_SHADOW_OFFSET_HEIGHT)
      ) {
        textShadowOffsetDy = toPixelFromDIP(offsetMap.getDouble(PROP_SHADOW_OFFSET_HEIGHT))
      }
    }
  }

  public var textShadowOffsetDx: Float = 0f
    private set(value) {
      field = toPixelFromDIP(value)
    }

  public var textShadowOffsetDy: Float = 0f
    private set(value) {
      field = toPixelFromDIP(value)
    }

  private fun setLayoutDirection(layoutDirection: String?) {
    this.layoutDirection = getLayoutDirection(layoutDirection)
  }

  public var textShadowRadius: Float = 0f
    private set(value) {
      if (value != field) {
        field = value
      }
    }

  public var textShadowColor: Int = DEFAULT_TEXT_SHADOW_COLOR
    private set(value) {
      if (value != field) {
        field = value
      }
    }

  private fun setTextTransform(textTransform: String?) {
    this.textTransform =
        when (textTransform) {
          null,
          "none" -> TextTransform.NONE
          "uppercase" -> TextTransform.UPPERCASE
          "lowercase" -> TextTransform.LOWERCASE
          "capitalize" -> TextTransform.CAPITALIZE
          else -> {
            FLog.w(ReactConstants.TAG, "Invalid textTransform: $textTransform")
            TextTransform.NONE
          }
        }
  }

  private fun setAccessibilityRole(accessibilityRole: String?) {
    this.accessibilityRole =
        if (accessibilityRole == null) null else AccessibilityRole.fromValue(accessibilityRole)
  }

  private fun setRole(role: String?) {
    if (role == null) {
      this.role = null
    } else {
      this.role = ReactAccessibilityDelegate.Role.fromValue(role)
    }
  }

  private fun setRole(role: ReactAccessibilityDelegate.Role) {
    this.role = role
  }

  public companion object {
    // constants for Text Attributes serialization
    public const val TA_KEY_FOREGROUND_COLOR: Int = 0
    public const val TA_KEY_BACKGROUND_COLOR: Int = 1
    public const val TA_KEY_OPACITY: Int = 2
    public const val TA_KEY_FONT_FAMILY: Int = 3
    public const val TA_KEY_FONT_SIZE: Int = 4
    public const val TA_KEY_FONT_SIZE_MULTIPLIER: Int = 5
    public const val TA_KEY_FONT_WEIGHT: Int = 6
    public const val TA_KEY_FONT_STYLE: Int = 7
    public const val TA_KEY_FONT_VARIANT: Int = 8
    public const val TA_KEY_ALLOW_FONT_SCALING: Int = 9
    public const val TA_KEY_LETTER_SPACING: Int = 10
    public const val TA_KEY_LINE_HEIGHT: Int = 11
    public const val TA_KEY_ALIGNMENT: Int = 12
    public const val TA_KEY_BEST_WRITING_DIRECTION: Int = 13
    public const val TA_KEY_TEXT_DECORATION_COLOR: Int = 14
    public const val TA_KEY_TEXT_DECORATION_LINE: Int = 15
    public const val TA_KEY_TEXT_DECORATION_STYLE: Int = 16
    public const val TA_KEY_TEXT_SHADOW_RADIUS: Int = 18
    public const val TA_KEY_TEXT_SHADOW_COLOR: Int = 19
    public const val TA_KEY_TEXT_SHADOW_OFFSET_DX: Int = 20
    public const val TA_KEY_TEXT_SHADOW_OFFSET_DY: Int = 21
    public const val TA_KEY_IS_HIGHLIGHTED: Int = 22
    public const val TA_KEY_LAYOUT_DIRECTION: Int = 23
    public const val TA_KEY_ACCESSIBILITY_ROLE: Int = 24
    public const val TA_KEY_LINE_BREAK_STRATEGY: Int = 25
    public const val TA_KEY_ROLE: Int = 26
    public const val TA_KEY_TEXT_TRANSFORM: Int = 27
    public const val TA_KEY_MAX_FONT_SIZE_MULTIPLIER: Int = 29
    public const val TA_KEY_TEXT_EFFECTS: Int = 30
    private const val TE_KEY_NAME: Int = 0
    private const val TE_KEY_PROPS: Int = 1

    public const val UNSET: Int = -1

    private const val PROP_SHADOW_OFFSET = "textShadowOffset"
    private const val PROP_SHADOW_OFFSET_WIDTH = "width"
    private const val PROP_SHADOW_OFFSET_HEIGHT = "height"
    private const val PROP_SHADOW_RADIUS = "textShadowRadius"
    private const val PROP_SHADOW_COLOR = "textShadowColor"

    private const val PROP_TEXT_TRANSFORM = "textTransform"

    private const val DEFAULT_TEXT_SHADOW_COLOR = 0x55000000
    private val DEFAULT_JUSTIFICATION_MODE =
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) 0 else Layout.JUSTIFICATION_MODE_NONE
    private const val DEFAULT_BREAK_STRATEGY = Layout.BREAK_STRATEGY_HIGH_QUALITY
    private const val DEFAULT_HYPHENATION_FREQUENCY = Layout.HYPHENATION_FREQUENCY_NONE

    /** Build a TextAttributeProps using data from the [MapBuffer] received as a parameter. */
    public fun fromMapBuffer(props: MapBuffer): TextAttributeProps {
      val result = TextAttributeProps()

      // TODO T83483191: Review constants that are not being set!
      val iterator = props.iterator()
      while (iterator.hasNext()) {
        val entry = iterator.next()
        when (entry.key) {
          TA_KEY_FOREGROUND_COLOR -> result.color = entry.intValue
          TA_KEY_BACKGROUND_COLOR -> result.backgroundColor = entry.intValue
          TA_KEY_OPACITY -> result.opacity = entry.doubleValue.toFloat()
          TA_KEY_FONT_FAMILY -> result.fontFamily = entry.stringValue
          TA_KEY_FONT_SIZE -> result.setFontSize(entry.doubleValue.toFloat())
          TA_KEY_FONT_SIZE_MULTIPLIER -> {}
          TA_KEY_FONT_WEIGHT -> result.setFontWeight(entry.stringValue)
          TA_KEY_FONT_STYLE -> result.setFontStyle(entry.stringValue)
          TA_KEY_FONT_VARIANT -> result.setFontVariant(entry.mapBufferValue)
          TA_KEY_ALLOW_FONT_SCALING -> result.allowFontScaling = entry.booleanValue
          TA_KEY_LETTER_SPACING -> result.letterSpacing = entry.doubleValue.toFloat()
          TA_KEY_LINE_HEIGHT -> result.lineHeight = entry.doubleValue.toFloat()
          TA_KEY_ALIGNMENT -> {}
          TA_KEY_BEST_WRITING_DIRECTION -> {}
          TA_KEY_TEXT_DECORATION_COLOR -> result.textDecorationColor = entry.intValue
          TA_KEY_TEXT_DECORATION_LINE -> result.setTextDecorationLine(entry.stringValue)
          TA_KEY_TEXT_DECORATION_STYLE ->
              result.textDecorationStyle = TextDecorationStyle.fromString(entry.stringValue)
          TA_KEY_TEXT_SHADOW_RADIUS -> result.textShadowRadius = entry.doubleValue.toFloat()
          TA_KEY_TEXT_SHADOW_COLOR -> result.textShadowColor = entry.intValue
          TA_KEY_TEXT_SHADOW_OFFSET_DX -> result.textShadowOffsetDx = entry.doubleValue.toFloat()
          TA_KEY_TEXT_SHADOW_OFFSET_DY -> result.textShadowOffsetDy = entry.doubleValue.toFloat()
          TA_KEY_IS_HIGHLIGHTED -> {}
          TA_KEY_LAYOUT_DIRECTION -> result.setLayoutDirection(entry.stringValue)
          TA_KEY_ACCESSIBILITY_ROLE -> result.setAccessibilityRole(entry.stringValue)
          TA_KEY_ROLE -> result.setRole(ReactAccessibilityDelegate.Role.entries[entry.intValue])
          TA_KEY_TEXT_TRANSFORM -> result.setTextTransform(entry.stringValue)
          TA_KEY_MAX_FONT_SIZE_MULTIPLIER ->
              result.maxFontSizeMultiplier = entry.doubleValue.toFloat()
          TA_KEY_TEXT_EFFECTS -> {
            val effectsMap = entry.mapBufferValue
            val list = mutableListOf<TextEffectEntry>()
            for (j in 0 until effectsMap.count) {
              val effectMap = effectsMap.getMapBuffer(j)
              list.add(
                  TextEffectEntry(
                      name = effectMap.getString(TE_KEY_NAME),
                      props =
                          if (effectMap.contains(TE_KEY_PROPS)) effectMap.getString(TE_KEY_PROPS)
                          else null,
                  )
              )
            }
            result.textEffects = list
          }
        }
      }

      // TODO T83483191: Review why the following props are not serialized:
      // setNumberOfLines
      // setColor
      // setIncludeFontPadding
      return result
    }

    public fun fromReadableMap(props: ReactStylesDiffMap): TextAttributeProps {
      val result = TextAttributeProps()
      result.setNumberOfLines(getIntProp(props, ViewProps.NUMBER_OF_LINES, ReactConstants.UNSET))
      result.lineHeight = getFloatProp(props, ViewProps.LINE_HEIGHT, ReactConstants.UNSET.toFloat())
      result.letterSpacing = getFloatProp(props, ViewProps.LETTER_SPACING, Float.NaN)
      result.allowFontScaling = getBooleanProp(props, ViewProps.ALLOW_FONT_SCALING, true)
      result.maxFontSizeMultiplier =
          getFloatProp(props, ViewProps.MAX_FONT_SIZE_MULTIPLIER, Float.NaN)
      result.setFontSize(getFloatProp(props, ViewProps.FONT_SIZE, ReactConstants.UNSET.toFloat()))
      result.color = if (props.hasKey(ViewProps.COLOR)) props.getInt(ViewProps.COLOR, 0) else null
      result.color =
          if (props.hasKey(ViewProps.FOREGROUND_COLOR)) props.getInt(ViewProps.FOREGROUND_COLOR, 0)
          else null
      result.backgroundColor =
          if (props.hasKey(ViewProps.BACKGROUND_COLOR)) props.getInt(ViewProps.BACKGROUND_COLOR, 0)
          else null
      result.opacity = getFloatProp(props, ViewProps.OPACITY, Float.NaN)
      result.fontFamily = getStringProp(props, ViewProps.FONT_FAMILY)
      result.setFontWeight(getStringProp(props, ViewProps.FONT_WEIGHT))
      result.setFontStyle(getStringProp(props, ViewProps.FONT_STYLE))
      result.setFontVariant(getArrayProp(props, ViewProps.FONT_VARIANT))
      result.includeFontPadding = getBooleanProp(props, ViewProps.INCLUDE_FONT_PADDING, true)
      result.setTextDecorationLine(getStringProp(props, ViewProps.TEXT_DECORATION_LINE))
      result.textDecorationColor =
          getIntProp(props, "textDecorationColor", android.graphics.Color.TRANSPARENT)
      result.textDecorationStyle =
          TextDecorationStyle.fromString(getStringProp(props, "textDecorationStyle"))
      result.setTextShadowOffset(
          if (props.hasKey(PROP_SHADOW_OFFSET)) props.getMap(PROP_SHADOW_OFFSET) else null
      )
      result.textShadowRadius = getFloatProp(props, PROP_SHADOW_RADIUS, 1f)
      result.textShadowColor = getIntProp(props, PROP_SHADOW_COLOR, DEFAULT_TEXT_SHADOW_COLOR)
      result.setTextTransform(getStringProp(props, PROP_TEXT_TRANSFORM))
      result.setLayoutDirection(getStringProp(props, ViewProps.LAYOUT_DIRECTION))
      result.setAccessibilityRole(getStringProp(props, ViewProps.ACCESSIBILITY_ROLE))
      result.setRole(getStringProp(props, ViewProps.ROLE))
      return result
    }

    public fun getTextAlignment(props: ReactStylesDiffMap, isRTL: Boolean, defaultValue: Int): Int {
      if (!props.hasKey(ViewProps.TEXT_ALIGN)) {
        return defaultValue
      }

      return when (val textAlignPropValue = props.getString(ViewProps.TEXT_ALIGN)) {
        "justify" -> Gravity.LEFT
        null,
        "auto" -> Gravity.NO_GRAVITY
        "start" -> if (isRTL) Gravity.RIGHT else Gravity.LEFT
        "end" -> if (isRTL) Gravity.LEFT else Gravity.RIGHT
        "left" -> if (isRTL) Gravity.RIGHT else Gravity.LEFT
        "right" -> if (isRTL) Gravity.LEFT else Gravity.RIGHT
        "center" -> Gravity.CENTER_HORIZONTAL
        else -> {
          FLog.w(ReactConstants.TAG, "Invalid textAlign: $textAlignPropValue")
          Gravity.NO_GRAVITY
        }
      }
    }

    public fun getJustificationMode(props: ReactStylesDiffMap, defaultValue: Int): Int {
      if (!props.hasKey(ViewProps.TEXT_ALIGN)) {
        return defaultValue
      }

      val textAlignPropValue = props.getString(ViewProps.TEXT_ALIGN)
      if ("justify" == textAlignPropValue && Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        return Layout.JUSTIFICATION_MODE_INTER_WORD
      }
      return DEFAULT_JUSTIFICATION_MODE
    }

    private fun getBooleanProp(
        props: ReactStylesDiffMap,
        name: String,
        defaultValue: Boolean,
    ): Boolean = if (props.hasKey(name)) props.getBoolean(name, defaultValue) else defaultValue

    private fun getStringProp(props: ReactStylesDiffMap, name: String): String? =
        if (props.hasKey(name)) props.getString(name) else null

    private fun getIntProp(props: ReactStylesDiffMap, name: String, defaultValue: Int): Int =
        if (props.hasKey(name)) props.getInt(name, defaultValue) else defaultValue

    private fun getFloatProp(props: ReactStylesDiffMap, name: String, defaultValue: Float): Float =
        if (props.hasKey(name)) props.getFloat(name, defaultValue) else defaultValue

    private fun getArrayProp(props: ReactStylesDiffMap, name: String): ReadableArray? =
        if (props.hasKey(name)) props.getArray(name) else null

    public fun getLayoutDirection(layoutDirection: String?): Int {
      return when (layoutDirection) {
        null,
        "undefined" -> ReactConstants.UNSET
        "rtl" -> LayoutDirection.RTL
        "ltr" -> LayoutDirection.LTR
        else -> {
          FLog.w(ReactConstants.TAG, "Invalid layoutDirection: $layoutDirection")
          ReactConstants.UNSET
        }
      }
    }

    public fun getTextBreakStrategy(textBreakStrategy: String?): Int =
        when (textBreakStrategy) {
          null -> DEFAULT_BREAK_STRATEGY
          "simple" -> Layout.BREAK_STRATEGY_SIMPLE
          "balanced" -> Layout.BREAK_STRATEGY_BALANCED
          else -> Layout.BREAK_STRATEGY_HIGH_QUALITY
        }

    public fun getHyphenationFrequency(hyphenationFrequency: String?): Int =
        when (hyphenationFrequency) {
          null -> DEFAULT_HYPHENATION_FREQUENCY
          "none" -> Layout.HYPHENATION_FREQUENCY_NONE
          "normal" -> Layout.HYPHENATION_FREQUENCY_NORMAL
          else -> Layout.HYPHENATION_FREQUENCY_FULL
        }

    public fun getEllipsizeMode(ellipsizeMode: String?): TruncateAt? =
        when (ellipsizeMode) {
          "head" -> TruncateAt.START
          "middle" -> TruncateAt.MIDDLE
          "tail" -> TruncateAt.END
          "clip" -> null
          else -> null
        }
  }
}
