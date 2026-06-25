/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

#include <react/renderer/core/EventLogger.h>
#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/EventTarget.h>
#include <react/timing/primitives.h>

namespace facebook::react {

class ShadowNodeFamily;

/*
 * Represents ready-to-dispatch event object.
 */
struct RawEvent {
  /*
   * Defines category of a native platform event. This is used to deduce types
   * of events for Concurrent Mode.
   * This enum is duplicated for JNI access in `EventCategoryDef.java`, keep in
   * sync.
   */
  enum class Category {
    /*
     * Start of a continuous event. To be used with touchStart.
     */
    ContinuousStart = 0,

    /*
     * End of a continuous event. To be used with touchEnd.
     */
    ContinuousEnd = 1,

    /*
     * Priority for this event will be determined from other events in the
     * queue. If it is triggered by continuous event, its priority will be
     * default. If it is not triggered by continuous event, its priority will be
     * discrete.
     */
    Unspecified = 2,

    /*
     * Forces discrete type for the event. Regardless if continuous event is
     * ongoing.
     */
    Discrete = 3,

    /*
     * Forces continuous type for the event. Regardless if continuous event
     * isn't ongoing.
     */
    Continuous = 4,

    /*
     * Priority for events that can be processed in idle times or in the
     * background.
     */
    Idle = 5,
  };

  RawEvent(
      std::string type,
      SharedEventPayload eventPayload,
      SharedEventTarget eventTarget,
      std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily,
      Category category = Category::Unspecified,
      bool isUnique = false,
      HighResTimeStamp eventStartTimeStamp = HighResTimeStamp::now());

  std::string type;
  SharedEventPayload eventPayload;
  SharedEventTarget eventTarget;
  std::weak_ptr<const ShadowNodeFamily> shadowNodeFamily;
  Category category;
  EventTag loggingTag{0};
  bool isUnique{false};

  // The timestamp for the event start time. This defaults to the current
  // time if not specified by the client (e.g., when MotionEvent was triggered
  // on the Android native side).
  HighResTimeStamp eventStartTimeStamp;
};

} // namespace facebook::react
