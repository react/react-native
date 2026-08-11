/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * Exposes an implementation of the Java interface
 * CxxInspectorPackagerConnection.IWebSocket to C++. The public interface
 * mirrors IWebSocket exactly but doesn't inherit from
 * it; this is because of fbjni limitations on multiple inheritance. To get a
 * usable IWebSocket instance from this object, call
 * wrapInUniquePtr().
 */
class JCxxInspectorPackagerConnectionWebSocket
    : public jni::JavaClass<JCxxInspectorPackagerConnectionWebSocket> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/devsupport/CxxInspectorPackagerConnection$IWebSocket;";

  ~JCxxInspectorPackagerConnectionWebSocket();

  std::unique_ptr<jsinspector_modern::IWebSocket> wrapInUniquePtr();

  // IWebSocket methods (mirrored)
  void send(std::string_view message);

 private:
  class RefWrapper;

  void close();
};

class JCxxInspectorPackagerConnectionWebSocket::RefWrapper : public IWebSocket {
 public:
  explicit RefWrapper(jni::alias_ref<javaobject> jWebSocket_);

  // IWebSocket methods

  virtual void send(std::string_view message) override;

 private:
  jni::global_ref<javaobject> jWebSocket_;
};

} // namespace facebook::react::jsinspector_modern
