/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "SchedulerPriority.h"

#include <functional>
#include <string>

namespace facebook::jsi {
class Runtime;
}

namespace facebook::react {

using CallFunc = std::function<void(jsi::Runtime&)>;

/**
 * An interface for a generic native-to-JS call invoker. See BridgeJSCallInvoker
 * for an implementation.
 */
class CallInvoker {
 public:
  virtual void invokeAsync(CallFunc&& func) noexcept = 0;
  virtual void invokeAsync(
      SchedulerPriority /*priority*/,
      CallFunc&& func) noexcept {
    // When call with priority is not implemented, fall back to a regular async
    // execution
    invokeAsync(std::move(func));
  }
  virtual void invokeSync(CallFunc&& func) = 0;

  // Backward compatibility only, prefer the CallFunc methods instead
  virtual void invokeAsync(std::function<void()>&& func) noexcept {
    invokeAsync([func = std::move(func)](jsi::Runtime&) { func(); });
  }

  virtual void invokeSync(std::function<void()>&& func) {
    invokeSync([func = std::move(func)](jsi::Runtime&) { func(); });
  }

  virtual ~CallInvoker() = default;
};

using NativeMethodCallFunc = std::function<void()>;

class NativeMethodCallInvoker {
 public:
  virtual void invokeAsync(
      const std::string& methodName,
      NativeMethodCallFunc&& func) noexcept = 0;
  virtual void invokeSync(
      const std::string& methodName,
      NativeMethodCallFunc&& func) = 0;
  virtual ~NativeMethodCallInvoker() = default;
};

} // namespace facebook::react
