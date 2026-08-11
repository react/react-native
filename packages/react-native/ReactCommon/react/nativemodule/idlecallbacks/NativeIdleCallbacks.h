/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

namespace facebook::react {

using CallbackHandle = jsi::Object;

using NativeRequestIdleCallbackOptions =
    NativeIdleCallbacksRequestIdleCallbackOptions<
        std::optional<HighResDuration>>;

template <>
struct Bridging<NativeRequestIdleCallbackOptions>
    : NativeIdleCallbacksRequestIdleCallbackOptionsBridging<
          NativeRequestIdleCallbackOptions> {};

class NativeIdleCallbacks
    : public NativeIdleCallbacksCxxSpec<NativeIdleCallbacks> {
 public:
  NativeIdleCallbacks(std::shared_ptr<CallInvoker> jsInvoker);

  CallbackHandle requestIdleCallback(
      jsi::Runtime& runtime,
      SyncCallback<void(jsi::Object)>&& callback,
      std::optional<NativeRequestIdleCallbackOptions> options);
  void cancelIdleCallback(jsi::Runtime& runtime, jsi::Object handle);
};

} // namespace facebook::react
