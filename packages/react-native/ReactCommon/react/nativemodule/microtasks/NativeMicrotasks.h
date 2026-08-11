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

class NativeMicrotasks : public NativeMicrotasksCxxSpec<NativeMicrotasks> {
 public:
  NativeMicrotasks(std::shared_ptr<CallInvoker> jsInvoker);

  void queueMicrotask(jsi::Runtime& runtime, jsi::Function callback);
};

} // namespace facebook::react
