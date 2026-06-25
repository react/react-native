/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PlatformTimerRegistryImpl.h"

#include <glog/logging.h>
#include <chrono>

namespace facebook::react {

void PlatformTimerRegistryImpl::quit() {
  LOG(INFO) << "Shutting down PlatformTimerRegistryImpl...";
  taskDispatchThread_.quit();
  std::lock_guard<std::mutex> guard(timersMutex_);
  timers_.clear();
}

void PlatformTimerRegistryImpl::createTimer(uint32_t timerId, double delayMs) {
  createTimerInternal(timerId, delayMs, false);
}

void PlatformTimerRegistryImpl::deleteTimer(uint32_t timerId) {
  std::lock_guard<std::mutex> guard(timersMutex_);
  if (auto it = timers_.find(timerId); it != timers_.end()) {
    timers_.erase(it);
  }
}

void PlatformTimerRegistryImpl::createRecurringTimer(
    uint32_t timerId,
    double delayMs) {
  createTimerInternal(timerId, delayMs, true);
}

void PlatformTimerRegistryImpl::createTimerInternal(
    uint32_t timerId,
    double delayMs,
    bool recurring) {
  {
    std::lock_guard<std::mutex> guard(timersMutex_);
    timers_.emplace(
        timerId,
        Timer{
            .timerId = timerId,
            .durationMs = delayMs,
            .isRecurring = recurring});
  }
  startTimer(timerId, delayMs);
}

void PlatformTimerRegistryImpl::startTimer(uint32_t timerId, double delayMs) {
  taskDispatchThread_.runAsync(
      [this, timerId, delayMs]() {
        bool isRecurring = true;
        {
          std::lock_guard<std::mutex> guard(timersMutex_);
          auto it = timers_.find(timerId);
          if (it == timers_.end()) {
            // timer was deleted before it could have been dispatched (at this
            // iteration)
            return;
          }
          if (!it->second.isRecurring) {
            timers_.erase(it);
            isRecurring = false;
          }
        }

        if (auto timerManagerStrong = timerManager_.lock()) {
          timerManagerStrong->callTimer(timerId);
        }

        if (isRecurring) {
          startTimer(timerId, delayMs);
        }
      },
      std::chrono::milliseconds(static_cast<int32_t>(delayMs)));
}

void PlatformTimerRegistryImpl::setTimerManager(
    std::weak_ptr<TimerManager> timerManager) {
  timerManager_ = timerManager;
}

} // namespace facebook::react
