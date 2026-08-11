/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/utils/RunLoopObserver.h>
#include <functional>
#include <utility>

namespace facebook::react {

class PlatformRunLoopObserver;

class PlatformRunLoopObserver : public RunLoopObserver {
 public:
  PlatformRunLoopObserver(
      RunLoopObserver::Activity activities,
      const RunLoopObserver::WeakOwner& owner)
      : RunLoopObserver(activities, owner) {}
  ~PlatformRunLoopObserver() override = default;

  PlatformRunLoopObserver(PlatformRunLoopObserver& other) = delete;
  PlatformRunLoopObserver& operator=(PlatformRunLoopObserver& other) = delete;
  PlatformRunLoopObserver(PlatformRunLoopObserver&& other) = delete;
  PlatformRunLoopObserver& operator=(PlatformRunLoopObserver&& other) = delete;

  bool isOnRunLoopThread() const noexcept override {
    return false;
  }

  void onRender() const noexcept {
    if (auto owner = owner_.lock()) {
      activityDidChange(activities_);
    }
  }

 private:
  void startObserving() const noexcept override {}
  void stopObserving() const noexcept override {}
};

} // namespace facebook::react
