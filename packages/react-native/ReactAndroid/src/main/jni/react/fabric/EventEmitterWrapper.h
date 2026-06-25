/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/ReadableNativeMap.h>
#include <react/renderer/core/EventEmitter.h>

namespace facebook::react {

class Instance;

class EventEmitterWrapper : public jni::HybridClass<EventEmitterWrapper> {
 public:
  constexpr static const char *const kJavaDescriptor = "Lcom/facebook/react/fabric/events/EventEmitterWrapper;";

  static void registerNatives();

  EventEmitterWrapper(SharedEventEmitter eventEmitter) : eventEmitter(std::move(eventEmitter)) {};

  SharedEventEmitter eventEmitter;

  void dispatchEvent(std::string eventName, NativeMap *payload, int category, jlong eventTimestamp);
  void dispatchEventSynchronously(std::string eventName, NativeMap *params, jlong eventTimestamp);
  void dispatchUniqueEvent(std::string eventName, NativeMap *payload, jlong eventTimestamp);
};

} // namespace facebook::react
