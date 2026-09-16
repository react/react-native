/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif
#include <react/renderer/observers/resize/ResizeObserverManager.h>
#include <optional>
#include <string>
#include <tuple>
#include <vector>

namespace facebook::react {

using RectAsTuple = std::tuple<Float, Float, Float, Float>;
using SizeAsTuple = std::tuple<Float, Float>;
using NativeResizeObserverNotifyCallback = SyncCallback<void(bool)>;

using NativeResizeObserverObserveOptions = NativeResizeObserverNativeResizeObserverObserveOptions<
    // resizeObserverId
    ResizeObserverObserverId,
    // targetShadowNode
    std::shared_ptr<const ShadowNode>,
    // box
    std::optional<std::string>>;

using NativeResizeObserverEntry = NativeResizeObserverNativeResizeObserverEntry<
    // resizeObserverId
    ResizeObserverObserverId,
    // targetInstanceHandle
    jsi::Value,
    // contentRect
    RectAsTuple,
    // borderBoxSize
    SizeAsTuple,
    // contentBoxSize
    SizeAsTuple,
    // devicePixelContentBoxSize
    SizeAsTuple>;

class NativeResizeObserver : public NativeResizeObserverCxxSpec<NativeResizeObserver> {
 public:
  explicit NativeResizeObserver(std::shared_ptr<CallInvoker> jsInvoker);

  jsi::Object observe(jsi::Runtime &runtime, const NativeResizeObserverObserveOptions &options);

  void unobserve(jsi::Runtime &runtime, ResizeObserverObserverId resizeObserverId, jsi::Object targetToken);

  void connect(jsi::Runtime &runtime, NativeResizeObserverNotifyCallback notifyResizeObserversFunction);

  void disconnect(jsi::Runtime &runtime);

  std::vector<NativeResizeObserverEntry> takeRecords(jsi::Runtime &runtime);

 private:
  ResizeObserverManager resizeObserverManager_{};
};

} // namespace facebook::react
