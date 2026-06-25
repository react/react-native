/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactMarker.h"
#include <cxxreact/ReactMarker.h>
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <mutex>

namespace facebook::react {

namespace {
const int kInstanceKey = 1;
}

void JReactMarker::setLogPerfMarkerIfNeeded() {
  static std::once_flag flag{};
  std::call_once(flag, []() {
    ReactMarker::logTaggedMarkerImpl = JReactMarker::logPerfMarker;
  });
}

void JReactMarker::logMarker(const std::string& marker) {
  static auto cls = javaClassStatic();
  static auto meth = cls->getStaticMethod<void(std::string)>("logMarker");
  meth(cls, marker);
}

void JReactMarker::logMarker(
    const std::string& marker,
    const std::string& tag) {
  static auto cls = javaClassStatic();
  static auto meth =
      cls->getStaticMethod<void(std::string, std::string)>("logMarker");
  meth(cls, marker, tag);
}

void JReactMarker::logMarker(
    const std::string& marker,
    const std::string& tag,
    const int instanceKey) {
  static auto cls = javaClassStatic();
  static auto meth =
      cls->getStaticMethod<void(std::string, std::string, int)>("logMarker");
  meth(cls, marker, tag, instanceKey);
}

void JReactMarker::logPerfMarker(
    const ReactMarker::ReactMarkerId markerId,
    const char* tag) {
  switch (markerId) {
    case ReactMarker::APP_STARTUP_START:
      JReactMarker::logMarker("APP_STARTUP_START");
      break;
    case ReactMarker::APP_STARTUP_STOP:
      JReactMarker::logMarker("APP_STARTUP_END");
      break;
    case ReactMarker::INIT_REACT_RUNTIME_START:
      JReactMarker::logMarker("INIT_REACT_RUNTIME_START");
      break;
    case ReactMarker::INIT_REACT_RUNTIME_STOP:
      JReactMarker::logMarker("INIT_REACT_RUNTIME_END");
      break;
    case ReactMarker::RUN_JS_BUNDLE_START:
      JReactMarker::logMarker("RUN_JS_BUNDLE_START", tag, kInstanceKey);
      break;
    case ReactMarker::RUN_JS_BUNDLE_STOP:
      JReactMarker::logMarker("RUN_JS_BUNDLE_END", tag, kInstanceKey);
      break;
    case ReactMarker::CREATE_REACT_CONTEXT_STOP:
      JReactMarker::logMarker("CREATE_REACT_CONTEXT_END");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_START:
      JReactMarker::logMarker("loadApplicationScript_startStringConvert");
      break;
    case ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP:
      JReactMarker::logMarker("loadApplicationScript_endStringConvert");
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_START:
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_START", tag, kInstanceKey);
      break;
    case ReactMarker::NATIVE_MODULE_SETUP_STOP:
      JReactMarker::logMarker("NATIVE_MODULE_SETUP_END", tag, kInstanceKey);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_START:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_START", tag, kInstanceKey);
      break;
    case ReactMarker::REGISTER_JS_SEGMENT_STOP:
      JReactMarker::logMarker("REGISTER_JS_SEGMENT_STOP", tag, kInstanceKey);
      break;
    case ReactMarker::NATIVE_REQUIRE_START:
    case ReactMarker::NATIVE_REQUIRE_STOP:
    case ReactMarker::REACT_INSTANCE_INIT_START:
    case ReactMarker::REACT_INSTANCE_INIT_STOP:
      // These are not used on Android.
      break;
  }
}

void JReactMarker::nativeLogMarker(
    jni::alias_ref<jclass> /* unused */,
    const std::string& markerNameStr,
    jlong markerTime) {
  // TODO: refactor this to a bidirectional map along with
  // logPerfMarkerWithInstanceKey
  if (markerNameStr == "APP_STARTUP_START") {
    ReactMarker::logMarkerDone(
        ReactMarker::APP_STARTUP_START, (double)markerTime);
  } else if (markerNameStr == "APP_STARTUP_END") {
    ReactMarker::logMarkerDone(
        ReactMarker::APP_STARTUP_STOP, (double)markerTime);
  } else if (markerNameStr == "INIT_REACT_RUNTIME_START") {
    ReactMarker::logMarkerDone(
        ReactMarker::INIT_REACT_RUNTIME_START, (double)markerTime);
  } else if (markerNameStr == "INIT_REACT_RUNTIME_END") {
    ReactMarker::logMarkerDone(
        ReactMarker::INIT_REACT_RUNTIME_STOP, (double)markerTime);
  } else if (markerNameStr == "RUN_JS_BUNDLE_START") {
    ReactMarker::logMarkerDone(
        ReactMarker::RUN_JS_BUNDLE_START, (double)markerTime);
  } else if (markerNameStr == "RUN_JS_BUNDLE_END") {
    ReactMarker::logMarkerDone(
        ReactMarker::RUN_JS_BUNDLE_STOP, (double)markerTime);
  } else if (markerNameStr == "CREATE_REACT_CONTEXT_END") {
    ReactMarker::logMarkerDone(
        ReactMarker::CREATE_REACT_CONTEXT_STOP, (double)markerTime);
  } else if (markerNameStr == "loadApplicationScript_startStringConvert") {
    ReactMarker::logMarkerDone(
        ReactMarker::JS_BUNDLE_STRING_CONVERT_START, (double)markerTime);
  } else if (markerNameStr == "loadApplicationScript_endStringConvert") {
    ReactMarker::logMarkerDone(
        ReactMarker::JS_BUNDLE_STRING_CONVERT_STOP, (double)markerTime);
  } else if (markerNameStr == "NATIVE_MODULE_SETUP_START") {
    ReactMarker::logMarkerDone(
        ReactMarker::NATIVE_MODULE_SETUP_START, (double)markerTime);
  } else if (markerNameStr == "NATIVE_MODULE_SETUP_END") {
    ReactMarker::logMarkerDone(
        ReactMarker::NATIVE_MODULE_SETUP_STOP, (double)markerTime);
  } else if (markerNameStr == "REGISTER_JS_SEGMENT_START") {
    ReactMarker::logMarkerDone(
        ReactMarker::REGISTER_JS_SEGMENT_START, (double)markerTime);
  } else if (markerNameStr == "REGISTER_JS_SEGMENT_STOP") {
    ReactMarker::logMarkerDone(
        ReactMarker::REGISTER_JS_SEGMENT_STOP, (double)markerTime);
  }
}

void JReactMarker::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeLogMarker", JReactMarker::nativeLogMarker),
  });
}

} // namespace facebook::react
