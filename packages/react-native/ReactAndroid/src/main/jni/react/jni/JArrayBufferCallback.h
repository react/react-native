/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

#include <fbjni/fbjni.h>

#include "JArrayBuffer.h"
#include "JCallback.h"

namespace facebook::react {

// Resolve callback for a Promise that may be fulfilled with an ArrayBuffer or
// null.
//
// Created only where the JavaScript spec permits Promise<ArrayBuffer> or
// Promise<?ArrayBuffer>. Does not use folly::dynamic; the bytes of an owning
// com.facebook.react.bridge.ArrayBuffer reach JavaScript without a copy, and
// null is forwarded explicitly.
//
// The Java side validates what the module resolved with and reports a
// description of the problem through `error` instead of throwing, so that
// misuse rejects the Promise rather than escaping on the resolving thread.
class JCxxArrayBufferCallbackImpl : public jni::HybridClass<JCxxArrayBufferCallbackImpl, JCallback> {
 public:
  constexpr static auto kJavaDescriptor = "Lcom/facebook/react/bridge/CxxArrayBufferCallbackImpl;";

  static void registerNatives()
  {
    registerHybrid({
        makeNativeMethod("nativeInvoke", JCxxArrayBufferCallbackImpl::invoke),
    });
  }

 private:
  friend HybridBase;

  // At most one of `arrayBuffer` and `error` is non-null. Both null resolves
  // the Promise with JavaScript null.
  using Callback = std::function<
      void(jni::alias_ref<JArrayBuffer::javaobject> arrayBuffer, jni::alias_ref<jni::JString> error)>;

  explicit JCxxArrayBufferCallbackImpl(Callback callback) : callback_(std::move(callback)) {}

  void invoke(jni::alias_ref<JArrayBuffer::javaobject> arrayBuffer, jni::alias_ref<jni::JString> error)
  {
    callback_(arrayBuffer, error);
  }

  Callback callback_;
};

} // namespace facebook::react
