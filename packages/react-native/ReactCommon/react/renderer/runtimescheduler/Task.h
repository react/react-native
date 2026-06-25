/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/SchedulerPriority.h>
#include <jsi/jsi.h>
#include <react/timing/primitives.h>

#include <cstdint>
#include <optional>
#include <variant>

namespace facebook::react {

#ifndef RCT_REMOVE_LEGACY_ARCH
class RuntimeScheduler_Legacy;
#endif
class RuntimeScheduler_Modern;
class TaskPriorityComparer;

using RawCallback = std::function<void(jsi::Runtime &)>;

struct Task final : public jsi::NativeState {
  Task(SchedulerPriority priority, jsi::Function &&callback, HighResTimeStamp expirationTime);

  Task(SchedulerPriority priority, RawCallback &&callback, HighResTimeStamp expirationTime);

 private:
#ifndef RCT_REMOVE_LEGACY_ARCH
  friend RuntimeScheduler_Legacy;
#endif
  friend RuntimeScheduler_Modern;
  friend TaskPriorityComparer;

  SchedulerPriority priority;
  std::optional<std::variant<jsi::Function, RawCallback>> callback;
  HighResTimeStamp expirationTime;
  uint64_t id;

  jsi::Value execute(jsi::Runtime &runtime, bool didUserCallbackTimeout);
};

class TaskPriorityComparer {
 public:
  inline bool operator()(const std::shared_ptr<Task> &lhs, const std::shared_ptr<Task> &rhs)
  {
    return lhs->expirationTime > rhs->expirationTime;
  }
};

} // namespace facebook::react
