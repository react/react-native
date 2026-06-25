/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JCxxInspectorPackagerConnectionDelegateImpl.h"
#include "JCxxInspectorPackagerConnectionWebSocket.h"
#include "JCxxInspectorPackagerConnectionWebSocketDelegate.h"

#include <fbjni/NativeRunnable.h>

#include <string>

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

std::unique_ptr<IWebSocket>
JCxxInspectorPackagerConnectionDelegateImpl::connectWebSocket(
    const std::string& url,
    std::weak_ptr<IWebSocketDelegate> delegate) {
  using JWebSocket = JCxxInspectorPackagerConnectionWebSocket;
  using JWebSocketDelegate = JCxxInspectorPackagerConnectionWebSocketDelegate;
  static auto method =
      javaClassStatic()
          ->getMethod<alias_ref<JWebSocket::javaobject>(
              const std::string&, alias_ref<JWebSocketDelegate::javaobject>)>(
              "connectWebSocket");
  auto jWebSocket = method(
      self(), url, make_global(JWebSocketDelegate::newObjectCxxArgs(delegate)));
  if (!jWebSocket) {
    return nullptr;
  }
  return jWebSocket->wrapInUniquePtr();
}

void JCxxInspectorPackagerConnectionDelegateImpl::scheduleCallback(
    std::function<void(void)> callback,
    std::chrono::milliseconds delayMs) {
  static auto method =
      javaClassStatic()
          ->getMethod<void(alias_ref<JRunnable::javaobject>, jlong)>(
              "scheduleCallback");
  method(
      self(),
      JNativeRunnable::newObjectCxxArgs(std::move(callback)),
      static_cast<jlong>(delayMs.count()));
}

std::unique_ptr<InspectorPackagerConnectionDelegate>
JCxxInspectorPackagerConnectionDelegateImpl::wrapInUniquePtr() {
  return std::unique_ptr<InspectorPackagerConnectionDelegate>{
      new RefWrapper{self()}};
}

JCxxInspectorPackagerConnectionDelegateImpl::RefWrapper::RefWrapper(
    jni::alias_ref<javaobject> jDelegate)
    : jDelegate_(make_global(jDelegate)) {}

std::unique_ptr<IWebSocket>
JCxxInspectorPackagerConnectionDelegateImpl::RefWrapper::connectWebSocket(
    const std::string& url,
    std::weak_ptr<IWebSocketDelegate> delegate) {
  return jDelegate_->connectWebSocket(url, delegate);
}

void JCxxInspectorPackagerConnectionDelegateImpl::RefWrapper::scheduleCallback(
    std::function<void(void)> callback,
    std::chrono::milliseconds delayMs) {
  return jDelegate_->scheduleCallback(callback, delayMs);
}

} // namespace facebook::react::jsinspector_modern
