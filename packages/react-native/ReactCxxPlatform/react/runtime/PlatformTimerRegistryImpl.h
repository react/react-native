/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/runtime/PlatformTimerRegistry.h>
#include <react/runtime/TimerManager.h>
#include <react/threading/TaskDispatchThread.h>
#include <cstdint>
#include <mutex>
#include <unordered_map>

namespace facebook::react {

class PlatformTimerRegistryImpl : public PlatformTimerRegistry {
 public:
  PlatformTimerRegistryImpl() noexcept = default;
  PlatformTimerRegistryImpl(const PlatformTimerRegistryImpl &) = delete;
  PlatformTimerRegistryImpl(PlatformTimerRegistryImpl &&) = delete;
  PlatformTimerRegistryImpl &operator=(const PlatformTimerRegistryImpl &) = delete;
  PlatformTimerRegistryImpl &operator=(PlatformTimerRegistryImpl &&) = delete;
  ~PlatformTimerRegistryImpl() noexcept override = default;

  void createTimer(uint32_t timerId, double delayMs) override;

  void deleteTimer(uint32_t timerId) override;

  void createRecurringTimer(uint32_t timerID, double delayMs) override;

  void setTimerManager(std::weak_ptr<TimerManager> timerManager) override;

  void quit() override;

 private:
  struct Timer {
    uint32_t timerId{0};
    double durationMs{0.0};
    bool isRecurring{false};
  };

  TaskDispatchThread taskDispatchThread_{"PlatformTimerRegistry"};
  std::weak_ptr<TimerManager> timerManager_;
  std::unordered_map<uint32_t, Timer> timers_;
  std::mutex timersMutex_;

  void createTimerInternal(uint32_t timerID, double delayMs, bool isRecurring = false);

  void startTimer(uint32_t timerId, double delayMs);
};

} // namespace facebook::react
