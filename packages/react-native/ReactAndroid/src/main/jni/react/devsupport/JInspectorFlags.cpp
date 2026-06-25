/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JInspectorFlags.h"

#include <jsinspector-modern/InspectorFlags.h>

namespace facebook::react::jsinspector_modern {

bool JInspectorFlags::getScreenshotCaptureEnabled(
    jni::alias_ref<jclass> /*unused*/) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  return inspectorFlags.getScreenshotCaptureEnabled();
}

bool JInspectorFlags::getFuseboxEnabled(jni::alias_ref<jclass> /*unused*/) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  return inspectorFlags.getFuseboxEnabled();
}

bool JInspectorFlags::getIsProfilingBuild(jni::alias_ref<jclass> /*unused*/) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  return inspectorFlags.getIsProfilingBuild();
}

bool JInspectorFlags::getFrameRecordingEnabled(
    jni::alias_ref<jclass> /*unused*/) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  return inspectorFlags.getFrameRecordingEnabled();
}

void JInspectorFlags::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "getScreenshotCaptureEnabled",
          JInspectorFlags::getScreenshotCaptureEnabled),
  });
  javaClassLocal()->registerNatives({
      makeNativeMethod("getFuseboxEnabled", JInspectorFlags::getFuseboxEnabled),
  });
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "getIsProfilingBuild", JInspectorFlags::getIsProfilingBuild),
  });
  javaClassLocal()->registerNatives({
      makeNativeMethod(
          "getFrameRecordingEnabled",
          JInspectorFlags::getFrameRecordingEnabled),
  });
}

} // namespace facebook::react::jsinspector_modern
