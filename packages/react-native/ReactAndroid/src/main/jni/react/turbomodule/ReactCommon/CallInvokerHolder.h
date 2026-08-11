/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <fbjni/fbjni.h>
#include <memory>

namespace facebook::react {

class CallInvokerHolder : public jni::HybridClass<CallInvokerHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/turbomodule/core/CallInvokerHolderImpl;";

  std::shared_ptr<CallInvoker> getCallInvoker() {
    return callInvoker_;
  }

 private:
  friend HybridBase;
  CallInvokerHolder(std::shared_ptr<CallInvoker> callInvoker);
  std::shared_ptr<CallInvoker> callInvoker_;
};

} // namespace facebook::react
