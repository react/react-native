/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventDispatcher.h"

#include <react/renderer/core/StateUpdate.h>

#include "EventQueue.h"
#include "RawEvent.h"

namespace facebook::react {

EventDispatcher::EventDispatcher(
    const EventQueueProcessor& eventProcessor,
    std::unique_ptr<EventBeat> eventBeat,
    StatePipe statePipe,
    std::weak_ptr<EventLogger> eventLogger)
    : eventQueue_(EventQueue(eventProcessor, std::move(eventBeat))),
      statePipe_(std::move(statePipe)),
      eventLogger_(std::move(eventLogger)) {}

void EventDispatcher::dispatchEvent(RawEvent&& rawEvent) const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }

  auto eventLogger = eventLogger_.lock();
  if (eventLogger != nullptr) {
    rawEvent.loggingTag = eventLogger->onEventStart(
        rawEvent.type, rawEvent.eventTarget, rawEvent.eventStartTimeStamp);
  }
  eventQueue_.enqueueEvent(std::move(rawEvent));
}

void EventDispatcher::experimental_flushSync(Tag tag) const {
  eventQueue_.experimental_flushSync(tag);
}

void EventDispatcher::dispatchStateUpdate(
    StateUpdate&& stateUpdate,
    EventQueue::UpdateMode updateMode) const {
  eventQueue_.enqueueStateUpdate(std::move(stateUpdate), updateMode);
}

void EventDispatcher::dispatchUniqueEvent(RawEvent&& rawEvent) const {
  // Allows the event listener to interrupt default event dispatch
  if (eventListeners_.willDispatchEvent(rawEvent)) {
    return;
  }

  eventQueue_.enqueueUniqueEvent(std::move(rawEvent));
}

void EventDispatcher::addListener(
    std::shared_ptr<const EventListener> listener) const {
  eventListeners_.addListener(std::move(listener));
}

/*
 * Removes provided event listener to the event dispatcher.
 */
void EventDispatcher::removeListener(
    const std::shared_ptr<const EventListener>& listener) const {
  eventListeners_.removeListener(listener);
}

} // namespace facebook::react
