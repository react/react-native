/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "BaseScrollViewProps.h"

#include <react/renderer/components/scrollview/conversions.h>
#include <react/renderer/core/graphicsConversions.h>
#include <react/renderer/debug/debugStringConvertibleUtils.h>

#include <react/renderer/core/propsConversions.h>

namespace facebook::react {

// TODO (T28334063): Consider for codegen.
BaseScrollViewProps::BaseScrollViewProps(
    const PropsParserContext& context,
    const BaseScrollViewProps& sourceProps,
    const RawProps& rawProps)
    : ViewProps(context, sourceProps, rawProps),
      alwaysBounceHorizontal(convertRawProp(
          context,
          rawProps,
          "alwaysBounceHorizontal",
          sourceProps.alwaysBounceHorizontal,
          {})),
      alwaysBounceVertical(convertRawProp(
          context,
          rawProps,
          "alwaysBounceVertical",
          sourceProps.alwaysBounceVertical,
          {})),
      bounces(convertRawProp(
          context,
          rawProps,
          "bounces",
          sourceProps.bounces,
          true)),
      bouncesZoom(convertRawProp(
          context,
          rawProps,
          "bouncesZoom",
          sourceProps.bouncesZoom,
          true)),
      canCancelContentTouches(convertRawProp(
          context,
          rawProps,
          "canCancelContentTouches",
          sourceProps.canCancelContentTouches,
          true)),
      centerContent(convertRawProp(
          context,
          rawProps,
          "centerContent",
          sourceProps.centerContent,
          {})),
      automaticallyAdjustContentInsets(convertRawProp(
          context,
          rawProps,
          "automaticallyAdjustContentInsets",
          sourceProps.automaticallyAdjustContentInsets,
          {})),
      automaticallyAdjustsScrollIndicatorInsets(convertRawProp(
          context,
          rawProps,
          "automaticallyAdjustsScrollIndicatorInsets",
          sourceProps.automaticallyAdjustsScrollIndicatorInsets,
          true)),
      automaticallyAdjustKeyboardInsets(convertRawProp(
          context,
          rawProps,
          "automaticallyAdjustKeyboardInsets",
          sourceProps.automaticallyAdjustKeyboardInsets,
          false)),
      decelerationRate(convertRawProp(
          context,
          rawProps,
          "decelerationRate",
          sourceProps.decelerationRate,
          (Float)0.998)),
      endDraggingSensitivityMultiplier(convertRawProp(
          context,
          rawProps,
          "endDraggingSensitivityMultiplier",
          sourceProps.endDraggingSensitivityMultiplier,
          (Float)1)),
      directionalLockEnabled(convertRawProp(
          context,
          rawProps,
          "directionalLockEnabled",
          sourceProps.directionalLockEnabled,
          {})),
      indicatorStyle(convertRawProp(
          context,
          rawProps,
          "indicatorStyle",
          sourceProps.indicatorStyle,
          {})),
      keyboardDismissMode(convertRawProp(
          context,
          rawProps,
          "keyboardDismissMode",
          sourceProps.keyboardDismissMode,
          {})),
      maintainVisibleContentPosition(convertRawProp(
          context,
          rawProps,
          "maintainVisibleContentPosition",
          sourceProps.maintainVisibleContentPosition,
          {})),
      maximumZoomScale(convertRawProp(
          context,
          rawProps,
          "maximumZoomScale",
          sourceProps.maximumZoomScale,
          (Float)1.0)),
      minimumZoomScale(convertRawProp(
          context,
          rawProps,
          "minimumZoomScale",
          sourceProps.minimumZoomScale,
          (Float)1.0)),
      scrollEnabled(convertRawProp(
          context,
          rawProps,
          "scrollEnabled",
          sourceProps.scrollEnabled,
          true)),
      pagingEnabled(convertRawProp(
          context,
          rawProps,
          "pagingEnabled",
          sourceProps.pagingEnabled,
          {})),
      pinchGestureEnabled(convertRawProp(
          context,
          rawProps,
          "pinchGestureEnabled",
          sourceProps.pinchGestureEnabled,
          true)),
      scrollsToTop(convertRawProp(
          context,
          rawProps,
          "scrollsToTop",
          sourceProps.scrollsToTop,
          true)),
      showsHorizontalScrollIndicator(convertRawProp(
          context,
          rawProps,
          "showsHorizontalScrollIndicator",
          sourceProps.showsHorizontalScrollIndicator,
          true)),
      showsVerticalScrollIndicator(convertRawProp(
          context,
          rawProps,
          "showsVerticalScrollIndicator",
          sourceProps.showsVerticalScrollIndicator,
          true)),
      persistentScrollbar(convertRawProp(
          context,
          rawProps,
          "persistentScrollbar",
          sourceProps.persistentScrollbar,
          true)),
      horizontal(convertRawProp(
          context,
          rawProps,
          "horizontal",
          sourceProps.horizontal,
          true)),
      scrollEventThrottle(convertRawProp(
          context,
          rawProps,
          "scrollEventThrottle",
          sourceProps.scrollEventThrottle,
          {})),
      zoomScale(convertRawProp(
          context,
          rawProps,
          "zoomScale",
          sourceProps.zoomScale,
          (Float)1.0)),
      contentInset(convertRawProp(
          context,
          rawProps,
          "contentInset",
          sourceProps.contentInset,
          {})),
      contentOffset(convertRawProp(
          context,
          rawProps,
          "contentOffset",
          sourceProps.contentOffset,
          {})),
      scrollIndicatorInsets(convertRawProp(
          context,
          rawProps,
          "scrollIndicatorInsets",
          sourceProps.scrollIndicatorInsets,
          {})),
      snapToInterval(convertRawProp(
          context,
          rawProps,
          "snapToInterval",
          sourceProps.snapToInterval,
          {})),
      snapToAlignment(convertRawProp(
          context,
          rawProps,
          "snapToAlignment",
          sourceProps.snapToAlignment,
          {})),
      disableIntervalMomentum(convertRawProp(
          context,
          rawProps,
          "disableIntervalMomentum",
          sourceProps.disableIntervalMomentum,
          {})),
      snapToOffsets(convertRawProp(
          context,
          rawProps,
          "snapToOffsets",
          sourceProps.snapToOffsets,
          {})),
      snapToStart(convertRawProp(
          context,
          rawProps,
          "snapToStart",
          sourceProps.snapToStart,
          true)),
      snapToEnd(convertRawProp(
          context,
          rawProps,
          "snapToEnd",
          sourceProps.snapToEnd,
          true)),
      contentInsetAdjustmentBehavior(convertRawProp(
          context,
          rawProps,
          "contentInsetAdjustmentBehavior",
          sourceProps.contentInsetAdjustmentBehavior,
          {ContentInsetAdjustmentBehavior::Never})),
      scrollToOverflowEnabled(convertRawProp(
          context,
          rawProps,
          "scrollToOverflowEnabled",
          sourceProps.scrollToOverflowEnabled,
          {})),
      isInvertedVirtualizedList(convertRawProp(
          context,
          rawProps,
          "isInvertedVirtualizedList",
          sourceProps.isInvertedVirtualizedList,
          {})) {}

void BaseScrollViewProps::setProp(
    const PropsParserContext& context,
    RawPropsPropNameHash hash,
    const char* propName,
    const RawValue& value) {
  // All Props structs setProp methods must always, unconditionally,
  // call all super::setProp methods, since multiple structs may
  // reuse the same values.
  ViewProps::setProp(context, hash, propName, value);

  static auto defaults = BaseScrollViewProps{};

  switch (hash) {
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceHorizontal);
    RAW_SET_PROP_SWITCH_CASE_BASIC(alwaysBounceVertical);
    RAW_SET_PROP_SWITCH_CASE_BASIC(bounces);
    RAW_SET_PROP_SWITCH_CASE_BASIC(bouncesZoom);
    RAW_SET_PROP_SWITCH_CASE_BASIC(canCancelContentTouches);
    RAW_SET_PROP_SWITCH_CASE_BASIC(centerContent);
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustContentInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustsScrollIndicatorInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(automaticallyAdjustKeyboardInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(decelerationRate);
    RAW_SET_PROP_SWITCH_CASE_BASIC(directionalLockEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(indicatorStyle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(keyboardDismissMode);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maintainVisibleContentPosition);
    RAW_SET_PROP_SWITCH_CASE_BASIC(maximumZoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(minimumZoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(endDraggingSensitivityMultiplier);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pagingEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(pinchGestureEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollsToTop);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showsHorizontalScrollIndicator);
    RAW_SET_PROP_SWITCH_CASE_BASIC(showsVerticalScrollIndicator);
    RAW_SET_PROP_SWITCH_CASE_BASIC(persistentScrollbar);
    RAW_SET_PROP_SWITCH_CASE_BASIC(horizontal);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollEventThrottle);
    RAW_SET_PROP_SWITCH_CASE_BASIC(zoomScale);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentInset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentOffset);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollIndicatorInsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToInterval);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToAlignment);
    RAW_SET_PROP_SWITCH_CASE_BASIC(disableIntervalMomentum);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToOffsets);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToStart);
    RAW_SET_PROP_SWITCH_CASE_BASIC(snapToEnd);
    RAW_SET_PROP_SWITCH_CASE_BASIC(contentInsetAdjustmentBehavior);
    RAW_SET_PROP_SWITCH_CASE_BASIC(scrollToOverflowEnabled);
    RAW_SET_PROP_SWITCH_CASE_BASIC(isInvertedVirtualizedList);
  }
}

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
SharedDebugStringConvertibleList BaseScrollViewProps::getDebugProps() const {
  auto defaultScrollViewProps = BaseScrollViewProps{};

  return ViewProps::getDebugProps() +
      SharedDebugStringConvertibleList{
          debugStringConvertibleItem(
              "alwaysBounceHorizontal",
              alwaysBounceHorizontal,
              defaultScrollViewProps.alwaysBounceHorizontal),
          debugStringConvertibleItem(
              "alwaysBounceVertical",
              alwaysBounceVertical,
              defaultScrollViewProps.alwaysBounceVertical),
          debugStringConvertibleItem(
              "bounces", bounces, defaultScrollViewProps.bounces),
          debugStringConvertibleItem(
              "bouncesZoom", bouncesZoom, defaultScrollViewProps.bouncesZoom),
          debugStringConvertibleItem(
              "canCancelContentTouches",
              canCancelContentTouches,
              defaultScrollViewProps.canCancelContentTouches),
          debugStringConvertibleItem(
              "centerContent",
              centerContent,
              defaultScrollViewProps.centerContent),
          debugStringConvertibleItem(
              "automaticallyAdjustContentInsets",
              automaticallyAdjustContentInsets,
              defaultScrollViewProps.automaticallyAdjustContentInsets),
          debugStringConvertibleItem(
              "automaticallyAdjustsScrollIndicatorInsets",
              automaticallyAdjustsScrollIndicatorInsets,
              defaultScrollViewProps.automaticallyAdjustsScrollIndicatorInsets),
          debugStringConvertibleItem(
              "decelerationRate",
              decelerationRate,
              defaultScrollViewProps.decelerationRate),
          debugStringConvertibleItem(
              "directionalLockEnabled",
              directionalLockEnabled,
              defaultScrollViewProps.directionalLockEnabled),
          debugStringConvertibleItem(
              "indicatorStyle",
              indicatorStyle,
              defaultScrollViewProps.indicatorStyle),
          debugStringConvertibleItem(
              "keyboardDismissMode",
              keyboardDismissMode,
              defaultScrollViewProps.keyboardDismissMode),
          debugStringConvertibleItem(
              "maintainVisibleContentPosition",
              maintainVisibleContentPosition,
              defaultScrollViewProps.maintainVisibleContentPosition),
          debugStringConvertibleItem(
              "maximumZoomScale",
              maximumZoomScale,
              defaultScrollViewProps.maximumZoomScale),
          debugStringConvertibleItem(
              "minimumZoomScale",
              minimumZoomScale,
              defaultScrollViewProps.minimumZoomScale),
          debugStringConvertibleItem(
              "scrollEnabled",
              scrollEnabled,
              defaultScrollViewProps.scrollEnabled),
          debugStringConvertibleItem(
              "pagingEnabled",
              pagingEnabled,
              defaultScrollViewProps.pagingEnabled),
          debugStringConvertibleItem(
              "pinchGestureEnabled",
              pinchGestureEnabled,
              defaultScrollViewProps.pinchGestureEnabled),
          debugStringConvertibleItem(
              "scrollsToTop",
              scrollsToTop,
              defaultScrollViewProps.scrollsToTop),
          debugStringConvertibleItem(
              "showsHorizontalScrollIndicator",
              showsHorizontalScrollIndicator,
              defaultScrollViewProps.showsHorizontalScrollIndicator),
          debugStringConvertibleItem(
              "showsVerticalScrollIndicator",
              showsVerticalScrollIndicator,
              defaultScrollViewProps.showsVerticalScrollIndicator),
          debugStringConvertibleItem(
              "persistentScrollbar",
              persistentScrollbar,
              defaultScrollViewProps.persistentScrollbar),
          debugStringConvertibleItem(
              "horizontal", horizontal, defaultScrollViewProps.horizontal),
          debugStringConvertibleItem(
              "scrollEventThrottle",
              scrollEventThrottle,
              defaultScrollViewProps.scrollEventThrottle),
          debugStringConvertibleItem(
              "zoomScale", zoomScale, defaultScrollViewProps.zoomScale),
          debugStringConvertibleItem(
              "contentInset",
              contentInset,
              defaultScrollViewProps.contentInset),
          debugStringConvertibleItem(
              "contentOffset",
              contentOffset,
              defaultScrollViewProps.contentOffset),
          debugStringConvertibleItem(
              "scrollIndicatorInsets",
              scrollIndicatorInsets,
              defaultScrollViewProps.scrollIndicatorInsets),
          debugStringConvertibleItem(
              "snapToInterval",
              snapToInterval,
              defaultScrollViewProps.snapToInterval),
          debugStringConvertibleItem(
              "snapToAlignment",
              snapToAlignment,
              defaultScrollViewProps.snapToAlignment),
          debugStringConvertibleItem(
              "disableIntervalMomentum",
              disableIntervalMomentum,
              defaultScrollViewProps.disableIntervalMomentum),
          debugStringConvertibleItem(
              "snapToStart", snapToStart, defaultScrollViewProps.snapToStart),
          debugStringConvertibleItem(
              "snapToEnd", snapToEnd, defaultScrollViewProps.snapToEnd),
          debugStringConvertibleItem(
              "isInvertedVirtualizedList",
              isInvertedVirtualizedList,
              defaultScrollViewProps.isInvertedVirtualizedList)};
}
#endif

} // namespace facebook::react
