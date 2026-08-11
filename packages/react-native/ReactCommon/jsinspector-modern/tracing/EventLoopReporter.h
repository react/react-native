/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
#include <react/timing/primitives.h>
#endif

namespace facebook::react::jsinspector_modern::tracing {

enum class EventLoopPhase {
  Task,
  Microtasks,
};

struct EventLoopReporter {
 public:
  explicit EventLoopReporter(EventLoopPhase phase);

  EventLoopReporter(const EventLoopReporter&) = delete;
  EventLoopReporter(EventLoopReporter&&) = delete;
  EventLoopReporter& operator=(const EventLoopReporter&) = delete;
  EventLoopReporter& operator=(EventLoopReporter&&) = delete;

  ~EventLoopReporter();

 private:
#if defined(REACT_NATIVE_DEBUGGER_ENABLED)
  HighResTimeStamp startTimestamp_;
  EventLoopPhase phase_;
#endif
};

} // namespace facebook::react::jsinspector_modern::tracing
