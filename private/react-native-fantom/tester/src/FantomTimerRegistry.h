/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/runtime/PlatformTimerRegistry.h>
#include <cstdint>
#include <memory>
#include <unordered_map>

namespace facebook::react {

/**
 * A deterministic PlatformTimerRegistry for Fantom.
 *
 * Unlike the production registry, this implementation does not schedule timers
 * on a real background thread. Instead it keeps a virtual clock that is only
 * advanced from JS (through the public Fantom API -> NativeFantom), so that
 * `setTimeout`/`setInterval` callbacks fire deterministically.
 *
 * Two modes:
 *  - Mock disabled (default): preserves the behavior observable in synchronous
 *    Fantom tests today. Zero/negative-delay one-shot timers are dispatched
 *    immediately (they fire on the next work loop); positive-delay and
 *    recurring timers stay pending and never fire on their own.
 *  - Mock enabled (via `setMockEnabled(true)`): all timers stay pending and
 *    only fire when JS advances the virtual clock via `advanceTimersByTime` or
 *    drains them via `runAllTimers` (jest fake-timer semantics).
 *
 * Firing a timer calls `TimerManager::callTimer`, which enqueues the JS
 * callback on the RuntimeScheduler; the caller is expected to run the work loop
 * afterwards to execute the callbacks.
 *
 * All methods are expected to be called on the JS thread (Fantom is
 * single-threaded), so no locking is required.
 */
class FantomTimerRegistry : public PlatformTimerRegistry {
 public:
  FantomTimerRegistry() noexcept = default;
  FantomTimerRegistry(const FantomTimerRegistry &) = delete;
  FantomTimerRegistry(FantomTimerRegistry &&) = delete;
  FantomTimerRegistry &operator=(const FantomTimerRegistry &) = delete;
  FantomTimerRegistry &operator=(FantomTimerRegistry &&) = delete;
  ~FantomTimerRegistry() noexcept override = default;

  // PlatformTimerRegistry
  void createTimer(uint32_t timerId, double delayMs) override;
  void deleteTimer(uint32_t timerId) override;
  void createRecurringTimer(uint32_t timerId, double delayMs) override;
  void quit() override;
  void setTimerManager(std::weak_ptr<TimerManager> timerManager) override;

  // Control API (driven from JS via NativeFantom).
  void setMockEnabled(bool enabled);
  bool isMockEnabled() const noexcept;

  // Advances the virtual clock by `deltaMs`, firing every timer that becomes
  // due (in due-time order), re-arming recurring timers along the way.
  void advanceTimersByTime(double deltaMs);

  // Fires all currently pending timers until none remain (bounded to avoid
  // infinite loops with self-rescheduling/recurring timers).
  void runAllTimers();

  uint32_t getPendingTimerCount() const noexcept;

 private:
  struct Timer {
    uint32_t timerId{0};
    double dueTimeMs{0.0};
    double intervalMs{0.0};
    bool isRecurring{false};
  };

  void scheduleTimer(uint32_t timerId, double delayMs, bool isRecurring);
  void fireTimer(uint32_t timerId);

  std::weak_ptr<TimerManager> timerManager_;
  std::unordered_map<uint32_t, Timer> timers_;
  double nowMs_{0.0};
  bool mockEnabled_{false};
};

} // namespace facebook::react
