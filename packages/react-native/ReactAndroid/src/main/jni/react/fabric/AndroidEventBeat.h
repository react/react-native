/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventBeat.h>

#include "EventBeatManager.h"

namespace facebook::react {

class AndroidEventBeat final : public EventBeat,
                               public EventBeatManagerObserver {
 public:
  AndroidEventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      EventBeatManager* eventBeatManager,
      RuntimeScheduler& runtimeScheduler,
      jni::global_ref<jobject> javaUIManager);

  ~AndroidEventBeat() override;

  void tick() const override;

  void request() const override;

 private:
  EventBeatManager* eventBeatManager_;
  jni::global_ref<jobject> javaUIManager_;
};

} // namespace facebook::react
