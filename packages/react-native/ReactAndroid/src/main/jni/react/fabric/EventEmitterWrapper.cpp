/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitterWrapper.h"
#include <fbjni/fbjni.h>
#include <react/timing/primitives.h>

#include <utility>

using namespace facebook::jni;

namespace facebook::react {

namespace {

/*
 * Converts a Java timestamp (milliseconds since boot from
 * SystemClock.uptimeMillis()) to a HighResTimeStamp.
 */
HighResTimeStamp highResTimeStampFromMillis(jlong millis) {
  return HighResTimeStamp::fromChronoSteadyClockTimePoint(
      std::chrono::steady_clock::time_point(std::chrono::milliseconds(millis)));
}

} // namespace

void EventEmitterWrapper::dispatchEvent(
    std::string eventName,
    NativeMap* payload,
    int category,
    jlong eventTimestamp) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchEvent(
        std::move(eventName),
        (payload != nullptr) ? payload->consume() : folly::dynamic::object(),
        static_cast<RawEvent::Category>(category),
        highResTimeStampFromMillis(eventTimestamp));
  }
}

void EventEmitterWrapper::dispatchEventSynchronously(
    std::string eventName,
    NativeMap* params,
    jlong eventTimestamp) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->experimental_flushSync([&]() {
      eventEmitter->dispatchEvent(
          std::move(eventName),
          (params != nullptr) ? params->consume() : folly::dynamic::object(),
          RawEvent::Category::Discrete,
          highResTimeStampFromMillis(eventTimestamp));
    });
  }
}

void EventEmitterWrapper::dispatchUniqueEvent(
    std::string eventName,
    NativeMap* payload,
    jlong eventTimestamp) {
  // It is marginal, but possible for this to be constructed without a valid
  // EventEmitter. In those cases, make sure we noop/blackhole events instead of
  // crashing.
  if (eventEmitter != nullptr) {
    eventEmitter->dispatchUniqueEvent(
        std::move(eventName),
        (payload != nullptr) ? payload->consume() : folly::dynamic::object(),
        highResTimeStampFromMillis(eventTimestamp));
  }
}

void EventEmitterWrapper::registerNatives() {
  registerHybrid({
      makeNativeMethod("dispatchEvent", EventEmitterWrapper::dispatchEvent),
      makeNativeMethod(
          "dispatchUniqueEvent", EventEmitterWrapper::dispatchUniqueEvent),
      makeNativeMethod(
          "dispatchEventSynchronously",
          EventEmitterWrapper::dispatchEventSynchronously),
  });
}

} // namespace facebook::react
