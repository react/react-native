/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <memory>

namespace facebook::react {

class TimerManager;

/**
 * This interface is implemented by each platform.
 * Responsibility: Call into some platform API to register/schedule, or delete
 * registered/scheduled timers.
 */
class PlatformTimerRegistry {
 public:
  virtual void createTimer(uint32_t timerID, double delayMS) = 0;

  virtual void deleteTimer(uint32_t timerID) = 0;

  virtual void createRecurringTimer(uint32_t timerID, double delayMS) = 0;

  virtual ~PlatformTimerRegistry() noexcept = default;

  virtual void quit() {}

  /**
   * Provides the owning TimerManager so the registry can fire due timers via
   * TimerManager::callTimer. The default is a no-op for platforms that wire the
   * TimerManager through other means.
   */
  virtual void setTimerManager(std::weak_ptr<TimerManager> /*timerManager*/) {}
};

using TimerManagerDelegate = PlatformTimerRegistry;

} // namespace facebook::react
