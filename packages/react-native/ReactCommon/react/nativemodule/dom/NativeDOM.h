/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

#include <react/renderer/bridging/bridging.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

using MeasureOnSuccessCallback =
    SyncCallback<void(double, double, double, double, double, double)>;

using MeasureInWindowOnSuccessCallback =
    SyncCallback<void(double, double, double, double)>;

using MeasureLayoutOnSuccessCallback =
    SyncCallback<void(double, double, double, double)>;

class NativeDOM : public NativeDOMCxxSpec<NativeDOM> {
 public:
  NativeDOM(std::shared_ptr<CallInvoker> jsInvoker);

#pragma mark - Methods from the `Node` interface (for `ReadOnlyNode`).

  double compareDocumentPosition(
      jsi::Runtime& rt,
      jsi::Value nativeNodeReference,
      jsi::Value otherNativeNodeReference);

  std::vector<jsi::Value> getChildNodes(
      jsi::Runtime& rt,
      jsi::Value nativeNodeReference);

  jsi::Value
  getElementById(jsi::Runtime& rt, SurfaceId surfaceId, const std::string& id);

  jsi::Value getParentNode(jsi::Runtime& rt, jsi::Value nativeNodeReference);

  bool isConnected(jsi::Runtime& rt, jsi::Value nativeNodeReference);

#pragma mark - Methods from the `Element` interface (for `ReactNativeElement`).

  std::tuple<
      /* topWidth: */ int,
      /* rightWidth: */ int,
      /* bottomWidth: */ int,
      /* leftWidth: */ int>
  getBorderWidth(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  std::tuple<
      /* x: */ double,
      /* y: */ double,
      /* width: */ double,
      /* height: */ double>
  getBoundingClientRect(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      bool includeTransform);

  std::tuple</* width: */ int, /* height: */ int> getInnerSize(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  std::tuple</* scrollLeft: */ double, /* scrollTop: */ double>
  getScrollPosition(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  std::tuple</* scrollWidth: */ int, /* scrollHeight */ int> getScrollSize(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  std::string getTagName(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  std::string getTextContent(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode);

  bool hasPointerCapture(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      double pointerId);

  void releasePointerCapture(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      double pointerId);

  void setPointerCapture(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      double pointerId);

#pragma mark - Methods from the `HTMLElement` interface (for `ReactNativeElement`).

  std::tuple<
      /* offsetParent: */ jsi::Value,
      /* top: */ double,
      /* left: */ double>
  getOffset(jsi::Runtime& rt, std::shared_ptr<const ShadowNode> shadowNode);

#pragma mark - Special methods to handle the root node.

  jsi::Value linkRootNode(
      jsi::Runtime& rt,
      SurfaceId surfaceId,
      jsi::Value instanceHandle);

#pragma mark - Legacy layout APIs (for `ReactNativeElement`).

  void measure(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      const MeasureOnSuccessCallback& callback);

  void measureInWindow(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      const MeasureInWindowOnSuccessCallback& callback);

  void measureLayout(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      std::shared_ptr<const ShadowNode> relativeToShadowNode,
      jsi::Function onFail,
      const MeasureLayoutOnSuccessCallback& onSuccess);

#pragma mark - Legacy direct manipulation APIs (for `ReactNativeElement`).

  void setNativeProps(
      jsi::Runtime& rt,
      std::shared_ptr<const ShadowNode> shadowNode,
      jsi::Value updatePayload);
};

} // namespace facebook::react
