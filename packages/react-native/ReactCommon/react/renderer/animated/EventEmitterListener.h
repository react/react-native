/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <shared_mutex>

#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react {

/**
 * Listener for events dispatched to JS runtime.
 * Return `true` to interrupt default dispatch to JS event emitter, `false` to
 * pass through to default handlers.
 */

template <typename... TArgs>
using EventListenerT = std::function<bool(TArgs...)>;

template <typename... TArgs>
class EventListenerContainerT {
 public:
  /*
   * Invoke listeners in this container with the event.
   * Returns true if event was handled by the listener, false to continue
   * default dispatch.
   */
  bool willDispatchEvent(TArgs... args) {
    std::shared_lock lock(mutex_);
    bool handled = false;
    for (const auto& listener : eventListeners_) {
      handled = (*listener)(args...);
      if (handled) {
        break;
      }
    }
    return handled;
  }

  void addListener(std::shared_ptr<const EventListenerT<TArgs...>> listener) {
    std::unique_lock lock(mutex_);
    eventListeners_.push_back(std::move(listener));
  }

  void removeListener(
      const std::shared_ptr<const EventListenerT<TArgs...>>& listener) {
    std::unique_lock lock(mutex_);
    auto it =
        std::find(eventListeners_.begin(), eventListeners_.end(), listener);
    if (it != eventListeners_.end()) {
      eventListeners_.erase(it);
    }
  }

 private:
  std::shared_mutex mutex_;
  std::vector<std::shared_ptr<const EventListenerT<TArgs...>>> eventListeners_;
};

using EventEmitterListener =
    EventListenerT<Tag, const std::string&, const EventPayload&>;
using EventEmitterListenerContainer =
    EventListenerContainerT<Tag, const std::string&, const EventPayload&>;

} // namespace facebook::react
