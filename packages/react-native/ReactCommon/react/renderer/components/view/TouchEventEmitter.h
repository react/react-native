/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/PointerEvent.h>
#include <react/renderer/components/view/TouchEvent.h>
#include <react/renderer/core/EventEmitter.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/timing/primitives.h>

namespace facebook::react {

class TouchEventEmitter;

using SharedTouchEventEmitter = std::shared_ptr<const TouchEventEmitter>;

class TouchEventEmitter : public EventEmitter {
 public:
  using EventEmitter::EventEmitter;

  void onTouchStart(TouchEvent event) const;
  void onTouchMove(TouchEvent event) const;
  void onTouchEnd(TouchEvent event) const;
  void onTouchCancel(TouchEvent event) const;

  void onClick(PointerEvent event) const;
  void onPointerCancel(PointerEvent event) const;
  void onPointerDown(PointerEvent event) const;
  void onPointerMove(PointerEvent event) const;
  void onPointerUp(PointerEvent event) const;
  void onPointerEnter(PointerEvent event) const;
  void onPointerLeave(PointerEvent event) const;
  void onPointerOver(PointerEvent event) const;
  void onPointerOut(PointerEvent event) const;
  void onGotPointerCapture(PointerEvent event) const;
  void onLostPointerCapture(PointerEvent event) const;

 private:
  void dispatchTouchEvent(std::string type, TouchEvent event, RawEvent::Category category) const;
  void dispatchPointerEvent(std::string type, PointerEvent event, RawEvent::Category category) const;
};

} // namespace facebook::react
