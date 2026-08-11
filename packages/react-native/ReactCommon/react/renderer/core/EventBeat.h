/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <atomic>
#include <functional>
#include <memory>

namespace facebook::react {
class RuntimeScheduler;
}

namespace facebook::jsi {
class Runtime;
}

namespace facebook::react {
/*
 * Event Beat serves two interleaving purposes: synchronization of event queues
 * and ensuring that event dispatching happens on proper threads.
 *
 * You must set beat callback by calling `EventBeat::setBeatCallback` before
 * calling `EventBeat::request` and `EventBeat::requestSynchronous`.
 *
 * EventBeat is meant to be subclassed by platform-specific implementations.
 * The platform-specific implementation must call EventBeat::induce(). The
 * appropriate time to call induce is when the host platform events were queued
 * in the EventQueue for a given UI frame. For example, on iOS,
 * EventBeat::induce() is called before the main run loop goes to sleep. On
 * Android, EventBeat::induce() is called from Android's Choreographer.
 */
class EventBeat {
 public:
  /*
   * The concept of `Owner`
   * The purpose of `EventBeat` is handling an asynchronous callback to itself
   * which is being delivered on a different thread. That brings a challenge
   * of ensuring that the `EventBeat` object stays valid during the timeframe of
   * callback execution. The concept of Owner helps with that. The owner is a
   * shared pointer that retains (probably indirectly) the `EventBeat` object.
   * To ensure the correctness of the call, `EventBeat` retains the owner
   * weakly during executing the callback. If the pointer to the owner is
   * already null, `EventBeat` skips executing the callback. It's impossible to
   * retain itself directly or refer to the shared pointer to itself from a
   * constructor. `OwnerBox` is designed to work around this issue; it can
   * store the pointer after the creation of some other object that
   * owns an `EventBeat`.
   */
  struct OwnerBox {
    std::weak_ptr<const void> owner;
  };

  using Factory = std::function<std::unique_ptr<EventBeat>(
      std::shared_ptr<OwnerBox> ownerBox)>;

  using BeatCallback = std::function<void(jsi::Runtime& runtime)>;

  explicit EventBeat(
      std::shared_ptr<OwnerBox> ownerBox,
      RuntimeScheduler& runtimeScheduler);

  virtual ~EventBeat() = default;

  // not copyable
  EventBeat(const EventBeat& other) = delete;
  EventBeat& operator=(const EventBeat& other) = delete;

  /*
   * Communicates to the Beat that a consumer (for example EventQueue) is
   * waiting for the coming beat. A consumer must request coming beat after the
   * previous beat happened to receive a next coming one.
   *
   * Callback, that was set by `setBeatCallback`, will be dispatched to
   * JavaScript thread asynchronously via `RuntimeScheduler::scheduleWork`.
   *
   *                tick (provided by host platform)
   *   UI             │
   * thread─┬───────┬─▼──────┬─────────────────────────────▶
   *        │request│ │induce│  ┌────────────┐
   *        └───────┘ └──────┴─▶│scheduleWork│
   *                            └───────────┬┘
   *   JS                                   │
   * thread─────────────────────────────────▼─────────────┬▶
   *                                        │beat callback│
   *                                        └─────────────┘
   *
   */
  virtual void request() const;

  /*
   * Communicates to the Beat that a consumer (for example EventQueue) is
   * waiting for the coming beat. A consumer must request coming beat after the
   * previous beat happened to receive a next coming one.
   *
   * Callback, that was set by `setBeatCallback`, will be called on the thread
   * where `induce` is called synchronously via via
   * `RuntimeScheduler::executeNowOnTheSameThread`. Both threads are blocked
   * until beat callback finishes.
   *
   *                tick
   *   UI             │
   * thread─┬───────┬─▼──────┬─┬─────────────────────────┬▶
   *        │request│ │induce│ │executeNowOnTheSameThread│
   *        └───────┘ └──────┴▶├─────────────────────────┤
   *   JS                      │      beat callback      │
   * thread────────────────────┴─────────────────────────┴▶
   *                            Both JS and UI thread are
   *                            blocked.
   */
  virtual void requestSynchronous() const;

  /*
   * The callback will be executed once a consumer (for example EventQueue)
   * calls either `EventBeat::request` or `EventBeat::requestSynchronous`. The
   * callback will be executed on the proper thread.
   */
  void setBeatCallback(BeatCallback beatCallback);

  /*
   * The callback will be executed once a consumer (for example EventQueue)
   * calls either `EventBeat::request` or `EventBeat::requestSynchronous`. The
   * callback will be executed on the UI thread.
   *
   * If not set, this is a no-op and callback won't be called.
   */
  void unstable_setInduceCallback(std::function<void()> callback);

 protected:
  /*
   * Induces the next beat to happen as soon as possible.
   * Receiver might ignore the call if a beat was not requested.
   */
  void induce() const;

  BeatCallback beatCallback_;
  std::function<void()> induceCallback_;
  std::shared_ptr<OwnerBox> ownerBox_;

  /*
   * Indicates if event beat was requested to avoid redundant requests.
   */
  mutable std::atomic<bool> isEventBeatRequested_{false};

 private:
  RuntimeScheduler& runtimeScheduler_;
  mutable std::atomic<bool> isBeatCallbackScheduled_{false};
  mutable std::atomic<bool> isSynchronousRequested_{false};
};

} // namespace facebook::react
