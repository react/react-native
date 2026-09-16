/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <ReactCommon/RuntimeExecutor.h>
#include <unordered_map>
#include <vector>

#include "PlatformTimerRegistry.h"

namespace facebook::react {

using TimerHandle = int;

enum class TimerSource { Unknown, SetTimeout, SetInterval, RequestAnimationFrame };

/*
 * Wraps a jsi::Function to make it copyable so we can pass it into a lambda.
 */
struct TimerCallback {
  TimerCallback(
      jsi::Function callback,
      std::vector<jsi::Value> args,
      bool repeat,
      TimerSource source = TimerSource::Unknown)
      : callback_(std::move(callback)), args_(std::move(args)), repeat(repeat), source(source)
  {
  }

  void invoke(jsi::Runtime &runtime)
  {
    callback_.call(runtime, args_.data(), args_.size());
  }

  jsi::Function callback_;
  const std::vector<jsi::Value> args_;
  bool repeat;
  TimerSource source;
};

class TimerManager {
 public:
  explicit TimerManager(std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry) noexcept;
  TimerManager(const TimerManager &) = delete;
  TimerManager(TimerManager &&) = delete;
  TimerManager &operator=(const TimerManager &) = delete;
  TimerManager &operator=(TimerManager &&) = delete;
  ~TimerManager() noexcept;

  void setRuntimeExecutor(RuntimeExecutor runtimeExecutor) noexcept;

  void callTimer(TimerHandle handle);

  void attachGlobals(jsi::Runtime &runtime);

  void quit();

 private:
  TimerHandle createTimer(
      jsi::Function &&callback,
      std::vector<jsi::Value> &&args,
      double delay,
      TimerSource source = TimerSource::Unknown);

  void deleteTimer(jsi::Runtime &runtime, TimerHandle handle);

  TimerHandle createRecurringTimer(
      jsi::Function &&callback,
      std::vector<jsi::Value> &&args,
      double delay,
      TimerSource source = TimerSource::Unknown);

  void deleteRecurringTimer(jsi::Runtime &runtime, TimerHandle handle);

  RuntimeExecutor runtimeExecutor_;
  std::unique_ptr<PlatformTimerRegistry> platformTimerRegistry_;

  // A map (id => callback func) of the currently active JS timers
  std::unordered_map<TimerHandle, TimerCallback> timers_;

  // Each timeout that is registered on this queue gets a sequential id.  This
  // is the global count from which those are assigned.
  // As per WHATWG HTML 8.6.1 (Timers) ids must be greater than zero, i.e. start
  // at 1
  TimerHandle timerIndex_{1};
};

} // namespace facebook::react
