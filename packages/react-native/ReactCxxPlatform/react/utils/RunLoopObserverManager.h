/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PlatformRunLoopObserver.h"

#include <react/renderer/core/EventBeat.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <memory>

namespace facebook::react {

class RunLoopObserverManager
    : std::enable_shared_from_this<RunLoopObserverManager> {
 public:
  std::unique_ptr<EventBeat> createEventBeat(
      std::shared_ptr<EventBeat::OwnerBox> ownerBox,
      RuntimeScheduler& runtimeScheduler);

  void onRender() const noexcept;

  void induce() const noexcept;

 private:
  std::weak_ptr<const PlatformRunLoopObserver> observer_;
};

} // namespace facebook::react
