/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollEvent.h"

namespace facebook::react {

jsi::Value ScrollEvent::asJSIValue(jsi::Runtime& runtime) const {
  auto payload = jsi::Object(runtime);

  {
    auto contentOffsetObj = jsi::Object(runtime);
    contentOffsetObj.setProperty(runtime, "x", contentOffset.x);
    contentOffsetObj.setProperty(runtime, "y", contentOffset.y);
    payload.setProperty(runtime, "contentOffset", contentOffsetObj);
  }

  {
    auto contentInsetObj = jsi::Object(runtime);
    contentInsetObj.setProperty(runtime, "top", contentInset.top);
    contentInsetObj.setProperty(runtime, "left", contentInset.left);
    contentInsetObj.setProperty(runtime, "bottom", contentInset.bottom);
    contentInsetObj.setProperty(runtime, "right", contentInset.right);
    payload.setProperty(runtime, "contentInset", contentInsetObj);
  }

  {
    auto contentSizeObj = jsi::Object(runtime);
    contentSizeObj.setProperty(runtime, "width", contentSize.width);
    contentSizeObj.setProperty(runtime, "height", contentSize.height);
    payload.setProperty(runtime, "contentSize", contentSizeObj);
  }

  {
    auto containerSizeObj = jsi::Object(runtime);
    containerSizeObj.setProperty(runtime, "width", containerSize.width);
    containerSizeObj.setProperty(runtime, "height", containerSize.height);
    payload.setProperty(runtime, "layoutMeasurement", containerSizeObj);
  }

  payload.setProperty(runtime, "zoomScale", zoomScale);
  payload.setProperty(runtime, "timestamp", timestamp * 1000);
  payload.setProperty(runtime, "responderIgnoreScroll", responderIgnoreScroll);

  return payload;
}

folly::dynamic ScrollEvent::asDynamic() const {
  auto contentOffsetObj =
      folly::dynamic::object("x", contentOffset.x)("y", contentOffset.y);

  auto contentInsetObj = folly::dynamic::object("top", contentInset.top)(
      "left", contentInset.left)("bottom", contentInset.bottom)(
      "right", contentInset.right);

  auto contentSizeObj = folly::dynamic::object("width", contentSize.width)(
      "height", contentSize.height);

  auto containerSizeObj = folly::dynamic::object("width", containerSize.width)(
      "height", containerSize.height);

  auto metrics =
      folly::dynamic::object("contentOffset", std::move(contentOffsetObj))(
          "contentInset", std::move(contentInsetObj))(
          "contentSize", std::move(contentSizeObj))(
          "layoutMeasurement", std::move(containerSizeObj))(
          "zoomScale", zoomScale)("timestamp", timestamp * 1000)(
          "responderIgnoreScroll", responderIgnoreScroll);

  return metrics;
};

std::optional<double> ScrollEvent::extractValue(
    const std::vector<std::string>& path) const {
  if (path.size() == 1 && path[0] == "zoomScale") {
    return zoomScale;
  } else if (path.size() == 2 && path[0] == "contentOffset") {
    if (path[1] == "x") {
      return contentOffset.x;
    } else if (path[1] == "y") {
      return contentOffset.y;
    }
  }

  return EventPayload::extractValue(path);
}

EventPayloadType ScrollEvent::getType() const {
  return EventPayloadType::ScrollEvent;
}

jsi::Value ScrollEndDragEvent::asJSIValue(jsi::Runtime& runtime) const {
  auto payload = ScrollEvent::asJSIValue(runtime).asObject(runtime);

  {
    auto targetContentOffsetObj = jsi::Object(runtime);
    targetContentOffsetObj.setProperty(runtime, "x", targetContentOffset.x);
    targetContentOffsetObj.setProperty(runtime, "y", targetContentOffset.y);
    payload.setProperty(runtime, "targetContentOffset", targetContentOffsetObj);
  }

  {
    auto velocityObj = jsi::Object(runtime);
    velocityObj.setProperty(runtime, "x", velocity.x);
    velocityObj.setProperty(runtime, "y", velocity.y);
    payload.setProperty(runtime, "velocity", velocityObj);
  }

  return payload;
}

folly::dynamic ScrollEndDragEvent::asDynamic() const {
  auto metrics = ScrollEvent::asDynamic();

  auto targetContentOffsetObj = folly::dynamic::object(
      "x", targetContentOffset.x)("y", targetContentOffset.y);
  metrics["targetContentOffset"] = std::move(targetContentOffsetObj);

  auto velocityObj = folly::dynamic::object("x", velocity.x)("y", velocity.y);
  metrics["velocity"] = std::move(velocityObj);

  return metrics;
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const ScrollEvent& /*scrollEvent*/) {
  return "ScrollEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const ScrollEvent& scrollEvent,
    DebugStringConvertibleOptions options) {
  return {
      {"contentOffset",
       getDebugDescription(scrollEvent.contentOffset, options)},
      {"contentInset", getDebugDescription(scrollEvent.contentInset, options)},
      {"contentSize", getDebugDescription(scrollEvent.contentSize, options)},
      {"layoutMeasurement",
       getDebugDescription(scrollEvent.containerSize, options)},
      {"zoomScale", getDebugDescription(scrollEvent.zoomScale, options)},
      {"timestamp", getDebugDescription(scrollEvent.timestamp, options)}};
}

#endif

} // namespace facebook::react
