/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <mutex>

#include <folly/dynamic.h>
#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/EventTarget.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/core/ValueFactoryEventPayload.h>
#include <react/timing/primitives.h>

namespace facebook::react {

class EventEmitter;

using SharedEventEmitter = std::shared_ptr<EventEmitter>;

/*
 * Base class for all particular typed event handlers.
 * Stores a pointer to `EventTarget` identifying a particular component and
 * a weak pointer to `EventDispatcher` which is responsible for delivering the
 * event.
 */
class EventEmitter {
 public:
  using Shared = std::shared_ptr<EventEmitter>;

  static std::string normalizeEventType(std::string type);

  static std::mutex &DispatchMutex();

  static ValueFactory defaultPayloadFactory();

  EventEmitter(SharedEventTarget eventTarget, EventDispatcher::Weak eventDispatcher);

  virtual ~EventEmitter() = default;

  /*
   * Enables/disables event emitter.
   * Enabled event emitter retains a pointer to `eventTarget` strongly (as
   * `std::shared_ptr`) whereas disabled one don't.
   * Enabled/disabled state is also proxied to `eventTarget` where it indicates
   * a possibility to extract JSI value from it.
   * The enable state is additive; a number of `enable` calls should be equal to
   * a number of `disable` calls to release the event target.
   * `DispatchMutex` must be acquired before calling.
   */
  void setEnabled(bool enabled);

  /*
   * Sets a weak reference to the cooresponding ShadowNodeFamily
   */
  void setShadowNodeFamily(std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily);

  const SharedEventTarget &getEventTarget() const;

  /*
   * Experimental API that will change in the future.
   */
  template <typename Lambda>
  void experimental_flushSync(Lambda syncFunc) const
  {
    auto eventDispatcher = eventDispatcher_.lock();
    if (!eventDispatcher) {
      return;
    }

    syncFunc();
    eventDispatcher->experimental_flushSync();
  }

  /*
   * Initiates an event delivery process.
   * Is used by particular subclasses only.
   */
  void dispatchEvent(
      std::string type,
      const ValueFactory &payloadFactory = EventEmitter::defaultPayloadFactory(),
      RawEvent::Category category = RawEvent::Category::Unspecified) const;

  void dispatchEvent(
      std::string type,
      const ValueFactory &payloadFactory,
      RawEvent::Category category,
      HighResTimeStamp eventTimestamp) const;

  void dispatchEvent(
      std::string type,
      folly::dynamic &&payload,
      RawEvent::Category category = RawEvent::Category::Unspecified) const;

  void dispatchEvent(
      std::string type,
      SharedEventPayload payload,
      RawEvent::Category category = RawEvent::Category::Unspecified) const;

  void dispatchEvent(
      std::string type,
      folly::dynamic &&payload,
      RawEvent::Category category,
      HighResTimeStamp eventTimestamp) const;

  void dispatchEvent(
      std::string type,
      SharedEventPayload payload,
      RawEvent::Category category,
      HighResTimeStamp eventTimestamp) const;

  void dispatchUniqueEvent(std::string type, folly::dynamic &&payload) const;

  void dispatchUniqueEvent(std::string type, const ValueFactory &payloadFactory = EventEmitter::defaultPayloadFactory())
      const;

  void dispatchUniqueEvent(std::string type, const ValueFactory &payloadFactory, HighResTimeStamp eventTimestamp) const;

  void dispatchUniqueEvent(std::string type, SharedEventPayload payload) const;

  void dispatchUniqueEvent(std::string type, folly::dynamic &&payload, HighResTimeStamp eventTimestamp) const;

  void dispatchUniqueEvent(std::string type, SharedEventPayload payload, HighResTimeStamp eventTimestamp) const;

 private:
  friend class UIManagerBinding;

  SharedEventTarget eventTarget_;
  std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily_;

  EventDispatcher::Weak eventDispatcher_;
  int enableCounter_{0};
  bool isEnabled_{false};
};

} // namespace facebook::react
