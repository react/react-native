/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#import <React/RCTEventDispatcherProtocol.h>
#import <react/renderer/core/EventPayload.h>

namespace facebook::react {

/*
 * Event payload for events native code delivers to RCTEventDispatcher
 * observers (`notifyObserversOfEvent:` or the
 * `RCTNotifyEventDispatcherObserversOfEvent_DEPRECATED` notification) rather
 * than through a Fabric event emitter. Some libraries send events this way so
 * that native-driven Animated.event mappings receive values their Fabric event
 * payloads cannot provide to C++.
 *
 * RCTInstance wraps each component RCTEvent (arguments
 * `@[viewTag, eventName, body]`) in this payload and passes it to the C++
 * listeners in `RCTEventDispatcherListeners`, which C++ Native Animated reads
 * with extractValue(). Values are read from the `NSDictionary` body on demand,
 * so events that no listener reads are not converted.
 *
 * Only C++ listeners receive it; JS receives these events separately, so it is
 * never dispatched to JS.
 */
class RCTEventDispatcherEventPayload : public EventPayload {
 public:
  explicit RCTEventDispatcherEventPayload(id<RCTEvent> event);

  jsi::Value asJSIValue(jsi::Runtime &runtime) const override;
  EventPayloadType getType() const override;
  std::optional<double> extractValue(const std::vector<std::string> &path) const override;

 private:
  id body() const;

  id<RCTEvent> event_;
};

} // namespace facebook::react
