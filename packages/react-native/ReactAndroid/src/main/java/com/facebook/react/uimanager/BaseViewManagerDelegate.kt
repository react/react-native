/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

package com.facebook.react.uimanager

import android.view.View
import com.facebook.react.bridge.ColorPropConverter
import com.facebook.react.bridge.Dynamic
import com.facebook.react.bridge.DynamicFromObject
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.ReadableMap
import com.facebook.yoga.YogaConstants

/**
 * This is a base implementation of [ViewManagerDelegate] which supports setting properties that
 * every view should support, such as rotation, background color, etc.
 */
public abstract class BaseViewManagerDelegate<
    T : View,
    @Suppress("DEPRECATION")
    U : BaseViewManager<T, out LayoutShadowNode>,
>(@Suppress("NoHungarianNotation") @JvmField protected val mViewManager: U) :
    ViewManagerDelegate<T> {
  @Suppress("ACCIDENTAL_OVERRIDE", "DEPRECATION")
  public override fun setProperty(view: T, propName: String, value: Any?) {
    when (propName) {
      ViewProps.ACCESSIBILITY_ACTIONS ->
          mViewManager.setAccessibilityActions(view, value as ReadableArray?)

      ViewProps.ACCESSIBILITY_HINT -> mViewManager.setAccessibilityHint(view, value as String?)
      ViewProps.ACCESSIBILITY_LABEL -> mViewManager.setAccessibilityLabel(view, value as String?)
      ViewProps.ACCESSIBILITY_LIVE_REGION ->
          mViewManager.setAccessibilityLiveRegion(view, value as String?)

      ViewProps.ACCESSIBILITY_ROLE -> mViewManager.setAccessibilityRole(view, value as String?)
      ViewProps.ACCESSIBILITY_STATE -> mViewManager.setViewState(view, value as ReadableMap?)
      ViewProps.ACCESSIBILITY_COLLECTION ->
          mViewManager.setAccessibilityCollection(view, value as ReadableMap?)

      ViewProps.ACCESSIBILITY_COLLECTION_ITEM ->
          mViewManager.setAccessibilityCollectionItem(view, value as ReadableMap?)

      ViewProps.ACCESSIBILITY_VALUE ->
          mViewManager.setAccessibilityValue(view, value as ReadableMap?)

      ViewProps.BACKGROUND_COLOR ->
          mViewManager.setBackgroundColor(view, ColorPropConverter.getColor(value, view.context, 0))

      ViewProps.BORDER_RADIUS ->
          mViewManager.setBorderRadius(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.BORDER_BOTTOM_LEFT_RADIUS ->
          mViewManager.setBorderBottomLeftRadius(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.BORDER_BOTTOM_RIGHT_RADIUS ->
          mViewManager.setBorderBottomRightRadius(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.BORDER_TOP_LEFT_RADIUS ->
          mViewManager.setBorderTopLeftRadius(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.BORDER_TOP_RIGHT_RADIUS ->
          mViewManager.setBorderTopRightRadius(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.BOX_SHADOW -> mViewManager.setBoxShadow(view, value as ReadableArray?)

      ViewProps.ELEVATION -> mViewManager.setElevation(view, (value as Double?)?.toFloat() ?: 0.0f)

      ViewProps.FILTER -> mViewManager.setFilter(view, value as ReadableArray?)

      ViewProps.MIX_BLEND_MODE -> mViewManager.setMixBlendMode(view, value as String?)

      ViewProps.SHADOW_COLOR ->
          mViewManager.setShadowColor(view, ColorPropConverter.getColor(value, view.context, 0))

      ViewProps.IMPORTANT_FOR_ACCESSIBILITY ->
          mViewManager.setImportantForAccessibility(view, value as String?)

      ViewProps.SCREEN_READER_FOCUSABLE ->
          mViewManager.setScreenReaderFocusable(view, value as Boolean? ?: false)

      ViewProps.ROLE -> mViewManager.setRole(view, value as String?)
      ViewProps.NATIVE_ID -> mViewManager.setNativeId(view, value as String?)
      ViewProps.ACCESSIBILITY_LABELLED_BY -> {
        val dynamicFromObject: Dynamic = DynamicFromObject(value)
        mViewManager.setAccessibilityLabelledBy(view, dynamicFromObject)
      }
      ViewProps.OPACITY -> mViewManager.setOpacity(view, (value as Double?)?.toFloat() ?: 1.0f)
      ViewProps.OUTLINE_COLOR ->
          mViewManager.setOutlineColor(
              view,
              // Use the overload without a default value to preserve outlineColor's nullable
              // contract.
              ColorPropConverter.getColor(value, view.context),
          )

      ViewProps.OUTLINE_OFFSET ->
          mViewManager.setOutlineOffset(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.OUTLINE_STYLE -> mViewManager.setOutlineStyle(view, value as String?)

      ViewProps.OUTLINE_WIDTH ->
          mViewManager.setOutlineWidth(
              view,
              (value as Double?)?.toFloat() ?: YogaConstants.UNDEFINED,
          )

      ViewProps.RENDER_TO_HARDWARE_TEXTURE ->
          mViewManager.setRenderToHardwareTexture(view, value as Boolean? ?: false)

      ViewProps.ROTATION -> mViewManager.setRotation(view, (value as Double?)?.toFloat() ?: 0.0f)

      ViewProps.SCALE_X -> mViewManager.setScaleX(view, (value as Double?)?.toFloat() ?: 1.0f)

      ViewProps.SCALE_Y -> mViewManager.setScaleY(view, (value as Double?)?.toFloat() ?: 1.0f)

      ViewProps.TEST_ID -> mViewManager.setTestId(view, value as String?)
      ViewProps.TRANSFORM -> mViewManager.setTransform(view, value as ReadableArray?)
      ViewProps.TRANSFORM_ORIGIN -> mViewManager.setTransformOrigin(view, value as ReadableArray?)
      ViewProps.TRANSLATE_X ->
          mViewManager.setTranslateX(view, (value as Double?)?.toFloat() ?: 0.0f)

      ViewProps.TRANSLATE_Y ->
          mViewManager.setTranslateY(view, (value as Double?)?.toFloat() ?: 0.0f)

      ViewProps.Z_INDEX -> mViewManager.setZIndex(view, (value as Double?)?.toFloat() ?: 0.0f)

      // Experimental pointer events
      ViewProps.ON_POINTER_ENTER -> mViewManager.setPointerEnter(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_ENTER_CAPTURE ->
          mViewManager.setPointerEnterCapture(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_OVER -> mViewManager.setPointerOver(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_OVER_CAPTURE ->
          mViewManager.setPointerOverCapture(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_OUT -> mViewManager.setPointerOut(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_OUT_CAPTURE ->
          mViewManager.setPointerOutCapture(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_LEAVE -> mViewManager.setPointerLeave(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_LEAVE_CAPTURE ->
          mViewManager.setPointerLeaveCapture(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_MOVE -> mViewManager.setPointerMove(view, value as Boolean? ?: false)
      ViewProps.ON_POINTER_MOVE_CAPTURE ->
          mViewManager.setPointerMoveCapture(view, value as Boolean? ?: false)
      ViewProps.ON_CLICK -> mViewManager.setClick(view, value as Boolean? ?: false)
      ViewProps.ON_CLICK_CAPTURE -> mViewManager.setClickCapture(view, value as Boolean? ?: false)
    }
  }

  @Suppress("ACCIDENTAL_OVERRIDE")
  public override fun receiveCommand(view: T, commandName: String, args: ReadableArray): Unit = Unit
}
