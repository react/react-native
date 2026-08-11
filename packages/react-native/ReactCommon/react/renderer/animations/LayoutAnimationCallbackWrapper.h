/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <memory>

namespace facebook::react {

class LayoutAnimationCallbackWrapper {
 public:
  LayoutAnimationCallbackWrapper(jsi::Function&& callback)
      : callback_(std::make_shared<jsi::Function>(std::move(callback))) {}
  LayoutAnimationCallbackWrapper() : callback_(nullptr) {}

  void call(jsi::Runtime& runtime) const {
    if (callback_) {
      callback_->call(runtime);
      callback_.reset();
    }
  }

 private:
  mutable std::shared_ptr<jsi::Function> callback_;
};

} // namespace facebook::react
