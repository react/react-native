/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>
#include <vector>

#include <jsi/jsi.h>
#include <react/renderer/core/EventBeat.h>
#include <react/renderer/core/EventQueueProcessor.h>
#include <react/renderer/core/RawEvent.h>
#include <react/renderer/core/StateUpdate.h>

namespace facebook::react {

/*
 * Event Queue synchronized with given Event Beat and dispatching event
 * using given Event Pipe.
 */
class EventQueue {
 public:
  /* The update mode is used to inform how to apply changes. */
  enum class UpdateMode {
    /** Apply the update off the main thread. */
    Asynchronous,
    /**
     * Apply the update on the main thread.
     * The immediate update mode will **immediately** block the executing thread
     * applying updates.
     */
    unstable_Immediate,
  };

  EventQueue(
      EventQueueProcessor eventProcessor,
      std::unique_ptr<EventBeat> eventBeat);

  /*
   * Enqueues and (probably later) dispatch a given event.
   * Can be called on any thread.
   */
  void enqueueEvent(RawEvent&& rawEvent) const;

  /*
   * Enqueues and (probably later) dispatches a given event.
   * Deletes last RawEvent from the queue if it has the same type and target.
   * Can be called on any thread.
   */
  void enqueueUniqueEvent(RawEvent&& rawEvent) const;

  /*
   * Enqueues and (probably later) dispatch a given state update.
   * Can be called on any thread.
   */
  void enqueueStateUpdate(
      StateUpdate&& stateUpdate,
      UpdateMode updateMode = UpdateMode::Asynchronous) const;

  /*
   * Experimental API exposed to support EventEmitter::experimental_flushSync.
   */
  void experimental_flushSync() const;

 protected:
  /*
   * Called on any enqueue operation.
   * Override in subclasses to trigger beat `request` and/or beat `induce`.
   * Default implementation does nothing.
   */
  void onEnqueue() const;
  void onBeat(jsi::Runtime& runtime) const;

  void flushEvents(jsi::Runtime& runtime) const;
  void flushStateUpdates() const;

  EventQueueProcessor eventProcessor_;

  const std::unique_ptr<EventBeat> eventBeat_;
  // Thread-safe, protected by `queueMutex_`.
  mutable std::vector<RawEvent> eventQueue_;
  mutable std::vector<StateUpdate> stateUpdateQueue_;
  mutable std::mutex queueMutex_;
};

} // namespace facebook::react
