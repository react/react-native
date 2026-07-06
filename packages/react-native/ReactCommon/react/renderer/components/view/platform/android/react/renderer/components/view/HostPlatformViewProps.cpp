/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformViewProps.h"

#include <algorithm>

#include <react/renderer/components/view/accessibilityPropsConversions.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/components/view/propsConversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/core/propsConversions.h>
#include <react/renderer/graphics/TransformUtils.h>

namespace facebook::react {

HostPlatformViewProps::HostPlatformViewProps(
    const PropsParserContext& context,
    const HostPlatformViewProps& sourceProps,
    const RawProps& rawProps,
    const std::function<bool(const std::string&)>& filterObjectKeys)
    : BaseViewProps(context, sourceProps, rawProps, filterObjectKeys),
      elevation(convertRawProp(
          context,
          rawProps,
          "elevation",
          sourceProps.elevation,
          {})),
      nativeBackground(convertRawProp(
          context,
          rawProps,
          "nativeBackgroundAndroid",
          sourceProps.nativeBackground,
          {})),
      nativeForeground(convertRawProp(
          context,
          rawProps,
          "nativeForegroundAndroid",
          sourceProps.nativeForeground,
          {})),
      focusable(convertRawProp(
          context,
          rawProps,
          "focusable",
          sourceProps.focusable,
          {})),
      hasTVPreferredFocus(convertRawProp(
          context,
          rawProps,
          "hasTVPreferredFocus",
          sourceProps.hasTVPreferredFocus,
          {})),
      needsOffscreenAlphaCompositing(convertRawProp(
          context,
          rawProps,
          "needsOffscreenAlphaCompositing",
          sourceProps.needsOffscreenAlphaCompositing,
          {})),
      renderToHardwareTextureAndroid(convertRawProp(
          context,
          rawProps,
          "renderToHardwareTextureAndroid",
          sourceProps.renderToHardwareTextureAndroid,
          {})),
      screenReaderFocusable(convertRawProp(
          context,
          rawProps,
          "screenReaderFocusable",
          sourceProps.screenReaderFocusable,
          {})),
      nextFocusDown(convertRawProp(
          context,
          rawProps,
          "nextFocusDown",
          sourceProps.nextFocusDown,
          {})),
      nextFocusForward(convertRawProp(
          context,
          rawProps,
          "nextFocusForward",
          sourceProps.nextFocusForward,
          {})),
      nextFocusLeft(convertRawProp(
          context,
          rawProps,
          "nextFocusLeft",
          sourceProps.nextFocusLeft,
          {})),
      nextFocusRight(convertRawProp(
          context,
          rawProps,
          "nextFocusRight",
          sourceProps.nextFocusRight,
          {})),
      nextFocusUp(convertRawProp(
          context,
          rawProps,
          "nextFocusUp",
          sourceProps.nextFocusUp,
          {})) {}

void HostPlatformViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseViewProps::setProp(context, hash, propName, value);

  static auto defaults = HostPlatformViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(elevation);
    RAW_SET_PROP_SWITCH_CASE(nativeBackground, "nativeBackgroundAndroid");
    RAW_SET_PROP_SWITCH_CASE(nativeForeground, "nativeForegroundAndroid");
    RAW_SET_PROP_SWITCH_CASE_BASIC(focusable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(hasTVPreferredFocus);
    RAW_SET_PROP_SWITCH_CASE_BASIC(needsOffscreenAlphaCompositing);
    RAW_SET_PROP_SWITCH_CASE_BASIC(renderToHardwareTextureAndroid);
    RAW_SET_PROP_SWITCH_CASE_BASIC(screenReaderFocusable);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusDown);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusForward);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusLeft);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusRight);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nextFocusUp);
  }
}

bool HostPlatformViewProps::getProbablyMoreHorizontalThanVertical_DEPRECATED()
    const {
  return yogaStyle.flexDirection() == yoga::FlexDirection::Row;
}

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList HostPlatformViewProps::getDebugProps() const {
  return BaseViewProps::getDebugProps();
}
#endif

#ifdef RN_SERIALIZABLE_STATE

inline static void updateEventProp(
    folly::dynamic& result,
    const ViewEvents& newEvents,
    const ViewEvents& oldEvents,
    const ViewEvents::Offset& offset,
    const std::string& name) {
  if (newEvents[offset] != oldEvents[offset]) {
    auto value = newEvents[offset];
    result[name] = value;
  }
}

static void updateBorderWidthPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<float>& newValue,
    const std::optional<float>& oldValue) {
  if (newValue != oldValue) {
    if (newValue.has_value()) {
      result[propName] = newValue.value();
    } else {
      result[propName] = NULL;
    }
  }
}

static void updateBorderWidthProps(
    folly::dynamic& result,
    const CascadedBorderWidths& newBorderWidths,
    const CascadedBorderWidths& oldBorderWidths) {
  updateBorderWidthPropValue(
      result, "borderWidth", newBorderWidths.all, oldBorderWidths.all);
  updateBorderWidthPropValue(
      result, "borderTopWidth", newBorderWidths.top, oldBorderWidths.top);
  updateBorderWidthPropValue(
      result, "borderLeftWidth", newBorderWidths.left, oldBorderWidths.left);
  updateBorderWidthPropValue(
      result, "borderStartWidth", newBorderWidths.start, oldBorderWidths.start);
  updateBorderWidthPropValue(
      result, "borderEndWidth", newBorderWidths.end, oldBorderWidths.end);
  updateBorderWidthPropValue(
      result, "borderRightWidth", newBorderWidths.right, oldBorderWidths.right);
  updateBorderWidthPropValue(
      result,
      "borderBottomWidth",
      newBorderWidths.bottom,
      oldBorderWidths.bottom);
}

static void updateBorderRadiusPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<ValueUnit>& newValue,
    const std::optional<ValueUnit>& oldValue) {
  if (newValue != oldValue) {
    if (newValue.has_value()) {
      if (newValue.value().unit == UnitType::Percent) {
        result[propName] = std::to_string(newValue.value().value) + "%";
      } else {
        result[propName] = newValue.value().value;
      }
    } else {
      result[propName] = -1;
    }
  }
}

static void updateBorderRadiusProps(
    folly::dynamic& result,
    const CascadedBorderRadii& newBorderRadii,
    const CascadedBorderRadii& oldBorderRadii) {
  updateBorderRadiusPropValue(
      result, "borderRadius", newBorderRadii.all, oldBorderRadii.all);
  updateBorderRadiusPropValue(
      result,
      "borderTopLeftRadius",
      newBorderRadii.topLeft,
      oldBorderRadii.topLeft);
  updateBorderRadiusPropValue(
      result,
      "borderTopRightRadius",
      newBorderRadii.topRight,
      oldBorderRadii.topRight);
  updateBorderRadiusPropValue(
      result,
      "borderBottomRightRadius",
      newBorderRadii.bottomRight,
      oldBorderRadii.bottomRight);
  updateBorderRadiusPropValue(
      result,
      "borderBottomLeftRadius",
      newBorderRadii.bottomLeft,
      oldBorderRadii.bottomLeft);
  updateBorderRadiusPropValue(
      result,
      "borderTopStartRadius",
      newBorderRadii.topStart,
      oldBorderRadii.topStart);
  updateBorderRadiusPropValue(
      result,
      "borderTopEndRadius",
      newBorderRadii.topEnd,
      oldBorderRadii.topEnd);
  updateBorderRadiusPropValue(
      result,
      "borderBottomStartRadius",
      newBorderRadii.bottomStart,
      oldBorderRadii.bottomStart);
  updateBorderRadiusPropValue(
      result,
      "borderBottomEndRadius",
      newBorderRadii.bottomEnd,
      oldBorderRadii.bottomEnd);
  updateBorderRadiusPropValue(
      result,
      "borderEndEndRadius",
      newBorderRadii.endEnd,
      oldBorderRadii.endEnd);
  updateBorderRadiusPropValue(
      result,
      "borderEndStartRadius",
      newBorderRadii.endStart,
      oldBorderRadii.endStart);
  updateBorderRadiusPropValue(
      result,
      "borderStartEndRadius",
      newBorderRadii.startEnd,
      oldBorderRadii.startEnd);
  updateBorderRadiusPropValue(
      result,
      "borderStartStartRadius",
      newBorderRadii.startStart,
      oldBorderRadii.startStart);
}

static void updateBorderStyleProps(
    folly::dynamic& result,
    const CascadedBorderStyles& newBorderStyle,
    const CascadedBorderStyles& oldBorderStyle) {
  if (newBorderStyle.all != oldBorderStyle.all) {
    if (newBorderStyle.all.has_value()) {
      switch (newBorderStyle.all.value()) {
        case BorderStyle::Solid:
          result["borderStyle"] = "solid";
          break;
        case BorderStyle::Dotted:
          result["borderStyle"] = "dotted";
          break;
        case BorderStyle::Dashed:
          result["borderStyle"] = "dashed";
          break;
      }
    } else {
      result["borderStyle"] = folly::dynamic(nullptr);
    }
  }
}

static void updateBorderColorPropValue(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<SharedColor>& newColor,
    const std::optional<SharedColor>& oldColor) {
  if (newColor != oldColor) {
    result[propName] = newColor.has_value() ? *newColor.value() : NULL;
  }
}

static void updateBorderColorsProps(
    folly::dynamic& result,
    const CascadedBorderColors& newBorderColor,
    const CascadedBorderColors& oldBorderColor) {
  updateBorderColorPropValue(
      result, "borderColor", newBorderColor.all, oldBorderColor.all);
  updateBorderColorPropValue(
      result, "borderLeftColor", newBorderColor.left, oldBorderColor.left);
  updateBorderColorPropValue(
      result, "borderRightColor", newBorderColor.right, oldBorderColor.right);
  updateBorderColorPropValue(
      result, "borderTopColor", newBorderColor.top, oldBorderColor.top);
  updateBorderColorPropValue(
      result,
      "borderBottomColor",
      newBorderColor.bottom,
      oldBorderColor.bottom);
  updateBorderColorPropValue(
      result, "borderEndColor", newBorderColor.end, oldBorderColor.end);
  updateBorderColorPropValue(
      result, "borderStartColor", newBorderColor.start, oldBorderColor.start);
  updateBorderColorPropValue(
      result, "borderBlockColor", newBorderColor.block, oldBorderColor.block);
  updateBorderColorPropValue(
      result,
      "borderBlockEndColor",
      newBorderColor.blockEnd,
      oldBorderColor.blockEnd);
  updateBorderColorPropValue(
      result,
      "borderBlockStartColor",
      newBorderColor.blockStart,
      oldBorderColor.blockStart);
}

inline static void updateNativeDrawableProp(
    folly::dynamic& result,
    const std::string& propName,
    const std::optional<NativeDrawable>& nativeDrawable) {
  folly::dynamic nativeDrawableResult;
  if (nativeDrawable.has_value()) {
    nativeDrawableResult = folly::dynamic::object();
    const auto& nativeDrawableValue = nativeDrawable.value();
    nativeDrawableResult["attribute"] = nativeDrawableValue.themeAttr;
    switch (nativeDrawableValue.kind) {
      case NativeDrawable::Kind::Ripple:
        nativeDrawableResult["type"] = "RippleAndroid";
        break;
      case NativeDrawable::Kind::ThemeAttr:
        nativeDrawableResult["type"] = "ThemeAttrAndroid";
        break;
    }
    if (nativeDrawableValue.ripple.rippleRadius.has_value()) {
      nativeDrawableResult["rippleRadius"] =
          nativeDrawableValue.ripple.rippleRadius.value();
    }
    if (nativeDrawableValue.ripple.color.has_value() ||
        nativeDrawableValue.ripple.colorResourcePaths.has_value()) {
      if (nativeDrawableValue.ripple.colorResourcePaths.has_value()) {
        folly::dynamic resourcePaths = folly::dynamic::array();
        for (const auto& path :
             nativeDrawableValue.ripple.colorResourcePaths.value()) {
          resourcePaths.push_back(path);
        }
        folly::dynamic platformColorMap = folly::dynamic::object();
        platformColorMap["resource_paths"] = resourcePaths;
        nativeDrawableResult["color"] = platformColorMap;
      } else {
        nativeDrawableResult["color"] =
            toAndroidRepr(nativeDrawableValue.ripple.color.value());
      }
      if (nativeDrawableValue.ripple.alpha.has_value()) {
        nativeDrawableResult["alpha"] =
            nativeDrawableValue.ripple.alpha.value();
      }
    }
    nativeDrawableResult["borderless"] = nativeDrawableValue.ripple.borderless;
  } else {
    nativeDrawableResult = folly::dynamic(nullptr);
  }

  result[propName] = nativeDrawableResult;
}

inline static void updateAccessibilityStateProp(
    folly::dynamic& result,
    const std::optional<AccessibilityState>& newState,
    const std::optional<AccessibilityState>& oldState) {
  folly::dynamic resultState = folly::dynamic::object();

  if (!newState.has_value() && oldState.has_value()) {
    result["accessibilityState"] = resultState;
    return;
  }

  if (!oldState.has_value() || newState->disabled != oldState->disabled) {
    resultState["disabled"] = newState->disabled;
  }

  if (!oldState.has_value() || newState->selected != oldState->selected) {
    resultState["selected"] = newState->selected;
  }

  if (!oldState.has_value() || newState->busy != oldState->busy) {
    resultState["busy"] = newState->busy;
  }

  if (!oldState.has_value() || newState->expanded != oldState->expanded) {
    if (newState->expanded.has_value()) {
      resultState["expanded"] = newState->expanded.value();
    }
  }

  if (!oldState.has_value() || newState->checked != oldState->checked) {
    switch (newState->checked) {
      case AccessibilityState::Unchecked:
        resultState["checked"] = false;
        break;
      case AccessibilityState::Checked:
        resultState["checked"] = true;
        break;
      case AccessibilityState::Mixed:
        resultState["checked"] = "mixed";
        break;
      case AccessibilityState::None:
        resultState["checked"] = "none";
        break;
    }
  }
  result["accessibilityState"] = resultState;
}

ComponentName HostPlatformViewProps::getDiffPropsImplementationTarget() const {
  return "View";
}

folly::dynamic HostPlatformViewProps::getDiffProps(
    const Props* prevProps) const {
  folly::dynamic result = folly::dynamic::object();

  static const auto defaultProps = HostPlatformViewProps();

  const HostPlatformViewProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const HostPlatformViewProps*>(prevProps);

  if (this == oldProps) {
    return result;
  }

  if (elevation != oldProps->elevation) {
    result["elevation"] = elevation;
  }

  if (focusable != oldProps->focusable) {
    result["focusable"] = focusable;
  }

  if (hasTVPreferredFocus != oldProps->hasTVPreferredFocus) {
    result["hasTVPreferredFocus"] = hasTVPreferredFocus;
  }

  if (needsOffscreenAlphaCompositing !=
      oldProps->needsOffscreenAlphaCompositing) {
    result["needsOffscreenAlphaCompositing"] = needsOffscreenAlphaCompositing;
  }

  if (renderToHardwareTextureAndroid !=
      oldProps->renderToHardwareTextureAndroid) {
    result["renderToHardwareTextureAndroid"] = renderToHardwareTextureAndroid;
  }

  if (screenReaderFocusable != oldProps->screenReaderFocusable) {
    result["screenReaderFocusable"] = screenReaderFocusable;
  }

  if (role != oldProps->role) {
    result["role"] = toString(role);
  }

  if (opacity != oldProps->opacity) {
    result["opacity"] = opacity;
  }

  if (backgroundColor != oldProps->backgroundColor) {
    result["backgroundColor"] = *backgroundColor;
  }

  if (outlineColor != oldProps->outlineColor) {
    result["outlineColor"] = *outlineColor;
  }

  if (outlineOffset != oldProps->outlineOffset) {
    result["outlineOffset"] = outlineOffset;
  }

  if (outlineStyle != oldProps->outlineStyle) {
    switch (outlineStyle) {
      case OutlineStyle::Solid:
        result["outlineStyle"] = "solid";
        break;
      case OutlineStyle::Dotted:
        result["outlineStyle"] = "dotted";
        break;
      case OutlineStyle::Dashed:
        result["outlineStyle"] = "dashed";
        break;
    }
  }

  if (outlineWidth != oldProps->outlineWidth) {
    result["outlineWidth"] = outlineWidth;
  }

  if (shadowColor != oldProps->shadowColor) {
    result["shadowColor"] = *shadowColor;
  }

  if (shadowOpacity != oldProps->shadowOpacity) {
    result["shadowOpacity"] = shadowOpacity;
  }

  if (shadowRadius != oldProps->shadowRadius) {
    result["shadowRadius"] = shadowRadius;
  }

  if (shouldRasterize != oldProps->shouldRasterize) {
    result["shouldRasterize"] = shouldRasterize;
  }

  if (collapsable != oldProps->collapsable) {
    result["collapsable"] = collapsable;
  }

  if (removeClippedSubviews != oldProps->removeClippedSubviews) {
    result["removeClippedSubviews"] = removeClippedSubviews;
  }

  if (collapsableChildren != oldProps->collapsableChildren) {
    result["collapsableChildren"] = collapsableChildren;
  }

  if (onLayout != oldProps->onLayout) {
    result["onLayout"] = onLayout;
  }

  if (zIndex != oldProps->zIndex) {
    result["zIndex"] =
        zIndex.has_value() ? zIndex.value() : folly::dynamic(nullptr);
  }

  if (boxShadow != oldProps->boxShadow) {
    result["boxShadow"] = toDynamic(boxShadow);
  }

  if (filter != oldProps->filter) {
    result["filter"] = toDynamic(filter);
  }

  if (backgroundImage != oldProps->backgroundImage) {
    result["backgroundImage"] = toDynamic(backgroundImage);
  }

  if (mixBlendMode != oldProps->mixBlendMode) {
    result["mixBlendMode"] = toString(mixBlendMode);
  }

  if (pointerEvents != oldProps->pointerEvents) {
    result["pointerEvents"] = toString(pointerEvents);
  }

  if (hitSlop != oldProps->hitSlop) {
    result["hitSlop"] = toDynamic(hitSlop);
  }

  if (nativeId != oldProps->nativeId) {
    result["nativeID"] = nativeId;
  }

  if (testId != oldProps->testId) {
    result["testID"] = testId;
  }

  if (accessible != oldProps->accessible) {
    result["accessible"] = accessible;
  }

  if (getClipsContentToBounds() != oldProps->getClipsContentToBounds()) {
    result["overflow"] = getClipsContentToBounds() ? "hidden" : "visible";
    result["scroll"] = result["overflow"];
  }

  if (backfaceVisibility != oldProps->backfaceVisibility) {
    switch (backfaceVisibility) {
      case BackfaceVisibility::Auto:
        result["backfaceVisibility"] = "auto";
        break;
      case BackfaceVisibility::Visible:
        result["backfaceVisibility"] = "visible";
        break;
      case BackfaceVisibility::Hidden:
        result["backfaceVisibility"] = "hidden";
        break;
    }
  }

  if (nativeBackground != oldProps->nativeBackground) {
    updateNativeDrawableProp(
        result, "nativeBackgroundAndroid", nativeBackground);
  }

  if (nativeForeground != oldProps->nativeForeground) {
    updateNativeDrawableProp(
        result, "nativeForegroundAndroid", nativeForeground);
  }

  // Events
  // TODO T212662692: pass events as std::bitset<64> to java
  if (events != oldProps->events) {
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerEnter,
        "onPointerEnter");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerEnterCapture,
        "onPointerEnterCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerMove,
        "onPointerMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerMoveCapture,
        "onPointerMoveCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerLeave,
        "onPointerLeave");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerLeaveCapture,
        "onPointerLeaveCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOver,
        "onPointerOver");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOverCapture,
        "onPointerOverCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOut,
        "onPointerOut");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::PointerOutCapture,
        "onPointerOutCapture");
    updateEventProp(
        result, events, oldProps->events, ViewEvents::Offset::Click, "onClick");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ClickCapture,
        "onClickCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::MoveShouldSetResponder,
        "onMoveShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::MoveShouldSetResponderCapture,
        "onMoveShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::StartShouldSetResponder,
        "onStartShouldSetResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::StartShouldSetResponderCapture,
        "onStartShouldSetResponderCapture");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderGrant,
        "onResponderGrant");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderReject,
        "onResponderReject");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderStart,
        "onResponderStart");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderEnd,
        "onResponderEnd");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderRelease,
        "onResponderRelease");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderMove,
        "onResponderMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderTerminate,
        "onResponderTerminate");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ResponderTerminationRequest,
        "onResponderTerminationRequest");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::ShouldBlockNativeResponder,
        "onShouldBlockNativeResponder");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchStart,
        "onTouchStart");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchMove,
        "onTouchMove");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchEnd,
        "onTouchEnd");
    updateEventProp(
        result,
        events,
        oldProps->events,
        ViewEvents::Offset::TouchCancel,
        "onTouchCancel");
  }

  // Borders
  auto borderWidths = getBorderWidths();
  auto oldBorderWidths = oldProps->getBorderWidths();
  if (borderWidths != oldBorderWidths) {
    updateBorderWidthProps(result, borderWidths, oldBorderWidths);
  }

  if (borderStyles != oldProps->borderStyles) {
    updateBorderStyleProps(result, borderStyles, oldProps->borderStyles);
  }

  if (borderColors != oldProps->borderColors) {
    updateBorderColorsProps(result, borderColors, oldProps->borderColors);
  }

  if (borderRadii != oldProps->borderRadii) {
    updateBorderRadiusProps(result, borderRadii, oldProps->borderRadii);
  }

  // Transforms
  if (transform != oldProps->transform ||
      transformOrigin != oldProps->transformOrigin) {
    folly::dynamic resultTranslateArray = folly::dynamic::array();
    for (const auto& operation : transform.operations) {
      updateTransformProps(transform, operation, resultTranslateArray);
    }
    result["transform"] = std::move(resultTranslateArray);
  }

  if (transformOrigin != oldProps->transformOrigin) {
    result["transformOrigin"] = transformOrigin;
  }

  // Accessibility

  if (accessibilityState != oldProps->accessibilityState) {
    updateAccessibilityStateProp(
        result, accessibilityState, oldProps->accessibilityState);
  }

  if (accessibilityLabel != oldProps->accessibilityLabel) {
    result["accessibilityLabel"] = accessibilityLabel;
  }

  if (accessibilityLabelledBy != oldProps->accessibilityLabelledBy) {
    auto accessibilityLabelledByValues = folly::dynamic::array();
    for (const auto& accessibilityLabelledByValue :
         accessibilityLabelledBy.value) {
      accessibilityLabelledByValues.push_back(accessibilityLabelledByValue);
    }
    result["accessibilityLabelledBy"] = accessibilityLabelledByValues;
  }

  if (accessibilityOrder != oldProps->accessibilityOrder) {
    auto accessibilityChildrenIds = folly::dynamic::array();
    for (const auto& accessibilityChildId : accessibilityOrder) {
      accessibilityChildrenIds.push_back(accessibilityChildId);
    }
    result["experimental_accessibilityOrder"] = accessibilityChildrenIds;
  }

  if (accessibilityLiveRegion != oldProps->accessibilityLiveRegion) {
    result["accessibilityLiveRegion"] = toString(accessibilityLiveRegion);
  }

  if (accessibilityHint != oldProps->accessibilityHint) {
    result["accessibilityHint"] = accessibilityHint;
  }

  if (accessibilityRole != oldProps->accessibilityRole) {
    result["accessibilityRole"] = accessibilityRole;
  }

  if (accessibilityLanguage != oldProps->accessibilityLanguage) {
    result["accessibilityLanguage"] = accessibilityLanguage;
  }

  if (accessibilityValue != oldProps->accessibilityValue) {
    folly::dynamic accessibilityValueObject = folly::dynamic::object();
    if (accessibilityValue.min.has_value()) {
      accessibilityValueObject["min"] = accessibilityValue.min.value();
    }
    if (accessibilityValue.max.has_value()) {
      accessibilityValueObject["max"] = accessibilityValue.max.value();
    }
    if (accessibilityValue.now.has_value()) {
      accessibilityValueObject["now"] = accessibilityValue.now.value();
    }
    if (accessibilityValue.text.has_value()) {
      accessibilityValueObject["text"] = accessibilityValue.text.value();
    }
    result["accessibilityValue"] = accessibilityValueObject;
  }

  if (accessibilityActions != oldProps->accessibilityActions) {
    auto accessibilityActionsArray = folly::dynamic::array();
    for (const auto& accessibilityAction : accessibilityActions) {
      folly::dynamic accessibilityActionObject = folly::dynamic::object();
      accessibilityActionObject["name"] = accessibilityAction.name;
      if (accessibilityAction.label.has_value()) {
        accessibilityActionObject["label"] = accessibilityAction.label.value();
      }
      accessibilityActionsArray.push_back(accessibilityActionObject);
    }
    result["accessibilityActions"] = accessibilityActionsArray;
  }

  if (accessibilityViewIsModal != oldProps->accessibilityViewIsModal) {
    result["accessibilityViewIsModal"] = accessibilityViewIsModal;
  }

  if (accessibilityElementsHidden != oldProps->accessibilityElementsHidden) {
    result["accessibilityElementsHidden"] = accessibilityElementsHidden;
  }

  if (accessibilityIgnoresInvertColors !=
      oldProps->accessibilityIgnoresInvertColors) {
    result["accessibilityIgnoresInvertColors"] =
        accessibilityIgnoresInvertColors;
  }

  if (onAccessibilityTap != oldProps->onAccessibilityTap) {
    result["onAccessibilityTap"] = onAccessibilityTap;
  }

  if (onAccessibilityMagicTap != oldProps->onAccessibilityMagicTap) {
    result["onAccessibilityMagicTap"] = onAccessibilityMagicTap;
  }

  if (onAccessibilityEscape != oldProps->onAccessibilityEscape) {
    result["onAccessibilityEscape"] = onAccessibilityEscape;
  }

  if (onAccessibilityAction != oldProps->onAccessibilityAction) {
    result["onAccessibilityAction"] = onAccessibilityAction;
  }

  if (importantForAccessibility != oldProps->importantForAccessibility) {
    result["importantForAccessibility"] = toString(importantForAccessibility);
  }

  if (nextFocusDown != oldProps->nextFocusDown) {
    if (nextFocusDown.has_value()) {
      result["nextFocusDown"] = nextFocusDown.value();
    } else {
      result["nextFocusDown"] = folly::dynamic(nullptr);
    }
  }

  if (nextFocusForward != oldProps->nextFocusForward) {
    if (nextFocusForward.has_value()) {
      result["nextFocusForward"] = nextFocusForward.value();
    } else {
      result["nextFocusForward"] = folly::dynamic(nullptr);
    }
  }

  if (nextFocusLeft != oldProps->nextFocusLeft) {
    if (nextFocusLeft.has_value()) {
      result["nextFocusLeft"] = nextFocusLeft.value();
    } else {
      result["nextFocusLeft"] = folly::dynamic(nullptr);
    }
  }

  if (nextFocusRight != oldProps->nextFocusRight) {
    if (nextFocusRight.has_value()) {
      result["nextFocusRight"] = nextFocusRight.value();
    } else {
      result["nextFocusRight"] = folly::dynamic(nullptr);
    }
  }

  if (nextFocusUp != oldProps->nextFocusUp) {
    if (nextFocusUp.has_value()) {
      result["nextFocusUp"] = nextFocusUp.value();
    } else {
      result["nextFocusUp"] = folly::dynamic(nullptr);
    }
  }

  return result;
}

#endif

} // namespace facebook::react
