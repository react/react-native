/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>

#include <react/renderer/bridging/bridging.h>
#include <react/renderer/core/RawEvent.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Point.h>
#include <string>
#include <vector>

namespace facebook::react {

class TesterAppDelegate;

using NativeFantomGetRenderedOutputRenderFormatOptions = NativeFantomRenderFormatOptions<
    // includeRoot
    bool,
    // includeLayoutMetrics
    bool>;

template <>
struct Bridging<NativeFantomGetRenderedOutputRenderFormatOptions>
    : NativeFantomRenderFormatOptionsBridging<NativeFantomGetRenderedOutputRenderFormatOptions> {};

template <>
struct Bridging<RawEvent::Category> {
  static RawEvent::Category fromJs(jsi::Runtime &rt, jsi::Value rawValue)
  {
    auto value = static_cast<int32_t>(rawValue.asNumber());
    if (value == 0) {
      return RawEvent::Category::ContinuousStart;
    } else if (value == 1) {
      return RawEvent::Category::ContinuousEnd;
    } else if (value == 2) {
      return RawEvent::Category::Unspecified;
    } else if (value == 3) {
      return RawEvent::Category::Discrete;
    } else if (value == 4) {
      return RawEvent::Category::Continuous;
    } else if (value == 5) {
      return RawEvent::Category::Idle;
    } else {
      throw jsi::JSError(rt, "Invalid enum value");
    }
  }

  static jsi::Value toJs(jsi::Runtime &rt, RawEvent::Category value)
  {
    return bridging::toJs(rt, static_cast<int32_t>(value));
  }
};

using ScrollOptions = NativeFantomScrollOptions<Float, Float, std::optional<Float>>;

template <>
struct Bridging<ScrollOptions> : NativeFantomScrollOptionsBridging<ScrollOptions> {};

using NativeFantomSetImageResponseImageResponse = NativeFantomImageResponse<
    Float, // width
    Float, // height
    std::optional<std::string>, // cacheStatus
    std::optional<std::string>>; // errorMessage
template <>
struct Bridging<NativeFantomSetImageResponseImageResponse>
    : NativeFantomImageResponseBridging<NativeFantomSetImageResponseImageResponse> {};

class NativeFantom : public NativeFantomCxxSpec<NativeFantom> {
 public:
  NativeFantom(TesterAppDelegate &appDelegate, std::shared_ptr<CallInvoker> jsInvoker);

  SurfaceId startSurface(
      jsi::Runtime &runtime,
      double viewportWidth,
      double viewportHeight,
      double devicePixelRatio,
      double viewportOffsetX,
      double viewportOffsetY);

  void stopSurface(jsi::Runtime &runtime, SurfaceId surfaceId);

  void produceFramesForDuration(jsi::Runtime &runtime, double milliseconds);

  void flushMessageQueue(jsi::Runtime &runtime);
  void flushEventQueue(jsi::Runtime &runtime);
  void validateEmptyMessageQueue(jsi::Runtime &runtime);

  std::vector<std::string> takeMountingManagerLogs(jsi::Runtime &runtime, SurfaceId surfaceId);

  std::string getRenderedOutput(
      jsi::Runtime &runtime,
      SurfaceId surfaceId,
      NativeFantomGetRenderedOutputRenderFormatOptions options);

  void reportTestSuiteResultsJSON(jsi::Runtime &runtime, const std::string &testSuiteResultsJSON);

  void enqueueNativeEvent(
      jsi::Runtime &runtime,
      std::shared_ptr<const ShadowNode> shadowNode,
      const std::string &type,
      const std::optional<folly::dynamic> &payload,
      std::optional<RawEvent::Category> category,
      std::optional<bool> isUnique);

  void enqueueScrollEvent(jsi::Runtime &runtime, std::shared_ptr<const ShadowNode> shadowNode, ScrollOptions options);

  jsi::Object getDirectManipulationProps(jsi::Runtime &runtime, const std::shared_ptr<const ShadowNode> &shadowNode);

  jsi::Object getFabricUpdateProps(jsi::Runtime &runtime, const std::shared_ptr<const ShadowNode> &shadowNode);

  void enqueueModalSizeUpdate(
      jsi::Runtime &runtime,
      std::shared_ptr<const ShadowNode> shadowNode,
      double width,
      double height);

  jsi::Function createShadowNodeReferenceCounter(jsi::Runtime &runtime, std::shared_ptr<const ShadowNode> shadowNode);

  jsi::Function createShadowNodeRevisionGetter(jsi::Runtime &runtime, std::shared_ptr<const ShadowNode> shadowNode);

  void saveJSMemoryHeapSnapshot(jsi::Runtime &runtime, const std::string &filePath);

  void forceHighResTimeStamp(jsi::Runtime &runtime, std::optional<HighResTimeStamp> now);

  void startJSSamplingProfiler(jsi::Runtime &runtime);

  void stopJSSamplingProfilerAndSaveToFile(jsi::Runtime &runtime, const std::string &filePath);

  void setImageResponse(
      jsi::Runtime &rt,
      const std::string &uri,
      const NativeFantomSetImageResponseImageResponse &imageResponse);
  void clearImage(jsi::Runtime &rt, const std::string &uri);
  void clearAllImages(jsi::Runtime &rt);

 private:
  TesterAppDelegate &appDelegate_;
  SurfaceId nextSurfaceId_ = 1;
};

} // namespace facebook::react
