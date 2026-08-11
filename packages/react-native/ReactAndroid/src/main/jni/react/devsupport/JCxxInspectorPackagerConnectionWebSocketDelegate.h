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
#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * A hybrid Java/C++ class that exposes a C++ implementation of
 * IWebSocketDelegate to Java.
 */
class JCxxInspectorPackagerConnectionWebSocketDelegate
    : public jni::HybridClass<
          JCxxInspectorPackagerConnectionWebSocketDelegate> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/devsupport/CxxInspectorPackagerConnection$WebSocketDelegate;";

  void didFailWithError(
      jni::alias_ref<jni::JInteger> posixCode,
      const std::string& error);

  void didReceiveMessage(const std::string& message);

  void didOpen();

  void didClose();

  static void registerNatives();

  JCxxInspectorPackagerConnectionWebSocketDelegate(
      std::weak_ptr<IWebSocketDelegate> cxxDelegate);

 private:
  friend HybridBase;
  const std::weak_ptr<IWebSocketDelegate> cxxDelegate_;
};

} // namespace facebook::react::jsinspector_modern
