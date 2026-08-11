/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <jsi/jsi.h>
#include <list>

namespace facebook::react {

class TestCallInvoker : public CallInvoker {
 public:
  explicit TestCallInvoker(facebook::jsi::Runtime& runtime)
      : runtime_(runtime) {}

  void invokeAsync(CallFunc&& func) noexcept override {
    queue_.push_back(std::move(func));
  }

  void invokeSync(CallFunc&& func) override {
    func(runtime_);
  }

  void flushQueue() {
    while (!queue_.empty()) {
      queue_.front()(runtime_);
      queue_.pop_front();
      runtime_.drainMicrotasks(); // Run microtasks every cycle.
    }
  }

  size_t queueSize() {
    return queue_.size();
  }

 private:
  facebook::jsi::Runtime& runtime_;
  std::list<CallFunc> queue_{};
};

} // namespace facebook::react
