/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/core/EventTarget.h>
#include <react/timing/primitives.h>

#include <optional>
#include <string_view>

namespace facebook::react {

using EventTag = unsigned int;
const EventTag EMPTY_EVENT_TAG = 0;

/*
 * Interface for logging discrete events (such as pointerenter/leave),
 * which can be used for implementing W3C Event Timing API standard,
 * see https://www.w3.org/TR/event-timing
 */
class EventLogger {
 public:
  virtual ~EventLogger() = default;

  /*
   * Called when an event is first created, returns and unique tag for this
   * event, which can be used to log further event processing stages.
   */
  virtual EventTag onEventStart(
      std::string_view name,
      SharedEventTarget target,
      std::optional<HighResTimeStamp> eventStartTimeStamp = std::nullopt) = 0;

  /*
   * Called when event starts getting dispatched (processed by the handlers, if
   * any)
   */
  virtual void onEventProcessingStart(EventTag tag) = 0;

  /*
   * Called when event finishes being dispatched
   */
  virtual void onEventProcessingEnd(EventTag tag) = 0;
};

} // namespace facebook::react
