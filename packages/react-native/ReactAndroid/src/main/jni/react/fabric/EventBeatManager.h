/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <mutex>
#include <unordered_set>

#include <fbjni/fbjni.h>

namespace facebook::react {

class EventBeatManagerObserver {
 public:
  /*
   * Called by `EventBeatManager` on the main thread signaling that this is a
   * good time to flush an event queue.
   */
  virtual void tick() const = 0;

  virtual ~EventBeatManagerObserver() noexcept = default;
};

class EventBeatManager : public jni::HybridClass<EventBeatManager> {
 public:
  constexpr static const char* const kJavaDescriptor =
      "Lcom/facebook/react/fabric/events/EventBeatManager;";

  static void registerNatives();

  /*
   * Adds (or removes) observers.
   * `EventBeatManager` does not own/retain observers; observers must overlive
   * the manager or be properly removed before deallocation.
   */
  void addObserver(const EventBeatManagerObserver& observer) const;
  void removeObserver(const EventBeatManagerObserver& observer) const;

 private:
  /*
   * Called by Java counterpart at the end of every run loop tick.
   */
  void tick();

  mutable std::unordered_set<const EventBeatManagerObserver*>
      observers_{}; // Protected by `mutex_`

  mutable std::mutex mutex_;

  static void initHybrid(jni::alias_ref<jhybridobject> jobj);
};

} // namespace facebook::react
