/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/Size.h>

namespace facebook::react {

struct ScrollEvent : public EventPayload {
  Size contentSize;
  Point contentOffset;
  EdgeInsets contentInset;
  Size containerSize;
  Float zoomScale{};

  /*
   * The time in seconds when the touch occurred or when it was last mutated.
   */
  Float timestamp{};

  ScrollEvent() = default;

  folly::dynamic asDynamic() const;

  /*
   * EventPayload implementations
   */
  jsi::Value asJSIValue(jsi::Runtime& runtime) const override;
  EventPayloadType getType() const override;

  std::optional<double> extractValue(
      const std::vector<std::string>& path) const override;
};

struct ScrollEndDragEvent : public ScrollEvent {
  Point targetContentOffset;
  Point velocity;

  ScrollEndDragEvent() = default;

  ScrollEndDragEvent(const ScrollEvent& scrollEvent)
      : ScrollEvent(scrollEvent), targetContentOffset({}), velocity({}) {}

  folly::dynamic asDynamic() const;

  /*
   * EventPayload implementations
   */
  jsi::Value asJSIValue(jsi::Runtime& runtime) const override;
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ScrollEvent& scrollEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const ScrollEvent& scrollEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
