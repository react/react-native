/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cmath>
#include <functional>
#include <mutex>
#include <shared_mutex>

namespace facebook::react::ReactMarker {

enum ReactMarkerId {
  APP_STARTUP_START,
  APP_STARTUP_STOP,
  INIT_REACT_RUNTIME_START,
  INIT_REACT_RUNTIME_STOP,
  NATIVE_REQUIRE_START,
  NATIVE_REQUIRE_STOP,
  RUN_JS_BUNDLE_START,
  RUN_JS_BUNDLE_STOP,
  CREATE_REACT_CONTEXT_STOP,
  JS_BUNDLE_STRING_CONVERT_START,
  JS_BUNDLE_STRING_CONVERT_STOP,
  NATIVE_MODULE_SETUP_START,
  NATIVE_MODULE_SETUP_STOP,
  REGISTER_JS_SEGMENT_START,
  REGISTER_JS_SEGMENT_STOP,
  REACT_INSTANCE_INIT_START,
  REACT_INSTANCE_INIT_STOP
};

using LogTaggedMarker = std::function<void(ReactMarkerId, const char *tag)>;
using LogTaggedMarkerBridgeless = LogTaggedMarker;

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

/// Thread-safe holder for a LogTaggedMarker callback. Reads and writes are
/// internally synchronized, so callers do not need external locking.
struct RN_EXPORT AtomicLogTaggedMarker {
  AtomicLogTaggedMarker &operator=(LogTaggedMarker marker)
  {
    std::unique_lock lock(mutex_);
    impl_ = std::move(marker);
    return *this;
  }

  explicit operator bool() const noexcept
  {
    std::shared_lock lock(mutex_);
    return static_cast<bool>(impl_);
  }

  void operator()(ReactMarkerId markerId, const char *tag) const
  {
    std::shared_lock lock(mutex_);
    if (impl_) {
      impl_(markerId, tag);
    }
  }

 private:
  LogTaggedMarker impl_;
  mutable std::shared_mutex mutex_;
};

extern RN_EXPORT AtomicLogTaggedMarker logTaggedMarkerImpl;

extern RN_EXPORT void logMarker(ReactMarkerId markerId);
extern RN_EXPORT void logTaggedMarker(ReactMarkerId markerId, const char *tag);
[[deprecated("Use logMarker instead")]]
extern RN_EXPORT void logMarkerBridgeless(ReactMarkerId markerId);
[[deprecated("Use logTaggedMarker instead")]]
extern RN_EXPORT void logTaggedMarkerBridgeless(ReactMarkerId markerId, const char *tag);

struct ReactMarkerEvent {
  const ReactMarkerId markerId;
  const char *tag;
  double time;
};

class RN_EXPORT StartupLogger {
 public:
  static StartupLogger &getInstance();

  void logStartupEvent(ReactMarkerId markerId, double markerTime);
  void reset();
  double getAppStartupStartTime();
  double getInitReactRuntimeStartTime();
  double getRunJSBundleStartTime();
  double getAppStartupEndTime();

 private:
  StartupLogger() = default;
  StartupLogger(const StartupLogger &) = delete;
  StartupLogger &operator=(const StartupLogger &) = delete;

  double appStartupStartTime = std::nan("");
  double appStartupEndTime = std::nan("");
  double initReactRuntimeStartTime = std::nan("");
  double initReactRuntimeEndTime = std::nan("");
  double runJSBundleStartTime = std::nan("");
  double runJSBundleEndTime = std::nan("");
};

// When the marker got logged from the platform, it will notify here. This is
// used to collect react markers that are logged in the platform instead of in
// C++.
extern RN_EXPORT void logMarkerDone(ReactMarkerId markerId, double markerTime);

} // namespace facebook::react::ReactMarker
