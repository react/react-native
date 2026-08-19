/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JInspectorNetworkEmulationSession.h"

#include <jsinspector-modern/network/NetworkThrottler.h>

#include <algorithm>
#include <chrono>
#include <future>
#include <memory>

using namespace facebook::jni;

namespace facebook::react::jsinspector_modern {

/* static */ jboolean JInspectorNetworkEmulationSession::isOffline(
    jni::alias_ref<jclass> /*unused*/) {
  return static_cast<jboolean>(NetworkThrottler::getInstance().isOffline());
}

/* static */ jboolean JInspectorNetworkEmulationSession::isThrottling(
    jni::alias_ref<jclass> /*unused*/) {
  return static_cast<jboolean>(NetworkThrottler::getInstance().isThrottling());
}

/* static */ jlong JInspectorNetworkEmulationSession::createRecordToken(
    jni::alias_ref<jclass> /*unused*/) {
  return static_cast<jlong>(
      NetworkThrottler::getInstance().createRecordToken());
}

/* static */ jlong JInspectorNetworkEmulationSession::awaitThrottle(
    jni::alias_ref<jclass> /*unused*/,
    jlong token,
    jlong bytes,
    jdouble sendEndAgeMs,
    jboolean isStart) {
  auto& throttler = NetworkThrottler::getInstance();

  auto sendEnd = NetworkThrottler::Clock::now() -
      std::chrono::duration_cast<NetworkThrottler::Clock::duration>(
                     std::chrono::duration<double, std::milli>(
                         std::max(0.0, static_cast<double>(sendEndAgeMs))));

  // Block the calling (OkHttp dispatcher) thread until the operation is
  // released. Records always complete eventually: rate-limited by the timer,
  // or flushed when conditions change.
  auto promise = std::make_shared<std::promise<std::pair<bool, int64_t>>>();
  auto result = throttler.startThrottle(
      static_cast<uint64_t>(token),
      static_cast<int64_t>(bytes),
      sendEnd,
      isStart != 0u,
      /* isUpload */ false,
      [promise](bool disconnected, int64_t newDebt) {
        promise->set_value({disconnected, newDebt});
      });

  switch (result) {
    case NetworkThrottler::StartResult::PassThrough:
      return bytes;
    case NetworkThrottler::StartResult::Disconnected:
      jni::throwNewJavaException(
          "java/net/UnknownHostException",
          "Unable to resolve host: offline mode is emulated by React Native DevTools");
    case NetworkThrottler::StartResult::Pending: {
      auto [disconnected, newDebt] = promise->get_future().get();
      if (disconnected) {
        jni::throwNewJavaException(
            "java/net/UnknownHostException",
            "Unable to resolve host: offline mode is emulated by React Native DevTools");
      }
      return static_cast<jlong>(newDebt);
    }
  }
  return bytes;
}

/* static */ void JInspectorNetworkEmulationSession::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "isOffline", JInspectorNetworkEmulationSession::isOffline),
      makeNativeMethod(
          "isThrottling", JInspectorNetworkEmulationSession::isThrottling),
      makeNativeMethod(
          "createRecordToken",
          JInspectorNetworkEmulationSession::createRecordToken),
      makeNativeMethod(
          "awaitThrottle", JInspectorNetworkEmulationSession::awaitThrottle),
  });
}

} // namespace facebook::react::jsinspector_modern
