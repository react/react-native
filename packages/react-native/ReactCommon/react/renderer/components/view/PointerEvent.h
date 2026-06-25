/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventPayload.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Point.h>
#include <react/timing/primitives.h>

namespace facebook::react {

struct PointerEvent : public EventPayload {
  /*
   * A unique identifier for the pointer causing the event.
   */
  int pointerId;
  /*
   * The normalized pressure of the pointer input in the range 0 to 1, where 0
   * and 1 represent the minimum and maximum pressure the hardware is capable of
   * detecting, respectively.
   */
  Float pressure;
  /*
   * Indicates the device type that caused the event (mouse, pen, touch, etc.)
   */
  std::string pointerType;
  /*
   * Point within the application's viewport at which the event occurred (as
   * opposed to the coordinate within the page).
   */
  Point clientPoint;
  /*
   * The X/Y coordinate of the pointer in global (screen) coordinates.
   */
  Point screenPoint;
  /*
   * The X/Y coordinate of the pointer relative to the position of the padding
   * edge of the target node.
   */
  Point offsetPoint;
  /*
   * The width (magnitude on the X axis), in CSS pixels, of the contact geometry
   * of the pointer
   */
  Float width;
  /*
   * The height (magnitude on the y axis), in CSS pixels, of the contact
   * geometry of the pointer
   */
  Float height;
  /*
   * The plane angle (in degrees, in the range of -90 to 90) between the Y–Z
   * plane and the plane containing both the pointer (e.g. pen stylus) axis and
   * the Y axis.
   */
  int tiltX;
  /*
   * The plane angle (in degrees, in the range of -90 to 90) between the X–Z
   * plane and the plane containing both the pointer (e.g. pen stylus) axis and
   * the X axis.
   */
  int tiltY;
  /*
   * Returns a long with details about the event, depending on the event type.
   */
  int detail;
  /*
   * The buttons being depressed (if any) when the mouse event was fired.
   */
  int buttons;
  /*
   * The normalized tangential pressure of the pointer input (also known as
   * barrel pressure or cylinder stress) in the range -1 to 1, where 0 is the
   * neutral position of the control.
   */
  Float tangentialPressure;
  /*
   * The clockwise rotation of the pointer (e.g. pen stylus) around its major
   * axis in degrees, with a value in the range 0 to 359.
   */
  int twist;
  /*
   * Returns true if the control key was down when the event was fired.
   */
  bool ctrlKey;
  /*
   * Returns true if the shift key was down when the event was fired.
   */
  bool shiftKey;
  /*
   * Returns true if the alt key was down when the event was fired.
   */
  bool altKey;
  /*
   * Returns true if the meta key was down when the event was fired.
   */
  bool metaKey;
  /*
   * Indicates if the pointer represents the primary pointer of this pointer
   * type.
   */
  bool isPrimary;
  /*
   * The button number that was pressed (if applicable) when the pointer event
   * was fired.
   */
  int button;
  /*
   * The time when the event occurred.
   */
  HighResTimeStamp timeStamp{};

  /*
   * EventPayload implementations
   */
  jsi::Value asJSIValue(jsi::Runtime &runtime) const override;
  EventPayloadType getType() const override;
};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const PointerEvent &pointerEvent);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const PointerEvent &pointerEvent,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
