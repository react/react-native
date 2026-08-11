/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <jsi/jsi.h>
#include <react/renderer/core/EventPipe.h>
#include <react/renderer/core/RawEvent.h>
#include <react/renderer/core/StatePipe.h>
#include <react/renderer/core/StateUpdate.h>

namespace facebook::react {

class EventQueueProcessor {
 public:
  EventQueueProcessor(
      EventPipe eventPipe,
      EventPipeConclusion eventPipeConclusion,
      StatePipe statePipe,
      std::weak_ptr<EventLogger> eventLogger);

  void flushEvents(jsi::Runtime& runtime, std::vector<RawEvent>&& events) const;
  void flushStateUpdates(std::vector<StateUpdate>&& states) const;

 private:
  const EventPipe eventPipe_;
  const EventPipeConclusion eventPipeConclusion_;
  const StatePipe statePipe_;
  const std::weak_ptr<EventLogger> eventLogger_;

  mutable bool hasContinuousEventStarted_{false};
};

} // namespace facebook::react
