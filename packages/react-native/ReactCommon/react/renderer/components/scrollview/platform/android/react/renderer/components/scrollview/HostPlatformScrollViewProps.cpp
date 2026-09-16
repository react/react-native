/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostPlatformScrollViewProps.h"

#include <react/renderer/components/scrollview/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

HostPlatformScrollViewProps::HostPlatformScrollViewProps(
    const PropsParserContext& context,
    const HostPlatformScrollViewProps& sourceProps,
    const RawProps& rawProps)
    : BaseScrollViewProps(context, sourceProps, rawProps),
      sendMomentumEvents(convertRawProp(
          context,
          rawProps,
          "sendMomentumEvents",
          sourceProps.sendMomentumEvents,
          true)),
      nestedScrollEnabled(convertRawProp(
          context,
          rawProps,
          "nestedScrollEnabled",
          sourceProps.nestedScrollEnabled,
          true)),
      fadingEdgeLength(convertRawProp(
          context,
          rawProps,
          "fadingEdgeLength",
          sourceProps.fadingEdgeLength,
          nullptr)),
      overScrollMode(convertRawProp(
          context,
          rawProps,
          "overScrollMode",
          sourceProps.overScrollMode,
          "auto")),
      endFillColor(convertRawProp(
          context,
          rawProps,
          "endFillColor",
          sourceProps.endFillColor,
          clearColor())) {}

void HostPlatformScrollViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  BaseScrollViewProps::setProp(context, hash, propName, value);

  static auto defaults = HostPlatformScrollViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(sendMomentumEvents);
    RAW_SET_PROP_SWITCH_CASE_BASIC(nestedScrollEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(fadingEdgeLength);
    RAW_SET_PROP_SWITCH_CASE_BASIC(overScrollMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(endFillColor);
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList HostPlatformScrollViewProps::getDebugProps()
    const {
  auto defaultScrollViewProps = HostPlatformScrollViewProps{};

  return BaseScrollViewProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "sendMomentumEvents",
              sendMomentumEvents,
              defaultScrollViewProps.sendMomentumEvents),
          debugStringConvertibleItem(
              "nestedScrollEnabled",
              nestedScrollEnabled,
              defaultScrollViewProps.nestedScrollEnabled),
          debugStringConvertibleItem(
              "overScrollMode",
              overScrollMode,
              defaultScrollViewProps.overScrollMode),
          debugStringConvertibleItem(
              "endFillColor",
              endFillColor,
              defaultScrollViewProps.endFillColor)};
}
#endif

static folly::dynamic convertScrollViewMaintainVisibleContentPosition(
    const ScrollViewMaintainVisibleContentPosition& value) {
  folly::dynamic result = folly::dynamic::object();
  result["minIndexForVisible"] = value.minIndexForVisible;
  if (value.autoscrollToTopThreshold.has_value()) {
    result["autoscrollToTopThreshold"] = value.autoscrollToTopThreshold.value();
  }
  return result;
}

static folly::dynamic convertEdgeInsets(const EdgeInsets& edgeInsets) {
  folly::dynamic edgeInsetsResult = folly::dynamic::object();
  edgeInsetsResult["left"] = edgeInsets.left;
  edgeInsetsResult["top"] = edgeInsets.top;
  edgeInsetsResult["right"] = edgeInsets.right;
  edgeInsetsResult["bottom"] = edgeInsets.bottom;
  return edgeInsetsResult;
}

static folly::dynamic convertPoint(const Point& point) {
  folly::dynamic pointResult = folly::dynamic::object();
  pointResult["y"] = point.y;
  pointResult["x"] = point.x;
  return pointResult;
}

ComponentName HostPlatformScrollViewProps::getDiffPropsImplementationTarget()
    const {
  return "ScrollView";
}

folly::dynamic HostPlatformScrollViewProps::getDiffProps(
    const Props* prevProps) const {
  static const auto defaultProps = HostPlatformScrollViewProps();
  const HostPlatformScrollViewProps* oldProps = prevProps == nullptr
      ? &defaultProps
      : static_cast<const HostPlatformScrollViewProps*>(prevProps);

  folly::dynamic result = ViewProps::getDiffProps(oldProps);

  if (alwaysBounceHorizontal != oldProps->alwaysBounceHorizontal) {
    result["alwaysBounceHorizontal"] = alwaysBounceHorizontal;
  }

  if (alwaysBounceVertical != oldProps->alwaysBounceVertical) {
    result["alwaysBounceVertical"] = alwaysBounceVertical;
  }

  if (bounces != oldProps->bounces) {
    result["bounces"] = bounces;
  }

  if (bouncesZoom != oldProps->bouncesZoom) {
    result["bouncesZoom"] = bouncesZoom;
  }

  if (canCancelContentTouches != oldProps->canCancelContentTouches) {
    result["canCancelContentTouches"] = canCancelContentTouches;
  }

  if (centerContent != oldProps->centerContent) {
    result["centerContent"] = centerContent;
  }

  if (automaticallyAdjustContentInsets !=
      oldProps->automaticallyAdjustContentInsets) {
    result["automaticallyAdjustContentInsets"] =
        automaticallyAdjustContentInsets;
  }

  if (automaticallyAdjustsScrollIndicatorInsets !=
      oldProps->automaticallyAdjustsScrollIndicatorInsets) {
    result["automaticallyAdjustsScrollIndicatorInsets"] =
        automaticallyAdjustsScrollIndicatorInsets;
  }

  if (automaticallyAdjustKeyboardInsets !=
      oldProps->automaticallyAdjustKeyboardInsets) {
    result["automaticallyAdjustKeyboardInsets"] =
        automaticallyAdjustKeyboardInsets;
  }

  if (decelerationRate != oldProps->decelerationRate) {
    result["decelerationRate"] = decelerationRate;
  }

  if (endDraggingSensitivityMultiplier !=
      oldProps->endDraggingSensitivityMultiplier) {
    result["endDraggingSensitivityMultiplier"] =
        endDraggingSensitivityMultiplier;
  }

  if (directionalLockEnabled != oldProps->directionalLockEnabled) {
    result["directionalLockEnabled"] = directionalLockEnabled;
  }

  if (indicatorStyle != oldProps->indicatorStyle) {
    switch (indicatorStyle) {
      case ScrollViewIndicatorStyle::Default:
        result["indicatorStyle"] = "default";
        break;
      case ScrollViewIndicatorStyle::Black:
        result["indicatorStyle"] = "black";
        break;
      case ScrollViewIndicatorStyle::White:
        result["indicatorStyle"] = "white";
        break;
    }
  }

  if (keyboardDismissMode != oldProps->keyboardDismissMode) {
    switch (keyboardDismissMode) {
      case ScrollViewKeyboardDismissMode::None:
        result["keyboardDismissMode"] = "none";
        break;
      case ScrollViewKeyboardDismissMode::OnDrag:
        result["keyboardDismissMode"] = "on-drag";
        break;
      case ScrollViewKeyboardDismissMode::Interactive:
        result["keyboardDismissMode"] = "interactive";
        break;
    }
  }

  if (maintainVisibleContentPosition !=
      oldProps->maintainVisibleContentPosition) {
    if (maintainVisibleContentPosition.has_value()) {
      result["maintainVisibleContentPosition"] =
          convertScrollViewMaintainVisibleContentPosition(
              maintainVisibleContentPosition.value());
    } else {
      result["maintainVisibleContentPosition"] = folly::dynamic(nullptr);
    }
  }

  if (maximumZoomScale != oldProps->maximumZoomScale) {
    result["maximumZoomScale"] = maximumZoomScale;
  }

  if (minimumZoomScale != oldProps->minimumZoomScale) {
    result["minimumZoomScale"] = minimumZoomScale;
  }

  if (scrollEnabled != oldProps->scrollEnabled) {
    result["scrollEnabled"] = scrollEnabled;
  }

  if (pagingEnabled != oldProps->pagingEnabled) {
    result["pagingEnabled"] = pagingEnabled;
  }

  if (pinchGestureEnabled != oldProps->pinchGestureEnabled) {
    result["pinchGestureEnabled"] = pinchGestureEnabled;
  }

  if (scrollsToTop != oldProps->scrollsToTop) {
    result["scrollsToTop"] = scrollsToTop;
  }

  if (showsHorizontalScrollIndicator !=
      oldProps->showsHorizontalScrollIndicator) {
    result["showsHorizontalScrollIndicator"] = showsHorizontalScrollIndicator;
  }

  if (showsVerticalScrollIndicator != oldProps->showsVerticalScrollIndicator) {
    result["showsVerticalScrollIndicator"] = showsVerticalScrollIndicator;
  }

  if (persistentScrollbar != oldProps->persistentScrollbar) {
    result["persistentScrollbar"] = persistentScrollbar;
  }

  if (horizontal != oldProps->horizontal) {
    result["horizontal"] = horizontal;
  }

  if (scrollEventThrottle != oldProps->scrollEventThrottle) {
    result["scrollEventThrottle"] = scrollEventThrottle;
  }

  if (zoomScale != oldProps->zoomScale) {
    result["zoomScale"] = zoomScale;
  }

  if (contentInset != oldProps->contentInset) {
    result["contentInset"] = convertEdgeInsets(contentInset);
  }

  if (contentOffset != oldProps->contentOffset) {
    result["contentOffset"] = convertPoint(contentOffset);
  }

  if (scrollIndicatorInsets != oldProps->scrollIndicatorInsets) {
    result["scrollIndicatorInsets"] = convertEdgeInsets(scrollIndicatorInsets);
  }

  if (snapToInterval != oldProps->snapToInterval) {
    result["snapToInterval"] = snapToInterval;
  }

  if (snapToAlignment != oldProps->snapToAlignment) {
    switch (snapToAlignment) {
      case ScrollViewSnapToAlignment::Start:
        result["snapToAlignment"] = "start";
        break;
      case ScrollViewSnapToAlignment::Center:
        result["snapToAlignment"] = "center";
        break;
      case ScrollViewSnapToAlignment::End:
        result["snapToAlignment"] = "end";
        break;
    }
  }

  if (disableIntervalMomentum != oldProps->disableIntervalMomentum) {
    result["disableIntervalMomentum"] = disableIntervalMomentum;
  }

  if (snapToOffsets != oldProps->snapToOffsets) {
    auto snapToOffsetsArray = folly::dynamic::array();
    for (const auto& snapToOffset : snapToOffsets) {
      snapToOffsetsArray.push_back(snapToOffset);
    }
    result["snapToOffsets"] = snapToOffsetsArray;
  }

  if (snapToStart != oldProps->snapToStart) {
    result["snapToStart"] = snapToStart;
  }

  if (snapToEnd != oldProps->snapToEnd) {
    result["snapToEnd"] = snapToEnd;
  }

  if (contentInsetAdjustmentBehavior !=
      oldProps->contentInsetAdjustmentBehavior) {
    switch (contentInsetAdjustmentBehavior) {
      case ContentInsetAdjustmentBehavior::Never:
        result["contentInsetAdjustmentBehavior"] = "never";
        break;
      case ContentInsetAdjustmentBehavior::Automatic:
        result["contentInsetAdjustmentBehavior"] = "automatic";
        break;
      case ContentInsetAdjustmentBehavior::ScrollableAxes:
        result["contentInsetAdjustmentBehavior"] = "scrollableAxes";
        break;
      case ContentInsetAdjustmentBehavior::Always:
        result["contentInsetAdjustmentBehavior"] = "always";
        break;
    }
  }

  if (scrollToOverflowEnabled != oldProps->scrollToOverflowEnabled) {
    result["scrollToOverflowEnabled"] = scrollToOverflowEnabled;
  }

  if (isInvertedVirtualizedList != oldProps->isInvertedVirtualizedList) {
    result["isInvertedVirtualizedList"] = isInvertedVirtualizedList;
  }

  if (sendMomentumEvents != oldProps->sendMomentumEvents) {
    result["sendMomentumEvents"] = sendMomentumEvents;
  }

  if (nestedScrollEnabled != oldProps->nestedScrollEnabled) {
    result["nestedScrollEnabled"] = nestedScrollEnabled;
  }

  if (fadingEdgeLength != oldProps->fadingEdgeLength) {
    result["fadingEdgeLength"] = fadingEdgeLength;
  }

  if (overScrollMode != oldProps->overScrollMode) {
    result["overScrollMode"] = overScrollMode;
  }

  if (endFillColor != oldProps->endFillColor) {
    result["endFillColor"] = *endFillColor;
  }

  return result;
}

} // namespace facebook::react
