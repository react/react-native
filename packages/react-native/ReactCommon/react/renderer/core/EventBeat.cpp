/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventBeat.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/runtimescheduler/RuntimeScheduler.h>
#include <utility>

namespace facebook::react {

EventBeat::EventBeat(
    std::shared_ptr<OwnerBox> ownerBox,
    RuntimeScheduler& runtimeScheduler)
    : ownerBox_(std::move(ownerBox)), runtimeScheduler_(runtimeScheduler) {}

void EventBeat::request() const {
  react_native_assert(
      beatCallback_ &&
      "Unexpected state: EventBeat::setBeatCallback was not called before EventBeat::request.");
  isEventBeatRequested_ = true;
}

void EventBeat::requestSynchronous() const {
  react_native_assert(
      beatCallback_ &&
      "Unexpected state: EventBeat::setBeatCallback was not called before EventBeat::requestSynchronous.");
  isSynchronousRequested_ = true;
  request();
}

void EventBeat::setBeatCallback(BeatCallback beatCallback) {
  beatCallback_ = std::move(beatCallback);
}

void EventBeat::unstable_setInduceCallback(std::function<void()> callback) {
  induceCallback_ = std::move(callback);
}

void EventBeat::induce() const {
  if (!isEventBeatRequested_) {
    return;
  }

  if (induceCallback_) {
    induceCallback_();
  }

  isEventBeatRequested_ = false;

  if (isBeatCallbackScheduled_) {
    // An asynchronous beat is already scheduled but has not run yet. A
    // synchronous request must not be stranded behind it (it would silently
    // lose its this-frame guarantee, and the leftover flag would make an
    // unrelated later beat blocking), so it proceeds and processes the queue
    // now; the already scheduled beat will simply find an empty queue.
    if (!isSynchronousRequested_) {
      return;
    }
  }

  isBeatCallbackScheduled_ = true;

  auto beat = std::function<void(jsi::Runtime&)>(
      [this, ownerBox = ownerBox_](jsi::Runtime& runtime) {
        auto owner = ownerBox->owner.lock();
        if (!owner) {
          return;
        }

        isBeatCallbackScheduled_ = false;
        if (beatCallback_) {
          beatCallback_(runtime);
        }
      });

  if (isSynchronousRequested_) {
    isSynchronousRequested_ = false;
    runtimeScheduler_.executeNowOnTheSameThread(std::move(beat));
  } else {
    runtimeScheduler_.scheduleWork(std::move(beat));
  }
}

} // namespace facebook::react
