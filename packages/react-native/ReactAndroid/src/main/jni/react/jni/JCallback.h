/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <fbjni/fbjni.h>
#include <folly/dynamic.h>

#include "NativeArray.h"

namespace facebook::react {

class Instance;

struct JCallback : public jni::JavaClass<JCallback> {
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/Callback;";
};

class JCxxCallbackImpl : public jni::HybridClass<JCxxCallbackImpl, JCallback> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/bridge/CxxCallbackImpl;";

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("nativeInvoke", JCxxCallbackImpl::invoke),
    });
  }

 private:
  friend HybridBase;

  using Callback = std::function<void(folly::dynamic)>;
  JCxxCallbackImpl(Callback callback) : callback_(std::move(callback)) {}

  void invoke(NativeArray* arguments) {
    callback_(arguments->consume());
  }

  Callback callback_;
};

} // namespace facebook::react
