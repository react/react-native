/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventQueueProcessor.h"

#include <folly/ScopeGuard.h>
#include <logger/react_native_log.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>

#include "EventEmitter.h"
#include "EventLogger.h"

namespace facebook::react {

EventQueueProcessor::EventQueueProcessor(
    EventPipe eventPipe,
    EventPipeConclusion eventPipeConclusion,
    StatePipe statePipe,
    std::weak_ptr<EventLogger> eventLogger)
    : eventPipe_(std::move(eventPipe)),
      eventPipeConclusion_(std::move(eventPipeConclusion)),
      statePipe_(std::move(statePipe)),
      eventLogger_(std::move(eventLogger)) {}

void EventQueueProcessor::flushEvents(
    jsi::Runtime& runtime,
    std::vector<RawEvent>&& events) const {
  {
    std::scoped_lock lock(EventEmitter::DispatchMutex());

    for (const auto& event : events) {
      if (event.eventTarget) {
        event.eventTarget->retain(runtime);
      }
    }
  }

  // RAII guard for the matching release() pass. If event dispatch throws (a JS
  // exception from eventPipe_, or eventPipeConclusion_), the previous code
  // skipped the release loop entirely, leaking JSI strong references. The
  // guard destructor runs on every exit path. No DispatchMutex needed for
  // release: we hold a strong pointer to each EventTarget via `events`, and
  // release() only touches runtime-thread-confined state.
  SCOPE_EXIT {
    for (const auto& event : events) {
      if (event.eventTarget) {
        event.eventTarget->release(runtime);
      }
    }
  };

  for (const auto& event : events) {
    auto reactPriority = ReactEventPriority::Default;

    if (ReactNativeFeatureFlags::
            fixMappingOfEventPrioritiesBetweenFabricAndReact()) {
      reactPriority = [&]() {
        switch (event.category) {
          case RawEvent::Category::Discrete:
            return ReactEventPriority::Discrete;
          case RawEvent::Category::ContinuousStart:
            hasContinuousEventStarted_ = true;
            return ReactEventPriority::Discrete;
          case RawEvent::Category::ContinuousEnd:
            hasContinuousEventStarted_ = false;
            return ReactEventPriority::Discrete;
          case RawEvent::Category::Continuous:
            return ReactEventPriority::Continuous;
          case RawEvent::Category::Idle:
            return ReactEventPriority::Idle;
          case RawEvent::Category::Unspecified:
            return hasContinuousEventStarted_ ? ReactEventPriority::Continuous
                                              : ReactEventPriority::Default;
        }
        return ReactEventPriority::Default;
      }();
    } else {
      if (event.category == RawEvent::Category::ContinuousEnd) {
        hasContinuousEventStarted_ = false;
      }

      reactPriority = hasContinuousEventStarted_ ? ReactEventPriority::Default
                                                 : ReactEventPriority::Discrete;

      if (event.category == RawEvent::Category::Continuous) {
        reactPriority = ReactEventPriority::Default;
      }

      if (event.category == RawEvent::Category::Discrete) {
        reactPriority = ReactEventPriority::Discrete;
      }
    }

    auto eventLogger = eventLogger_.lock();
    if (eventLogger != nullptr) {
      eventLogger->onEventProcessingStart(event.loggingTag);
    }

    if (event.eventPayload == nullptr) {
      react_native_log_error(
          "EventQueueProcessor: Unexpected null event payload");
      continue;
    }

    eventPipe_(
        runtime,
        event.eventTarget.get(),
        event.type,
        reactPriority,
        *event.eventPayload,
        event.eventStartTimeStamp);

    if (eventLogger != nullptr) {
      eventLogger->onEventProcessingEnd(event.loggingTag);
    }

    if (event.category == RawEvent::Category::ContinuousStart) {
      hasContinuousEventStarted_ = true;
    }
  }

  // We only run the "Conclusion" once per event group when batched.
  eventPipeConclusion_(runtime);

  // EventTarget release happens in the SCOPE_EXIT above.
}

void EventQueueProcessor::flushStateUpdates(
    std::vector<StateUpdate>&& states) const {
  for (const auto& stateUpdate : states) {
    statePipe_(stateUpdate);
  }
}

} // namespace facebook::react
