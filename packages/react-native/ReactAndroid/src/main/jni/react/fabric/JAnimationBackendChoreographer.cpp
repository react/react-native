/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JAnimationBackendChoreographer.h"

namespace facebook::react {

void JAnimationBackendChoreographer::resume() const {
  static const auto resumeMethod =
      javaClassStatic()->getMethod<void()>("resume");
  resumeMethod(self());
}

void JAnimationBackendChoreographer::pause() const {
  static const auto pauseMethod = javaClassStatic()->getMethod<void()>("pause");
  pauseMethod(self());
}

} // namespace facebook::react
