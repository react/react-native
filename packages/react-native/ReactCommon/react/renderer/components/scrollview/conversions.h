/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/scrollview/primitives.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/propsConversions.h>
#include <unordered_map>

namespace facebook::react {

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, ScrollViewSnapToAlignment &result)
{
  auto string = (std::string)value;
  if (string == "start") {
    result = ScrollViewSnapToAlignment::Start;
    return;
  }
  if (string == "center") {
    result = ScrollViewSnapToAlignment::Center;
    return;
  }
  if (string == "end") {
    result = ScrollViewSnapToAlignment::End;
    return;
  }
  abort();
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, ScrollViewIndicatorStyle &result)
{
  auto string = (std::string)value;
  if (string == "default") {
    result = ScrollViewIndicatorStyle::Default;
    return;
  }
  if (string == "black") {
    result = ScrollViewIndicatorStyle::Black;
    return;
  }
  if (string == "white") {
    result = ScrollViewIndicatorStyle::White;
    return;
  }
  abort();
}

inline void
fromRawValue(const PropsParserContext &context, const RawValue &value, ScrollViewKeyboardDismissMode &result)
{
  auto string = (std::string)value;
  if (string == "none") {
    result = ScrollViewKeyboardDismissMode::None;
    return;
  }
  if (string == "on-drag") {
    result = ScrollViewKeyboardDismissMode::OnDrag;
    return;
  }
  if (string == "interactive") {
    result = ScrollViewKeyboardDismissMode::Interactive;
    return;
  }
  abort();
}

inline void
fromRawValue(const PropsParserContext &context, const RawValue &value, ContentInsetAdjustmentBehavior &result)
{
  auto string = (std::string)value;
  if (string == "never") {
    result = ContentInsetAdjustmentBehavior::Never;
    return;
  }
  if (string == "automatic") {
    result = ContentInsetAdjustmentBehavior::Automatic;
    return;
  }
  if (string == "scrollableAxes") {
    result = ContentInsetAdjustmentBehavior::ScrollableAxes;
    return;
  }
  if (string == "always") {
    result = ContentInsetAdjustmentBehavior::Always;
    return;
  }
  abort();
}

inline void
fromRawValue(const PropsParserContext &context, const RawValue &value, ScrollViewMaintainVisibleContentPosition &result)
{
  auto map = (std::unordered_map<std::string, RawValue>)value;

  auto minIndexForVisible = map.find("minIndexForVisible");
  if (minIndexForVisible != map.end()) {
    fromRawValue(context, minIndexForVisible->second, result.minIndexForVisible);
  }
  auto autoscrollToTopThreshold = map.find("autoscrollToTopThreshold");
  if (autoscrollToTopThreshold != map.end()) {
    fromRawValue(context, autoscrollToTopThreshold->second, result.autoscrollToTopThreshold);
  }
}

inline std::string toString(const ScrollViewSnapToAlignment &value)
{
  switch (value) {
    case ScrollViewSnapToAlignment::Start:
      return "start";
    case ScrollViewSnapToAlignment::Center:
      return "center";
    case ScrollViewSnapToAlignment::End:
      return "end";
  }
}

#if RN_DEBUG_STRING_CONVERTIBLE

inline std::string toString(const ScrollViewIndicatorStyle &value)
{
  switch (value) {
    case ScrollViewIndicatorStyle::Default:
      return "default";
    case ScrollViewIndicatorStyle::Black:
      return "black";
    case ScrollViewIndicatorStyle::White:
      return "white";
  }
}

inline std::string toString(const ScrollViewKeyboardDismissMode &value)
{
  switch (value) {
    case ScrollViewKeyboardDismissMode::None:
      return "none";
    case ScrollViewKeyboardDismissMode::OnDrag:
      return "on-drag";
    case ScrollViewKeyboardDismissMode::Interactive:
      return "interactive";
  }
}

inline std::string toString(const ContentInsetAdjustmentBehavior &value)
{
  switch (value) {
    case ContentInsetAdjustmentBehavior::Never:
      return "never";
    case ContentInsetAdjustmentBehavior::Automatic:
      return "automatic";
    case ContentInsetAdjustmentBehavior::ScrollableAxes:
      return "scrollableAxes";
    case ContentInsetAdjustmentBehavior::Always:
      return "always";
  }
}

inline std::string toString(const std::optional<ScrollViewMaintainVisibleContentPosition> &value)
{
  if (!value) {
    return "null";
  }
  return "{minIndexForVisible: " + toString(value.value().minIndexForVisible) +
      ", autoscrollToTopThreshold: " + toString(value.value().autoscrollToTopThreshold) + "}";
}

#endif

} // namespace facebook::react
