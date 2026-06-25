/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/renderer/animationbackend/AnimationChoreographer.h>

#include "JAnimationBackendChoreographer.h"

namespace facebook::react {

class AndroidAnimationChoreographer : public AnimationChoreographer {
 public:
  explicit AndroidAnimationChoreographer(jni::alias_ref<JAnimationBackendChoreographer> jChoreographer)
      : jChoreographer_(jni::make_global(jChoreographer))
  {
  }

  void resume() override
  {
    jChoreographer_->resume();
  }

  void pause() override
  {
    jChoreographer_->pause();
  }

 private:
  jni::global_ref<JAnimationBackendChoreographer> jChoreographer_;
};

} // namespace facebook::react
