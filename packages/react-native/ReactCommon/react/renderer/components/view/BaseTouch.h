/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Point.h>
#include <react/timing/primitives.h>

namespace facebook::react {

/*
 * Describes an individual touch point for a touch event.
 * See https://www.w3.org/TR/touch-events/ for more details.
 */
struct BaseTouch {
  /*
   * The coordinate of point relative to the root component in points.
   */
  Point pagePoint{};

  /*
   * The coordinate of point relative to the target component in points.
   */
  Point offsetPoint{};

  /*
   * The coordinate of point relative to the screen component in points.
   */
  Point screenPoint{};

  /*
   * An identification number for each touch point.
   */
  int identifier{0};

  /*
   * The tag of a component on which the touch point started when it was first
   * placed on the surface, even if the touch point has since moved outside the
   * interactive area of that element.
   */
  Tag target{0};

  /*
   * The force of the touch.
   */
  Float force{0.0f};

  /*
   * The time in seconds when the touch occurred or when it was last mutated.
   * @deprecated Use timeStamp instead.
   */
  Float timestamp{0.0f};

  /*
   * The time when the touch occurred.
   */
  HighResTimeStamp timeStamp{};

  /*
   * The particular implementation of `Hasher` and (especially) `Comparator`
   * make sense only when `Touch` object is used as a *key* in indexed
   * collections. Because of that they are expressed as separate classes.
   */
  struct Hasher {
    size_t operator()(const BaseTouch &touch) const
    {
      return std::hash<decltype(touch.identifier)>()(touch.identifier);
    }
  };

  struct Comparator {
    bool operator()(const BaseTouch &lhs, const BaseTouch &rhs) const
    {
      return lhs.identifier == rhs.identifier;
    }
  };
};

void setTouchPayloadOnObject(jsi::Object &object, jsi::Runtime &runtime, const BaseTouch &touch);

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const BaseTouch &touch);
std::vector<DebugStringConvertibleObject> getDebugProps(const BaseTouch &touch, DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react
