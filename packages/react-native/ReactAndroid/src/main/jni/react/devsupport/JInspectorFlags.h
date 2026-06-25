/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react::jsinspector_modern {

/**
 * JNI wrapper for `jsinspector_modern::InspectorFlags`.
 */
class JInspectorFlags : public jni::JavaClass<JInspectorFlags> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/InspectorFlags;";

  static bool getScreenshotCaptureEnabled(jni::alias_ref<jclass> /*unused*/);
  static bool getFuseboxEnabled(jni::alias_ref<jclass> /*unused*/);
  static bool getIsProfilingBuild(jni::alias_ref<jclass> /*unused*/);
  static bool getFrameRecordingEnabled(jni::alias_ref<jclass> /*unused*/);

  static void registerNatives();

 private:
  JInspectorFlags();
};

} // namespace facebook::react::jsinspector_modern
