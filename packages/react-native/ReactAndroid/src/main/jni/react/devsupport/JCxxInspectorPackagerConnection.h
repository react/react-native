/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "JCxxInspectorPackagerConnectionDelegateImpl.h"

#include <fbjni/fbjni.h>
#include <jsinspector-modern/InspectorPackagerConnection.h>

#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * A hybrid Java/C++ class that exposes an instance of
 * InspectorPackagerConnection to Java.
 */
class JCxxInspectorPackagerConnection
    : public jni::HybridClass<JCxxInspectorPackagerConnection> {
 public:
  constexpr static auto kJavaDescriptor =
      "Lcom/facebook/react/devsupport/CxxInspectorPackagerConnection;";

  static void registerNatives();

  // InspectorPackagerConnection's public API

  void connect();
  void closeQuietly();
  void sendEventToAllConnections(const std::string& event);

 private:
  friend HybridBase;

  using JDelegateImpl = JCxxInspectorPackagerConnectionDelegateImpl;

  /**
   * Private constructor since this class can only be created from Java.
   */
  JCxxInspectorPackagerConnection(
      const std::string& url,
      const std::string& deviceName,
      const std::string& packageName,
      jni::alias_ref<JDelegateImpl::javaobject> delegate);

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass> /*unused*/,
      const std::string& url,
      const std::string& deviceName,
      const std::string& packageName,
      jni::alias_ref<JDelegateImpl::javaobject> delegate);

  /**
   * The actual C++ implementation wrapped by this hybrid class.
   */
  InspectorPackagerConnection cxxImpl_;
};

} // namespace facebook::react::jsinspector_modern
