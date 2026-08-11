/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

#include <memory>

#include <react/bridging/LongLivedObject.h>

namespace facebook::react {

class CallInvoker;

// Helper for passing jsi::Function arg to other methods.
class CallbackWrapper : public LongLivedObject {
 private:
  CallbackWrapper(
      jsi::Function&& callback,
      jsi::Runtime& runtime,
      std::shared_ptr<CallInvoker> jsInvoker)
      : LongLivedObject(runtime),
        callback_(std::move(callback)),
        jsInvoker_(std::move(jsInvoker)) {}

  jsi::Function callback_;
  std::shared_ptr<CallInvoker> jsInvoker_;

 public:
  static std::weak_ptr<CallbackWrapper> createWeak(
      jsi::Function&& callback,
      jsi::Runtime& runtime,
      std::shared_ptr<CallInvoker> jsInvoker) {
    auto wrapper = std::shared_ptr<CallbackWrapper>(new CallbackWrapper(
        std::move(callback), runtime, std::move(jsInvoker)));
    LongLivedObjectCollection::get(runtime).add(wrapper);
    return wrapper;
  }

  // Delete the enclosed jsi::Function
  void destroy() {
    allowRelease();
  }

  jsi::Function& callback() noexcept {
    return callback_;
  }

  jsi::Runtime& runtime() noexcept {
    return runtime_;
  }

  CallInvoker& jsInvoker() noexcept {
    return *(jsInvoker_);
  }

  std::shared_ptr<CallInvoker> jsInvokerPtr() noexcept {
    return jsInvoker_;
  }
};

} // namespace facebook::react
