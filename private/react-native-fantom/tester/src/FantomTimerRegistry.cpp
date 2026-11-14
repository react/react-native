/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "FantomTimerRegistry.h"

#include <react/runtime/TimerManager.h>
#include <algorithm>
#include <optional>

namespace facebook::react {

void FantomTimerRegistry::createTimer(uint32_t timerId, double delayMs) {
  scheduleTimer(timerId, delayMs, /* isRecurring */ false);
}

void FantomTimerRegistry::createRecurringTimer(
    uint32_t timerId,
    double delayMs) {
  scheduleTimer(timerId, delayMs, /* isRecurring */ true);
}

void FantomTimerRegistry::scheduleTimer(
    uint32_t timerId,
    double delayMs,
    bool isRecurring) {
  double effectiveDelayMs = std::max(delayMs, 0.0);

  // In the default (non-mock) mode, preserve the behavior observable in
  // synchronous Fantom tests: a zero/negative-delay one-shot timer is
  // dispatched immediately (it fires on the next work loop). Everything else
  // stays pending until the mock clock is advanced.
  if (!mockEnabled_ && !isRecurring && effectiveDelayMs == 0.0) {
    fireTimer(timerId);
    return;
  }

  timers_[timerId] = Timer{
      .timerId = timerId,
      .dueTimeMs = nowMs_ + effectiveDelayMs,
      .intervalMs = effectiveDelayMs,
      .isRecurring = isRecurring};
}

void FantomTimerRegistry::deleteTimer(uint32_t timerId) {
  timers_.erase(timerId);
}

void FantomTimerRegistry::quit() {
  timers_.clear();
}

void FantomTimerRegistry::setTimerManager(
    std::weak_ptr<TimerManager> timerManager) {
  timerManager_ = std::move(timerManager);
}

void FantomTimerRegistry::setMockEnabled(bool enabled) {
  mockEnabled_ = enabled;
}

bool FantomTimerRegistry::isMockEnabled() const noexcept {
  return mockEnabled_;
}

uint32_t FantomTimerRegistry::getPendingTimerCount() const noexcept {
  return static_cast<uint32_t>(timers_.size());
}

void FantomTimerRegistry::fireTimer(uint32_t timerId) {
  if (auto timerManager = timerManager_.lock()) {
    timerManager->callTimer(static_cast<TimerHandle>(timerId));
  }
}

std::optional<uint32_t> FantomTimerRegistry::findNextTimer(
    double maxDueTimeMs) const {
  // The earliest timer due at or before `maxDueTimeMs`, breaking ties by timer
  // id (insertion order / FIFO per the timer index).
  std::optional<uint32_t> nextId;
  double nextDueMs = 0.0;
  for (const auto& [id, timer] : timers_) {
    if (timer.dueTimeMs <= maxDueTimeMs &&
        (!nextId.has_value() || timer.dueTimeMs < nextDueMs ||
         (timer.dueTimeMs == nextDueMs && id < *nextId))) {
      nextId = id;
      nextDueMs = timer.dueTimeMs;
    }
  }
  return nextId;
}

void FantomTimerRegistry::fireAndAdvanceTo(uint32_t timerId) {
  auto it = timers_.find(timerId);
  Timer timer = it->second;

  nowMs_ = timer.dueTimeMs;

  if (timer.isRecurring) {
    it->second.dueTimeMs = timer.dueTimeMs + timer.intervalMs;
  } else {
    timers_.erase(it);
  }

  fireTimer(timer.timerId);
}

double FantomTimerRegistry::advanceTimersToNextDue(double deltaMs) {
  double targetMs = nowMs_ + std::max(deltaMs, 0.0);

  auto nextId = findNextTimer(targetMs);
  if (!nextId.has_value()) {
    nowMs_ = targetMs;
    return -1;
  }

  fireAndAdvanceTo(*nextId);
  return targetMs - nowMs_;
}

bool FantomTimerRegistry::runNextTimer() {
  auto nextId = findNextTimer(std::numeric_limits<double>::infinity());
  if (!nextId.has_value()) {
    return false;
  }

  fireAndAdvanceTo(*nextId);
  return true;
}

} // namespace facebook::react
