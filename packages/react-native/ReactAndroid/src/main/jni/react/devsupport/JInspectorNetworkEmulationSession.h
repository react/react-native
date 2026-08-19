/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react::jsinspector_modern {

class JInspectorNetworkEmulationSession : public jni::HybridClass<JInspectorNetworkEmulationSession> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/modules/network/InspectorNetworkEmulationSession;";

  static jboolean isOffline(jni::alias_ref<jclass> /*unused*/);

  static jboolean isThrottling(jni::alias_ref<jclass> /*unused*/);

  static jlong createRecordToken(jni::alias_ref<jclass> /*unused*/);

  static jlong
  awaitThrottle(jni::alias_ref<jclass> /*unused*/, jlong token, jlong bytes, jdouble sendEndAgeMs, jboolean isStart);

  static void registerNatives();

 private:
  JInspectorNetworkEmulationSession() = delete;
};

} // namespace facebook::react::jsinspector_modern
