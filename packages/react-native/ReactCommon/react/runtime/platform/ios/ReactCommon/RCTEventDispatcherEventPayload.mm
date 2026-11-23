/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTEventDispatcherEventPayload.h"

#import <React/RCTLog.h>

namespace facebook::react {

RCTEventDispatcherEventPayload::RCTEventDispatcherEventPayload(id<RCTEvent> event) : event_(event) {}

jsi::Value RCTEventDispatcherEventPayload::asJSIValue(jsi::Runtime & /*runtime*/) const
{
  // RCTInstance passes this payload only to the C++ listeners in
  // `RCTEventDispatcherListeners`, which read values with extractValue(). JS
  // receives these events separately, so reaching here means a listener started
  // forwarding it to JS.
  RCTLogError(@"RCTEventDispatcherEventPayload cannot be converted to a JS value");
  return jsi::Value::null();
}

EventPayloadType RCTEventDispatcherEventPayload::getType() const
{
  return EventPayloadType::ValueFactory;
}

std::optional<double> RCTEventDispatcherEventPayload::extractValue(const std::vector<std::string> &path) const
{
  id value = body();
  for (const auto &key : path) {
    if ([value isKindOfClass:[NSDictionary class]]) {
      value = ((NSDictionary *)value)[@(key.c_str())];
    } else if ([value isKindOfClass:[NSArray class]]) {
      char *end = nullptr;
      auto index = std::strtoul(key.c_str(), &end, 10);
      if (key.empty() || *end != '\0' || index >= ((NSArray *)value).count) {
        return std::nullopt;
      }
      value = ((NSArray *)value)[index];
    } else {
      return std::nullopt;
    }
  }
  if ([value isKindOfClass:[NSNumber class]]) {
    return [value doubleValue];
  }
  return std::nullopt;
}

id RCTEventDispatcherEventPayload::body() const
{
  // Component events (`+moduleDotMethod` is `RCTEventEmitter.receiveEvent`)
  // carry `@[viewTag, eventName, body]`; RCTInstance forwards only those. Other
  // events, e.g. touches (`@[eventName, touches, changedIndexes]`), lay out
  // their arguments differently.
  NSArray *arguments = event_.arguments;
  return arguments.count > 2 ? arguments[2] : nil;
}

} // namespace facebook::react
