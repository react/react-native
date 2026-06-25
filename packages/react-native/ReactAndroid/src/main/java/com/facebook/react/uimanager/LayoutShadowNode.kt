/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import com.facebook.common.logging.FLog
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.ReadableType
import com.facebook.react.common.ReactConstants
import com.facebook.react.common.annotations.internal.LegacyArchitecture
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogLevel
import com.facebook.react.common.annotations.internal.LegacyArchitectureLogger
import com.facebook.react.modules.i18nmanager.I18nUtil
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.uimanager.annotations.ReactPropGroup
import com.facebook.yoga.YogaAlign
import com.facebook.yoga.YogaConstants
import com.facebook.yoga.YogaDisplay
import com.facebook.yoga.YogaFlexDirection
import com.facebook.yoga.YogaJustify
import com.facebook.yoga.YogaOverflow
import com.facebook.yoga.YogaPositionType
import com.facebook.yoga.YogaUnit
import com.facebook.yoga.YogaWrap

/**
 * Supply setters for base view layout properties such as width, height, flex properties, borders,
 * etc.
 *
 * Checking for isVirtual everywhere is a hack to get around the fact that some virtual nodes still
 * have layout properties set on them in JS: for example, a component that returns a <Text> may or
 * may not be embedded in a parent text. There are better solutions that should probably be
 * explored, namely using the VirtualText class in JS and setting the correct set of validAttributes
 */
@Suppress("DEPRECATION") // Needed because of we extend from ReactShadowNodeImpl
@LegacyArchitecture(logLevel = LegacyArchitectureLogLevel.ERROR)
@Deprecated("This class is part of Legacy Architecture and will be removed in a future release")
public open class LayoutShadowNode : ReactShadowNodeImpl() {

  /** A Mutable version of com.facebook.yoga.YogaValue */
  private class MutableYogaValue {
    var value: Float = 0f
    var unit: YogaUnit = YogaUnit.UNDEFINED

    constructor()

    constructor(other: MutableYogaValue) {
      value = other.value
      unit = other.unit
    }

    fun setFromDynamic(dynamic: Dynamic) {
      when {
        dynamic.isNull -> {
          unit = YogaUnit.UNDEFINED
          value = YogaConstants.UNDEFINED
        }
        dynamic.type == ReadableType.String -> {
          val s = dynamic.asString()
          when {
            s == "auto" -> {
              unit = YogaUnit.AUTO
              value = YogaConstants.UNDEFINED
            }
            s != null && s.endsWith("%") -> {
              unit = YogaUnit.PERCENT
              value = s.substring(0, s.length - 1).toFloat()
            }
            else -> {
              FLog.w(ReactConstants.TAG, "Unknown value: $s")
              unit = YogaUnit.UNDEFINED
              value = YogaConstants.UNDEFINED
            }
          }
        }
        dynamic.type == ReadableType.Number -> {
          unit = YogaUnit.POINT
          value = PixelUtil.toPixelFromDIP(dynamic.asDouble())
        }
        else -> {
          unit = YogaUnit.UNDEFINED
          value = YogaConstants.UNDEFINED
        }
      }
    }
  }

  private val tempYogaValue: MutableYogaValue = MutableYogaValue()

  @JvmField public var collapsable: Boolean = false

  @ReactProp(name = ViewProps.WIDTH)
  public open fun setWidth(width: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(width)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleWidth(tempYogaValue.value)
      YogaUnit.AUTO -> setStyleWidthAuto()
      YogaUnit.PERCENT -> setStyleWidthPercent(tempYogaValue.value)
      else -> {}
    }

    width.recycle()
  }

  @ReactProp(name = ViewProps.MIN_WIDTH)
  public open fun setMinWidth(minWidth: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(minWidth)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleMinWidth(tempYogaValue.value)
      YogaUnit.PERCENT -> setStyleMinWidthPercent(tempYogaValue.value)
      else -> {}
    }

    minWidth.recycle()
  }

  @ReactProp(name = "collapsableChildren")
  public open fun setCollapsableChildren(
      @Suppress("UNUSED_PARAMETER") collapsableChildren: Boolean
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "collapsable")
  public open fun setCollapsable(collapsable: Boolean) {
    this.collapsable = collapsable
  }

  @ReactProp(name = ViewProps.MAX_WIDTH)
  public open fun setMaxWidth(maxWidth: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(maxWidth)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleMaxWidth(tempYogaValue.value)
      YogaUnit.PERCENT -> setStyleMaxWidthPercent(tempYogaValue.value)
      else -> {}
    }

    maxWidth.recycle()
  }

  @ReactProp(name = ViewProps.HEIGHT)
  public open fun setHeight(height: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(height)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleHeight(tempYogaValue.value)
      YogaUnit.AUTO -> setStyleHeightAuto()
      YogaUnit.PERCENT -> setStyleHeightPercent(tempYogaValue.value)
      else -> {}
    }

    height.recycle()
  }

  @ReactProp(name = ViewProps.MIN_HEIGHT)
  public open fun setMinHeight(minHeight: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(minHeight)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleMinHeight(tempYogaValue.value)
      YogaUnit.PERCENT -> setStyleMinHeightPercent(tempYogaValue.value)
      else -> {}
    }

    minHeight.recycle()
  }

  @ReactProp(name = ViewProps.MAX_HEIGHT)
  public open fun setMaxHeight(maxHeight: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(maxHeight)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setStyleMaxHeight(tempYogaValue.value)
      YogaUnit.PERCENT -> setStyleMaxHeightPercent(tempYogaValue.value)
      else -> {}
    }

    maxHeight.recycle()
  }

  @Override
  @ReactProp(name = ViewProps.FLEX, defaultFloat = 0f)
  public override fun setFlex(flex: Float) {
    if (isVirtual()) {
      return
    }
    super.setFlex(flex)
  }

  @Override
  @ReactProp(name = ViewProps.FLEX_GROW, defaultFloat = 0f)
  public override fun setFlexGrow(flexGrow: Float) {
    if (isVirtual()) {
      return
    }
    super.setFlexGrow(flexGrow)
  }

  @ReactProp(name = ViewProps.ROW_GAP)
  public open fun setRowGap(rowGap: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(rowGap)
    when (tempYogaValue.unit) {
      YogaUnit.AUTO,
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setRowGap(tempYogaValue.value)
      YogaUnit.PERCENT -> setRowGapPercent(tempYogaValue.value)
      else -> {}
    }

    rowGap.recycle()
  }

  @ReactProp(name = ViewProps.COLUMN_GAP)
  public open fun setColumnGap(columnGap: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(columnGap)
    when (tempYogaValue.unit) {
      YogaUnit.AUTO,
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setColumnGap(tempYogaValue.value)
      YogaUnit.PERCENT -> setColumnGapPercent(tempYogaValue.value)
      else -> {}
    }

    columnGap.recycle()
  }

  @ReactProp(name = ViewProps.GAP)
  public open fun setGap(gap: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(gap)
    when (tempYogaValue.unit) {
      YogaUnit.AUTO,
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setGap(tempYogaValue.value)
      YogaUnit.PERCENT -> setGapPercent(tempYogaValue.value)
      else -> {}
    }

    gap.recycle()
  }

  @Override
  @ReactProp(name = ViewProps.FLEX_SHRINK, defaultFloat = 0f)
  public override fun setFlexShrink(flexShrink: Float) {
    if (isVirtual()) {
      return
    }
    super.setFlexShrink(flexShrink)
  }

  @ReactProp(name = ViewProps.FLEX_BASIS)
  public open fun setFlexBasis(flexBasis: Dynamic) {
    if (isVirtual()) {
      return
    }

    tempYogaValue.setFromDynamic(flexBasis)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setFlexBasis(tempYogaValue.value)
      YogaUnit.AUTO -> setFlexBasisAuto()
      YogaUnit.PERCENT -> setFlexBasisPercent(tempYogaValue.value)
      else -> {}
    }

    flexBasis.recycle()
  }

  @ReactProp(name = ViewProps.ASPECT_RATIO, defaultFloat = Float.NaN)
  public open fun setAspectRatio(aspectRatio: Float) {
    setStyleAspectRatio(aspectRatio)
  }

  @ReactProp(name = ViewProps.FLEX_DIRECTION)
  public open fun setFlexDirection(flexDirection: String?) {
    if (isVirtual()) {
      return
    }

    if (flexDirection == null) {
      setFlexDirection(YogaFlexDirection.COLUMN)
      return
    }

    when (flexDirection) {
      "column" -> setFlexDirection(YogaFlexDirection.COLUMN)
      "column-reverse" -> setFlexDirection(YogaFlexDirection.COLUMN_REVERSE)
      "row" -> setFlexDirection(YogaFlexDirection.ROW)
      "row-reverse" -> setFlexDirection(YogaFlexDirection.ROW_REVERSE)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for flexDirection: $flexDirection")
        setFlexDirection(YogaFlexDirection.COLUMN)
      }
    }
  }

  @ReactProp(name = ViewProps.FLEX_WRAP)
  public open fun setFlexWrap(flexWrap: String?) {
    if (isVirtual()) {
      return
    }

    if (flexWrap == null) {
      setFlexWrap(YogaWrap.NO_WRAP)
      return
    }

    when (flexWrap) {
      "nowrap" -> setFlexWrap(YogaWrap.NO_WRAP)
      "wrap" -> setFlexWrap(YogaWrap.WRAP)
      "wrap-reverse" -> setFlexWrap(YogaWrap.WRAP_REVERSE)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for flexWrap: $flexWrap")
        setFlexWrap(YogaWrap.NO_WRAP)
      }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_SELF)
  public open fun setAlignSelf(alignSelf: String?) {
    if (isVirtual()) {
      return
    }

    if (alignSelf == null) {
      setAlignSelf(YogaAlign.AUTO)
      return
    }

    when (alignSelf) {
      "auto" -> setAlignSelf(YogaAlign.AUTO)
      "flex-start" -> setAlignSelf(YogaAlign.FLEX_START)
      "center" -> setAlignSelf(YogaAlign.CENTER)
      "flex-end" -> setAlignSelf(YogaAlign.FLEX_END)
      "stretch" -> setAlignSelf(YogaAlign.STRETCH)
      "baseline" -> setAlignSelf(YogaAlign.BASELINE)
      "space-between" -> setAlignSelf(YogaAlign.SPACE_BETWEEN)
      "space-around" -> setAlignSelf(YogaAlign.SPACE_AROUND)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for alignSelf: $alignSelf")
        setAlignSelf(YogaAlign.AUTO)
      }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_ITEMS)
  public open fun setAlignItems(alignItems: String?) {
    if (isVirtual()) {
      return
    }

    if (alignItems == null) {
      setAlignItems(YogaAlign.STRETCH)
      return
    }

    when (alignItems) {
      "auto" -> setAlignItems(YogaAlign.AUTO)
      "flex-start" -> setAlignItems(YogaAlign.FLEX_START)
      "center" -> setAlignItems(YogaAlign.CENTER)
      "flex-end" -> setAlignItems(YogaAlign.FLEX_END)
      "stretch" -> setAlignItems(YogaAlign.STRETCH)
      "baseline" -> setAlignItems(YogaAlign.BASELINE)
      "space-between" -> setAlignItems(YogaAlign.SPACE_BETWEEN)
      "space-around" -> setAlignItems(YogaAlign.SPACE_AROUND)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for alignItems: $alignItems")
        setAlignItems(YogaAlign.STRETCH)
      }
    }
  }

  @ReactProp(name = ViewProps.ALIGN_CONTENT)
  public open fun setAlignContent(alignContent: String?) {
    if (isVirtual()) {
      return
    }

    if (alignContent == null) {
      setAlignContent(YogaAlign.FLEX_START)
      return
    }

    when (alignContent) {
      "auto" -> setAlignContent(YogaAlign.AUTO)
      "flex-start" -> setAlignContent(YogaAlign.FLEX_START)
      "center" -> setAlignContent(YogaAlign.CENTER)
      "flex-end" -> setAlignContent(YogaAlign.FLEX_END)
      "stretch" -> setAlignContent(YogaAlign.STRETCH)
      "baseline" -> setAlignContent(YogaAlign.BASELINE)
      "space-between" -> setAlignContent(YogaAlign.SPACE_BETWEEN)
      "space-around" -> setAlignContent(YogaAlign.SPACE_AROUND)
      "space-evenly" -> setAlignContent(YogaAlign.SPACE_EVENLY)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for alignContent: $alignContent")
        setAlignContent(YogaAlign.FLEX_START)
      }
    }
  }

  @ReactProp(name = ViewProps.JUSTIFY_CONTENT)
  public open fun setJustifyContent(justifyContent: String?) {
    if (isVirtual()) {
      return
    }

    if (justifyContent == null) {
      setJustifyContent(YogaJustify.FLEX_START)
      return
    }

    when (justifyContent) {
      "flex-start" -> setJustifyContent(YogaJustify.FLEX_START)
      "center" -> setJustifyContent(YogaJustify.CENTER)
      "flex-end" -> setJustifyContent(YogaJustify.FLEX_END)
      "space-between" -> setJustifyContent(YogaJustify.SPACE_BETWEEN)
      "space-around" -> setJustifyContent(YogaJustify.SPACE_AROUND)
      "space-evenly" -> setJustifyContent(YogaJustify.SPACE_EVENLY)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for justifyContent: $justifyContent")
        setJustifyContent(YogaJustify.FLEX_START)
      }
    }
  }

  @ReactProp(name = ViewProps.OVERFLOW)
  public open fun setOverflow(overflow: String?) {
    if (isVirtual()) {
      return
    }
    if (overflow == null) {
      setOverflow(YogaOverflow.VISIBLE)
      return
    }

    when (overflow) {
      "visible" -> setOverflow(YogaOverflow.VISIBLE)
      "hidden" -> setOverflow(YogaOverflow.HIDDEN)
      "scroll" -> setOverflow(YogaOverflow.SCROLL)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for overflow: $overflow")
        setOverflow(YogaOverflow.VISIBLE)
      }
    }
  }

  @ReactProp(name = ViewProps.DISPLAY)
  public open fun setDisplay(display: String?) {
    if (isVirtual()) {
      return
    }

    if (display == null) {
      setDisplay(YogaDisplay.FLEX)
      return
    }

    when (display) {
      "flex" -> setDisplay(YogaDisplay.FLEX)
      "none" -> setDisplay(YogaDisplay.NONE)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for display: $display")
        setDisplay(YogaDisplay.FLEX)
      }
    }
  }

  @ReactPropGroup(names = ["marginBlock", "marginBlockEnd", "marginBlockStart"])
  public open fun setMarginBlock(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") margin: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(names = ["marginInline", "marginInlineEnd", "marginInlineStart"])
  public open fun setMarginInline(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") margin: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(names = ["paddingBlock", "paddingBlockEnd", "paddingBlockStart"])
  public open fun setPaddingBlock(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") padding: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(names = ["paddingInline", "paddingInlineEnd", "paddingInlineStart"])
  public open fun setPaddingInline(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") padding: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(names = ["insetBlock", "insetBlockEnd", "insetBlockStart"])
  public open fun setInsetBlock(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") inset: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(names = ["insetInline", "insetInlineEnd", "insetInlineStart"])
  public open fun setInsetInline(
      @Suppress("UNUSED_PARAMETER") index: Int,
      @Suppress("UNUSED_PARAMETER") inset: Dynamic,
  ) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "inset")
  public open fun setInset(@Suppress("UNUSED_PARAMETER") inset: Dynamic) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.MARGIN,
              ViewProps.MARGIN_VERTICAL,
              ViewProps.MARGIN_HORIZONTAL,
              ViewProps.MARGIN_START,
              ViewProps.MARGIN_END,
              ViewProps.MARGIN_TOP,
              ViewProps.MARGIN_BOTTOM,
              ViewProps.MARGIN_LEFT,
              ViewProps.MARGIN_RIGHT,
          ]
  )
  public open fun setMargins(index: Int, margin: Dynamic) {
    if (isVirtual()) {
      return
    }

    val spacingType =
        maybeTransformLeftRightToStartEnd(ViewProps.PADDING_MARGIN_SPACING_TYPES[index])

    tempYogaValue.setFromDynamic(margin)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setMargin(spacingType, tempYogaValue.value)
      YogaUnit.AUTO -> setMarginAuto(spacingType)
      YogaUnit.PERCENT -> setMarginPercent(spacingType, tempYogaValue.value)
      else -> {}
    }

    margin.recycle()
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.PADDING,
              ViewProps.PADDING_VERTICAL,
              ViewProps.PADDING_HORIZONTAL,
              ViewProps.PADDING_START,
              ViewProps.PADDING_END,
              ViewProps.PADDING_TOP,
              ViewProps.PADDING_BOTTOM,
              ViewProps.PADDING_LEFT,
              ViewProps.PADDING_RIGHT,
          ]
  )
  public open fun setPaddings(index: Int, padding: Dynamic) {
    if (isVirtual()) {
      return
    }

    val spacingType =
        maybeTransformLeftRightToStartEnd(ViewProps.PADDING_MARGIN_SPACING_TYPES[index])

    tempYogaValue.setFromDynamic(padding)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setPadding(spacingType, tempYogaValue.value)
      YogaUnit.PERCENT -> setPaddingPercent(spacingType, tempYogaValue.value)
      else -> {}
    }

    padding.recycle()
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.BORDER_WIDTH,
              ViewProps.BORDER_START_WIDTH,
              ViewProps.BORDER_END_WIDTH,
              ViewProps.BORDER_TOP_WIDTH,
              ViewProps.BORDER_BOTTOM_WIDTH,
              ViewProps.BORDER_LEFT_WIDTH,
              ViewProps.BORDER_RIGHT_WIDTH,
          ],
      defaultFloat = Float.NaN,
  )
  public open fun setBorderWidths(index: Int, borderWidth: Float) {
    if (isVirtual()) {
      return
    }
    val spacingType = maybeTransformLeftRightToStartEnd(ViewProps.BORDER_SPACING_TYPES[index])
    setBorder(spacingType, PixelUtil.toPixelFromDIP(borderWidth))
  }

  @ReactPropGroup(
      names =
          [
              ViewProps.START,
              ViewProps.END,
              ViewProps.LEFT,
              ViewProps.RIGHT,
              ViewProps.TOP,
              ViewProps.BOTTOM,
          ]
  )
  public open fun setPositionValues(index: Int, position: Dynamic) {
    if (isVirtual()) {
      return
    }

    val positionSpacingTypes =
        intArrayOf(
            Spacing.START,
            Spacing.END,
            Spacing.LEFT,
            Spacing.RIGHT,
            Spacing.TOP,
            Spacing.BOTTOM,
        )

    val spacingType = maybeTransformLeftRightToStartEnd(positionSpacingTypes[index])

    tempYogaValue.setFromDynamic(position)
    when (tempYogaValue.unit) {
      YogaUnit.POINT,
      YogaUnit.UNDEFINED -> setPosition(spacingType, tempYogaValue.value)
      YogaUnit.PERCENT -> setPositionPercent(spacingType, tempYogaValue.value)
      else -> {}
    }

    position.recycle()
  }

  private fun maybeTransformLeftRightToStartEnd(spacingType: Int): Int {
    if (!I18nUtil.instance.doLeftAndRightSwapInRTL(getThemedContext())) {
      return spacingType
    }

    return when (spacingType) {
      Spacing.LEFT -> Spacing.START
      Spacing.RIGHT -> Spacing.END
      else -> spacingType
    }
  }

  @ReactProp(name = ViewProps.POSITION)
  public open fun setPosition(position: String?) {
    if (isVirtual()) {
      return
    }

    if (position == null) {
      setPositionType(YogaPositionType.RELATIVE)
      return
    }

    when (position) {
      "relative" -> setPositionType(YogaPositionType.RELATIVE)
      "absolute" -> setPositionType(YogaPositionType.ABSOLUTE)
      else -> {
        FLog.w(ReactConstants.TAG, "invalid value for position: $position")
        setPositionType(YogaPositionType.RELATIVE)
      }
    }
  }

  @ReactProp(name = "onLayout")
  public override fun setShouldNotifyOnLayout(shouldNotifyOnLayout: Boolean) {
    super.setShouldNotifyOnLayout(shouldNotifyOnLayout)
  }

  @ReactProp(name = "onPointerEnter")
  public open fun setShouldNotifyPointerEnter(@Suppress("UNUSED_PARAMETER") value: Boolean) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "onPointerLeave")
  public open fun setShouldNotifyPointerLeave(@Suppress("UNUSED_PARAMETER") value: Boolean) {
    // Do Nothing: Align with static ViewConfigs
  }

  @ReactProp(name = "onPointerMove")
  public open fun setShouldNotifyPointerMove(@Suppress("UNUSED_PARAMETER") value: Boolean) {
    // Do Nothing: Align with static ViewConfigs
  }

  public companion object {
    init {
      LegacyArchitectureLogger.assertLegacyArchitecture(
          "LayoutShadowNode",
          LegacyArchitectureLogLevel.ERROR,
      )
    }
  }
}
