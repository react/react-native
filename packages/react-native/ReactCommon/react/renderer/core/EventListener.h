/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <shared_mutex>
#include <string>

#include <react/renderer/core/RawEvent.h>

namespace facebook::react {

/**
 * Listener for events dispatched to JS runtime.
 * Return `true` to interrupt default dispatch to JS event emitter, `false` to
 * pass through to default handlers.
 */
using EventListener = std::function<bool(const RawEvent& event)>;

class EventListenerContainer {
 public:
  /*
   * Invoke listeners in this container with the event.
   * Returns true if event was handled by the listener, false to continue
   * default dispatch.
   */
  bool willDispatchEvent(const RawEvent& event);

  void addListener(std::shared_ptr<const EventListener> listener);
  void removeListener(const std::shared_ptr<const EventListener>& listener);

 private:
  std::shared_mutex mutex_;
  std::vector<std::shared_ptr<const EventListener>> eventListeners_;
};

} // namespace facebook::react
