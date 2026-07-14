/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.graphics.Color
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.ReadableType

/** Keys for props that need to be shared across multiple classes. */
public object ViewProps {
  public const val VIEW_CLASS_NAME: String = "RCTView"
  // Layout only (only affect positions of children, causes no drawing)
  // !!! Keep in sync with LAYOUT_ONLY_PROPS below
  public const val ALIGN_ITEMS: String = "alignItems"
  public const val ALIGN_SELF: String = "alignSelf"
  public const val ALIGN_CONTENT: String = "alignContent"
  public const val DISPLAY: String = "display"
  public const val BOTTOM: String = "bottom"
  public const val COLLAPSABLE: String = "collapsable"
  public const val COLLAPSABLE_CHILDREN: String = "collapsableChildren"
  public const val FLEX: String = "flex"
  public const val FLEX_GROW: String = "flexGrow"
  public const val FLEX_SHRINK: String = "flexShrink"
  public const val FLEX_BASIS: String = "flexBasis"
  public const val FLEX_DIRECTION: String = "flexDirection"
  public const val FLEX_WRAP: String = "flexWrap"
  public const val ROW_GAP: String = "rowGap"
  public const val COLUMN_GAP: String = "columnGap"
  public const val GAP: String = "gap"
  public const val HEIGHT: String = "height"
  public const val JUSTIFY_CONTENT: String = "justifyContent"
  public const val LEFT: String = "left"
  public const val MARGIN: String = "margin"
  public const val MARGIN_VERTICAL: String = "marginVertical"
  public const val MARGIN_HORIZONTAL: String = "marginHorizontal"
  public const val MARGIN_LEFT: String = "marginLeft"
  public const val MARGIN_RIGHT: String = "marginRight"
  public const val MARGIN_TOP: String = "marginTop"
  public const val MARGIN_BOTTOM: String = "marginBottom"
  public const val MARGIN_START: String = "marginStart"
  public const val MARGIN_END: String = "marginEnd"
  public const val PADDING: String = "padding"
  public const val PADDING_VERTICAL: String = "paddingVertical"
  public const val PADDING_HORIZONTAL: String = "paddingHorizontal"
  public const val PADDING_LEFT: String = "paddingLeft"
  public const val PADDING_RIGHT: String = "paddingRight"
  public const val PADDING_TOP: String = "paddingTop"
  public const val PADDING_BOTTOM: String = "paddingBottom"
  public const val PADDING_START: String = "paddingStart"
  public const val PADDING_END: String = "paddingEnd"
  public const val POSITION: String = "position"
  public const val RIGHT: String = "right"
  public const val TOP: String = "top"
  public const val WIDTH: String = "width"
  public const val START: String = "start"
  public const val END: String = "end"
  public const val AUTO: String = "auto"
  public const val NONE: String = "none"
  public const val BOX_NONE: String = "box-none"
  public const val MIN_WIDTH: String = "minWidth"
  public const val MAX_WIDTH: String = "maxWidth"
  public const val MIN_HEIGHT: String = "minHeight"
  public const val MAX_HEIGHT: String = "maxHeight"
  public const val ASPECT_RATIO: String = "aspectRatio"
  // Props that sometimes may prevent us from collapsing views
  public const val POINTER_EVENTS: String = "pointerEvents"
  // Props that affect more than just layout
  public const val ENABLED: String = "enabled"
  public const val BACKGROUND_COLOR: String = "backgroundColor"
  public const val BACKGROUND_IMAGE: String = "backgroundImage"
  // Backwards-compatible alias for the original experimental_ prefixed prop name.
  public const val EXPERIMENTAL_BACKGROUND_IMAGE: String = "experimental_backgroundImage"
  public const val BACKGROUND_SIZE: String = "experimental_backgroundSize"
  public const val BACKGROUND_POSITION: String = "experimental_backgroundPosition"
  public const val BACKGROUND_REPEAT: String = "experimental_backgroundRepeat"
  public const val FOREGROUND_COLOR: String = "foregroundColor"
  public const val COLOR: String = "color"
  public const val FONT_SIZE: String = "fontSize"
  public const val FONT_WEIGHT: String = "fontWeight"
  public const val FONT_STYLE: String = "fontStyle"
  public const val FONT_VARIANT: String = "fontVariant"
  public const val FONT_FAMILY: String = "fontFamily"
  public const val LINE_HEIGHT: String = "lineHeight"
  public const val LETTER_SPACING: String = "letterSpacing"
  public const val NEEDS_OFFSCREEN_ALPHA_COMPOSITING: String = "needsOffscreenAlphaCompositing"
  public const val NUMBER_OF_LINES: String = "numberOfLines"
  public const val ELLIPSIZE_MODE: String = "ellipsizeMode"
  public const val ADJUSTS_FONT_SIZE_TO_FIT: String = "adjustsFontSizeToFit"
  public const val MINIMUM_FONT_SCALE: String = "minimumFontScale"
  public const val ON: String = "on"
  public const val RESIZE_MODE: String = "resizeMode"
  public const val RESIZE_METHOD: String = "resizeMethod"
  public const val LAYOUT_DIRECTION: String = "layoutDirection"
  public const val TEXT_ALIGN: String = "textAlign"
  public const val TEXT_ALIGN_VERTICAL: String = "textAlignVertical"
  public const val TEXT_DECORATION_LINE: String = "textDecorationLine"
  public const val TEXT_BREAK_STRATEGY: String = "textBreakStrategy"
  public const val OPACITY: String = "opacity"
  public const val OVERFLOW: String = "overflow"
  public const val HIDDEN: String = "hidden"
  public const val SCROLL: String = "scroll"
  public const val VISIBLE: String = "visible"
  public const val ALLOW_FONT_SCALING: String = "allowFontScaling"
  public const val MAX_FONT_SIZE_MULTIPLIER: String = "maxFontSizeMultiplier"
  public const val INCLUDE_FONT_PADDING: String = "includeFontPadding"
  public const val BORDER_WIDTH: String = "borderWidth"
  public const val BORDER_LEFT_WIDTH: String = "borderLeftWidth"
  public const val BORDER_START_WIDTH: String = "borderStartWidth"
  public const val BORDER_END_WIDTH: String = "borderEndWidth"
  public const val BORDER_TOP_WIDTH: String = "borderTopWidth"
  public const val BORDER_RIGHT_WIDTH: String = "borderRightWidth"
  public const val BORDER_BOTTOM_WIDTH: String = "borderBottomWidth"
  public const val BORDER_RADIUS: String = "borderRadius"
  public const val BORDER_TOP_LEFT_RADIUS: String = "borderTopLeftRadius"
  public const val BORDER_TOP_RIGHT_RADIUS: String = "borderTopRightRadius"
  public const val BORDER_BOTTOM_LEFT_RADIUS: String = "borderBottomLeftRadius"
  public const val BORDER_BOTTOM_RIGHT_RADIUS: String = "borderBottomRightRadius"
  public const val BORDER_COLOR: String = "borderColor"
  public const val BORDER_LEFT_COLOR: String = "borderLeftColor"
  public const val BORDER_RIGHT_COLOR: String = "borderRightColor"
  public const val BORDER_TOP_COLOR: String = "borderTopColor"
  public const val BORDER_BOTTOM_COLOR: String = "borderBottomColor"
  public const val BORDER_BLOCK_COLOR: String = "borderBlockColor"
  public const val BORDER_BLOCK_END_COLOR: String = "borderBlockEndColor"
  public const val BORDER_BLOCK_START_COLOR: String = "borderBlockStartColor"
  public const val BORDER_TOP_START_RADIUS: String = "borderTopStartRadius"
  public const val BORDER_TOP_END_RADIUS: String = "borderTopEndRadius"
  public const val BORDER_BOTTOM_START_RADIUS: String = "borderBottomStartRadius"
  public const val BORDER_BOTTOM_END_RADIUS: String = "borderBottomEndRadius"
  public const val BORDER_END_END_RADIUS: String = "borderEndEndRadius"
  public const val BORDER_END_START_RADIUS: String = "borderEndStartRadius"
  public const val BORDER_START_END_RADIUS: String = "borderStartEndRadius"
  public const val BORDER_START_START_RADIUS: String = "borderStartStartRadius"
  public const val BORDER_START_COLOR: String = "borderStartColor"
  public const val BORDER_END_COLOR: String = "borderEndColor"
  public const val BOX_SHADOW: String = "boxShadow"
  public const val FILTER: String = "filter"
  public const val MIX_BLEND_MODE: String = "mixBlendMode"
  public const val OUTLINE_COLOR: String = "outlineColor"
  public const val OUTLINE_OFFSET: String = "outlineOffset"
  public const val OUTLINE_STYLE: String = "outlineStyle"
  public const val OUTLINE_WIDTH: String = "outlineWidth"
  public const val TRANSFORM: String = "transform"
  public const val TRANSFORM_ORIGIN: String = "transformOrigin"
  public const val ELEVATION: String = "elevation"
  public const val SHADOW_COLOR: String = "shadowColor"
  public const val Z_INDEX: String = "zIndex"
  public const val RENDER_TO_HARDWARE_TEXTURE: String = "renderToHardwareTextureAndroid"
  public const val ACCESSIBILITY_LABEL: String = "accessibilityLabel"
  public const val ACCESSIBILITY_COLLECTION: String = "accessibilityCollection"
  public const val ACCESSIBILITY_COLLECTION_ITEM: String = "accessibilityCollectionItem"
  public const val ACCESSIBILITY_HINT: String = "accessibilityHint"
  public const val ACCESSIBILITY_LIVE_REGION: String = "accessibilityLiveRegion"
  public const val ACCESSIBILITY_ROLE: String = "accessibilityRole"
  public const val ACCESSIBILITY_STATE: String = "accessibilityState"
  public const val ACCESSIBILITY_ACTIONS: String = "accessibilityActions"
  public const val ACCESSIBILITY_VALUE: String = "accessibilityValue"
  public const val ACCESSIBILITY_LABELLED_BY: String = "accessibilityLabelledBy"
  public const val ACCESSIBILITY_ORDER: String = "experimental_accessibilityOrder"
  public const val IMPORTANT_FOR_ACCESSIBILITY: String = "importantForAccessibility"
  public const val SCREEN_READER_FOCUSABLE: String = "screenReaderFocusable"
  public const val ROLE: String = "role"
  // DEPRECATED
  public const val ROTATION: String = "rotation"
  public const val SCALE_X: String = "scaleX"
  public const val SCALE_Y: String = "scaleY"
  public const val TRANSLATE_X: String = "translateX"
  public const val TRANSLATE_Y: String = "translateY"
  /** Used to locate views in end-to-end (UI) tests. */
  public const val TEST_ID: String = "testID"
  public const val NATIVE_ID: String = "nativeID"
  internal const val ON_POINTER_ENTER: String = "onPointerEnter"
  internal const val ON_POINTER_ENTER_CAPTURE: String = "onPointerEnterCapture"
  internal const val ON_POINTER_OVER: String = "onPointerOver"
  internal const val ON_POINTER_OVER_CAPTURE: String = "onPointerOverCapture"
  internal const val ON_POINTER_OUT: String = "onPointerOut"
  internal const val ON_POINTER_OUT_CAPTURE: String = "onPointerOutCapture"
  internal const val ON_POINTER_LEAVE: String = "onPointerLeave"
  internal const val ON_POINTER_LEAVE_CAPTURE: String = "onPointerLeaveCapture"
  internal const val ON_POINTER_MOVE: String = "onPointerMove"
  internal const val ON_POINTER_MOVE_CAPTURE: String = "onPointerMoveCapture"
  internal const val ON_CLICK: String = "onClick"
  internal const val ON_CLICK_CAPTURE: String = "onClickCapture"
  @JvmField
  public val BORDER_SPACING_TYPES: IntArray = intArrayOf(
      Spacing.ALL,
      Spacing.START,
      Spacing.END,
      Spacing.TOP,
      Spacing.BOTTOM,
      Spacing.LEFT,
      Spacing.RIGHT,
  )
  @JvmField
  public val PADDING_MARGIN_SPACING_TYPES: IntArray = intArrayOf(
      Spacing.ALL,
      Spacing.VERTICAL,
      Spacing.HORIZONTAL,
      Spacing.START,
      Spacing.END,
      Spacing.TOP,
      Spacing.BOTTOM,
      Spacing.LEFT,
      Spacing.RIGHT,
  )
  private val LAYOUT_ONLY_PROPS: HashSet<String> = HashSet(
      listOf(
          ALIGN_SELF,
          ALIGN_ITEMS,
          COLLAPSABLE,
          FLEX,
          FLEX_BASIS,
          FLEX_DIRECTION,
          FLEX_GROW,
          ROW_GAP,
          COLUMN_GAP,
          GAP,
          FLEX_SHRINK,
          FLEX_WRAP,
          JUSTIFY_CONTENT,
          ALIGN_CONTENT,
          DISPLAY, /* position */
          POSITION,
          RIGHT,
          TOP,
          BOTTOM,
          LEFT,
          START,
          END, /* dimensions */
          WIDTH,
          HEIGHT,
          MIN_WIDTH,
          MAX_WIDTH,
          MIN_HEIGHT,
          MAX_HEIGHT, /* margins */
          MARGIN,
          MARGIN_VERTICAL,
          MARGIN_HORIZONTAL,
          MARGIN_LEFT,
          MARGIN_RIGHT,
          MARGIN_TOP,
          MARGIN_BOTTOM,
          MARGIN_START,
          MARGIN_END, /* paddings */
          PADDING,
          PADDING_VERTICAL,
          PADDING_HORIZONTAL,
          PADDING_LEFT,
          PADDING_RIGHT,
          PADDING_TOP,
          PADDING_BOTTOM,
          PADDING_START,
          PADDING_END,
      )
  )

  @JvmStatic
  public fun isLayoutOnly(map: ReadableMap, prop: String): Boolean {
    if (LAYOUT_ONLY_PROPS.contains(prop)) {
      return true
    } else if (POINTER_EVENTS == prop) {
      val value = map.getString(prop)
      return AUTO == value || BOX_NONE == value
    }
    return when (prop) {
      OPACITY ->
          // null opacity behaves like opacity = 1
          // Ignore if explicitly set to default opacity.
          map.isNull(OPACITY) || map.getDouble(OPACITY) == 1.0
      BORDER_RADIUS -> {
        if (map.hasKey(BACKGROUND_COLOR)) {
          val valueType = map.getType(BACKGROUND_COLOR)
          if (
              valueType == ReadableType.Number && map.getInt(BACKGROUND_COLOR) != Color.TRANSPARENT
          ) {
            return false
          } else if (valueType != ReadableType.Null) {
            return false
          }
        }
        if (
            map.hasKey(BORDER_WIDTH) &&
                !map.isNull(BORDER_WIDTH) &&
                map.getDouble(BORDER_WIDTH) != 0.0
        ) {
          return false
        } else {
          return true
        }
      }
      BORDER_LEFT_COLOR ->
          (map.getType(BORDER_LEFT_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_LEFT_COLOR) == Color.TRANSPARENT)
      BORDER_RIGHT_COLOR ->
          (map.getType(BORDER_RIGHT_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_RIGHT_COLOR) == Color.TRANSPARENT)
      BORDER_TOP_COLOR ->
          (map.getType(BORDER_TOP_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_TOP_COLOR) == Color.TRANSPARENT)
      BORDER_BOTTOM_COLOR ->
          (map.getType(BORDER_BOTTOM_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_BOTTOM_COLOR) == Color.TRANSPARENT)
      BORDER_BLOCK_COLOR ->
          (map.getType(BORDER_BLOCK_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_BLOCK_COLOR) == Color.TRANSPARENT)
      BORDER_BLOCK_END_COLOR ->
          (map.getType(BORDER_BLOCK_END_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_BLOCK_END_COLOR) == Color.TRANSPARENT)
      BORDER_BLOCK_START_COLOR ->
          (map.getType(BORDER_BLOCK_START_COLOR) == ReadableType.Number &&
              map.getInt(BORDER_BLOCK_START_COLOR) == Color.TRANSPARENT)
      BORDER_WIDTH -> map.isNull(BORDER_WIDTH) || map.getDouble(BORDER_WIDTH) == 0.0
      BORDER_LEFT_WIDTH -> map.isNull(BORDER_LEFT_WIDTH) || map.getDouble(BORDER_LEFT_WIDTH) == 0.0
      BORDER_TOP_WIDTH -> map.isNull(BORDER_TOP_WIDTH) || map.getDouble(BORDER_TOP_WIDTH) == 0.0
      BORDER_RIGHT_WIDTH ->
          map.isNull(BORDER_RIGHT_WIDTH) || map.getDouble(BORDER_RIGHT_WIDTH) == 0.0
      BORDER_BOTTOM_WIDTH ->
          map.isNull(BORDER_BOTTOM_WIDTH) || map.getDouble(BORDER_BOTTOM_WIDTH) == 0.0
      OVERFLOW -> map.isNull(OVERFLOW) || VISIBLE == map.getString(OVERFLOW)
      else -> false
    }
  }
}
