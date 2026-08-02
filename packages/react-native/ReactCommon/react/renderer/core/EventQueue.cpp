/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventQueue.h"

#include <react/featureflags/ReactNativeFeatureFlags.h>
#include "EventEmitter.h"
#include "ShadowNodeFamily.h"

namespace facebook::react {

EventQueue::EventQueue(
    EventQueueProcessor eventProcessor,
    std::unique_ptr<EventBeat> eventBeat)
    : eventProcessor_(std::move(eventProcessor)),
      eventBeat_(std::move(eventBeat)) {
  eventBeat_->setBeatCallback(
      [this](jsi::Runtime& runtime) { onBeat(runtime); });
}

void EventQueue::enqueueEvent(RawEvent&& rawEvent) const {
  {
    std::scoped_lock lock(queueMutex_);

    if (rawEvent.isUnique) {
      auto repeatedEvent = eventQueue_.rend();

      for (auto it = eventQueue_.rbegin(); it != eventQueue_.rend(); ++it) {
        if (it->eventTarget == rawEvent.eventTarget) {
          // It is necessary to maintain order of different event types
          // for the same target. If the same target has event types A1, B1
          // in the event queue and event A2 occurs. A1 has to stay in the
          // queue.
          if (it->isUnique && it->type == rawEvent.type &&
              it->coalescingKey == rawEvent.coalescingKey) {
            repeatedEvent = it;
          }

          break;
        }
      }

      if (repeatedEvent == eventQueue_.rend()) {
        eventQueue_.push_back(std::move(rawEvent));
      } else {
        *repeatedEvent = std::move(rawEvent);
      }
    } else {
      eventQueue_.push_back(std::move(rawEvent));
    }
  }

  onEnqueue();
}

void EventQueue::enqueueUniqueEvent(RawEvent&& rawEvent) const {
  rawEvent.isUnique = true;
  enqueueEvent(std::move(rawEvent));
}

void EventQueue::enqueueStateUpdate(
    StateUpdate&& stateUpdate,
    UpdateMode updateMode) const {
  {
    std::scoped_lock lock(queueMutex_);
    if (!stateUpdateQueue_.empty()) {
      const auto position = stateUpdateQueue_.back();
      if (stateUpdate.family == position.family) {
        stateUpdateQueue_.pop_back();
      }
    }
    stateUpdateQueue_.push_back(std::move(stateUpdate));
  }

  if (updateMode == UpdateMode::unstable_Immediate) {
    flushStateUpdates();
  } else {
    onEnqueue();
  }
}

void EventQueue::onEnqueue() const {
  eventBeat_->request();
}

void EventQueue::experimental_flushSync() const {
  eventBeat_->requestSynchronous();
}

void EventQueue::onBeat(jsi::Runtime& runtime) const {
  flushStateUpdates();
  flushEvents(runtime);
}

void EventQueue::flushEvents(jsi::Runtime& runtime) const {
  std::vector<RawEvent> queue;

  {
    std::scoped_lock lock(queueMutex_);

    if (eventQueue_.empty()) {
      return;
    }

    queue = std::move(eventQueue_);
    eventQueue_.clear();
  }

  eventProcessor_.flushEvents(runtime, std::move(queue));
}

void EventQueue::flushStateUpdates() const {
  std::vector<StateUpdate> stateUpdateQueue;

  {
    std::scoped_lock lock(queueMutex_);

    if (stateUpdateQueue_.empty()) {
      return;
    }

    stateUpdateQueue = std::move(stateUpdateQueue_);
    stateUpdateQueue_.clear();
  }

  eventProcessor_.flushStateUpdates(std::move(stateUpdateQueue));
}

} // namespace facebook::react
