/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

#include <chrono>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * Exposes an instance of the Java class
 * CxxInspectorPackagerConnection.DelegateImpl to C++. The public interface
 * mirrors InspectorPackagerConnectionDelegate exactly but doesn't inherit from
 * it; this is because of fbjni limitations on multiple inheritance. To get a
 * usable InspectorPackagerConnectionDelegate instance from this object, call
 * wrapInUniquePtr().
 */
struct JCxxInspectorPackagerConnectionDelegateImpl
    : public jni::JavaClass<JCxxInspectorPackagerConnectionDelegateImpl> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/devsupport/CxxInspectorPackagerConnection$DelegateImpl;";

  std::unique_ptr<InspectorPackagerConnectionDelegate> wrapInUniquePtr();

  // InspectorPackagerConnectionDelegate methods (mirrored)

  std::unique_ptr<IWebSocket> connectWebSocket(
      const std::string& url,
      std::weak_ptr<IWebSocketDelegate> delegate);

  void scheduleCallback(
      std::function<void(void)> callback,
      std::chrono::milliseconds delayMs);

 private:
  class RefWrapper;
};

class JCxxInspectorPackagerConnectionDelegateImpl::RefWrapper
    : public InspectorPackagerConnectionDelegate {
 public:
  explicit RefWrapper(jni::alias_ref<javaobject> jDelegate);

  // InspectorPackagerConnectionDelegate methods

  virtual std::unique_ptr<IWebSocket> connectWebSocket(
      const std::string& url,
      std::weak_ptr<IWebSocketDelegate> delegate) override;

  virtual void scheduleCallback(
      std::function<void(void)> callback,
      std::chrono::milliseconds delayMs) override;

 private:
  jni::global_ref<javaobject> jDelegate_;
};

} // namespace facebook::react::jsinspector_modern
