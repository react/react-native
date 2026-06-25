/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "EventEmitter.h"

#include <cxxreact/TraceSection.h>
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/core/DynamicEventPayload.h>
#include <react/renderer/core/RawEvent.h>

namespace facebook::react {
static bool hasPrefix(const std::string& str, const std::string& prefix) {
  return str.compare(0, prefix.length(), prefix) == 0;
}

// TODO(T29874519): Get rid of "top" prefix once and for all.
/*
 * Replaces "on" with "top" if present. Or capitalizes the first letter and
 * adds "top" prefix. E.g. "eventName" becomes "topEventName", "onEventName"
 * also becomes "topEventName".
 */
/* static */ std::string EventEmitter::normalizeEventType(std::string type) {
  auto prefixedType = std::move(type);
  if (facebook::react::hasPrefix(prefixedType, "top")) {
    return prefixedType;
  }
  if (facebook::react::hasPrefix(prefixedType, "on")) {
    return "top" + prefixedType.substr(2);
  }
  prefixedType[0] = static_cast<char>(toupper(prefixedType[0]));
  return "top" + prefixedType;
}

std::mutex& EventEmitter::DispatchMutex() {
  static std::mutex mutex;
  return mutex;
}

ValueFactory EventEmitter::defaultPayloadFactory() {
  static auto payloadFactory =
      ValueFactory{[](jsi::Runtime& runtime) { return jsi::Object(runtime); }};
  return payloadFactory;
}

EventEmitter::EventEmitter(
    SharedEventTarget eventTarget,
    EventDispatcher::Weak eventDispatcher)
    : eventTarget_(std::move(eventTarget)),
      eventDispatcher_(std::move(eventDispatcher)) {}

void EventEmitter::dispatchEvent(
    std::string type,
    folly::dynamic&& payload,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      DynamicEventPayload::create(std::move(payload)),
      category);
}

void EventEmitter::dispatchEvent(
    std::string type,
    folly::dynamic&& payload,
    RawEvent::Category category,
    HighResTimeStamp eventTimestamp) const {
  dispatchEvent(
      std::move(type),
      DynamicEventPayload::create(std::move(payload)),
      category,
      eventTimestamp);
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    folly::dynamic&& payload) const {
  dispatchUniqueEvent(
      std::move(type), DynamicEventPayload::create(std::move(payload)));
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    folly::dynamic&& payload,
    HighResTimeStamp eventTimestamp) const {
  dispatchUniqueEvent(
      std::move(type),
      DynamicEventPayload::create(std::move(payload)),
      eventTimestamp);
}

void EventEmitter::dispatchEvent(
    std::string type,
    const ValueFactory& payloadFactory,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory),
      category);
}

void EventEmitter::dispatchEvent(
    std::string type,
    const ValueFactory& payloadFactory,
    RawEvent::Category category,
    HighResTimeStamp eventTimestamp) const {
  dispatchEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory),
      category,
      eventTimestamp);
}

void EventEmitter::dispatchEvent(
    std::string type,
    SharedEventPayload payload,
    RawEvent::Category category) const {
  dispatchEvent(
      std::move(type), std::move(payload), category, HighResTimeStamp::now());
}

void EventEmitter::dispatchEvent(
    std::string type,
    SharedEventPayload payload,
    RawEvent::Category category,
    HighResTimeStamp eventTimestamp) const {
  TraceSection s("EventEmitter::dispatchEvent", "type", type);

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  SharedEventTarget eventTarget;
  std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily;
  {
    std::scoped_lock lock(DispatchMutex());
    eventTarget = eventTarget_;
    shadowNodeFamily = shadowNodeFamily_;
  }

  eventDispatcher->dispatchEvent(RawEvent(
      normalizeEventType(std::move(type)),
      std::move(payload),
      std::move(eventTarget),
      std::move(shadowNodeFamily),
      category,
      false,
      eventTimestamp));
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const ValueFactory& payloadFactory) const {
  dispatchUniqueEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory));
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    const ValueFactory& payloadFactory,
    HighResTimeStamp eventTimestamp) const {
  dispatchUniqueEvent(
      std::move(type),
      std::make_shared<ValueFactoryEventPayload>(payloadFactory),
      eventTimestamp);
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    SharedEventPayload payload) const {
  dispatchUniqueEvent(
      std::move(type), std::move(payload), HighResTimeStamp::now());
}

void EventEmitter::dispatchUniqueEvent(
    std::string type,
    SharedEventPayload payload,
    HighResTimeStamp eventTimestamp) const {
  TraceSection s("EventEmitter::dispatchUniqueEvent");

  auto eventDispatcher = eventDispatcher_.lock();
  if (!eventDispatcher) {
    return;
  }

  SharedEventTarget eventTarget;
  std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily;
  {
    std::scoped_lock lock(DispatchMutex());
    eventTarget = eventTarget_;
    shadowNodeFamily = shadowNodeFamily_;
  }

  eventDispatcher->dispatchUniqueEvent(RawEvent(
      normalizeEventType(std::move(type)),
      std::move(payload),
      std::move(eventTarget),
      std::move(shadowNodeFamily),
      RawEvent::Category::Continuous,
      true,
      eventTimestamp));
}

void EventEmitter::setEnabled(bool enabled) {
  enableCounter_ += enabled ? 1 : -1;

  bool shouldBeEnabled = enableCounter_ > 0;
  if (isEnabled_ != shouldBeEnabled) {
    isEnabled_ = shouldBeEnabled;
    if (eventTarget_) {
      eventTarget_->setEnabled(isEnabled_);
    }
  }

  // Note: Initially, the state of `eventTarget_` and the value
  // `enableCounter_` is mismatched intentionally (it's `non-null` and `0`
  // accordingly). We need this to support an initial nebula state where the
  // event target must be retained without any associated mounted node.
  bool shouldBeRetained = enableCounter_ > 0;
  if (shouldBeRetained != (eventTarget_ != nullptr)) {
    if (!shouldBeRetained) {
      eventTarget_.reset();
    }
  }
}

void EventEmitter::setShadowNodeFamily(
    std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily) {
  shadowNodeFamily_ = std::move(shadowNodeFamily);
}

const SharedEventTarget& EventEmitter::getEventTarget() const {
  return eventTarget_;
}

} // namespace facebook::react
