/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <string>

#include <cxxreact/ReactMarker.h>

namespace facebook::react {

class JReactMarker : public facebook::jni::JavaClass<JReactMarker> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/bridge/ReactMarker;";
  static void registerNatives();
  static void setLogPerfMarkerIfNeeded();

 private:
  static void logMarker(const std::string &marker);
  static void logMarker(const std::string &marker, const std::string &tag);
  static void logMarker(const std::string &marker, const std::string &tag, int instanceKey);
  static void logPerfMarker(ReactMarker::ReactMarkerId markerId, const char *tag);
  static void nativeLogMarker(jni::alias_ref<jclass> /* unused */, const std::string &markerNameStr, jlong markerTime);
};

} // namespace facebook::react
