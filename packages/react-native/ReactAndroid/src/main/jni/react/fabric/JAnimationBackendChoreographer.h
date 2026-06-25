/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

namespace facebook::react {

/**
 * JNI wrapper for the AnimationBackendChoreographer Kotlin class.
 * This class provides the bridge between C++ and the Android AnimationBackendChoreographer
 * which handles animation frame scheduling via ReactChoreographer.
 */
class JAnimationBackendChoreographer : public jni::JavaClass<JAnimationBackendChoreographer> {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/fabric/AnimationBackendChoreographer;";

  /**
   * Resumes animation frame callbacks.
   * This method should be called when animations need to start or resume.
   */
  void resume() const;

  /**
   * Pauses animation frame callbacks.
   * This method should be called when animations should be paused (e.g., when
   * the app goes to background).
   */
  void pause() const;
};

} // namespace facebook::react
