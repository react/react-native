/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PointerEvent.h"

namespace facebook::react {

jsi::Value PointerEvent::asJSIValue(jsi::Runtime& runtime) const {
  auto object = jsi::Object(runtime);
  object.setProperty(runtime, "pointerId", this->pointerId);
  object.setProperty(runtime, "pressure", this->pressure);
  object.setProperty(runtime, "pointerType", this->pointerType);
  object.setProperty(runtime, "clientX", this->clientPoint.x);
  object.setProperty(runtime, "clientY", this->clientPoint.y);
  // x/y are an alias to clientX/Y
  object.setProperty(runtime, "x", this->clientPoint.x);
  object.setProperty(runtime, "y", this->clientPoint.y);
  // since RN doesn't have a scrollable root, pageX/Y will always equal
  // clientX/Y
  object.setProperty(runtime, "pageX", this->clientPoint.x);
  object.setProperty(runtime, "pageY", this->clientPoint.y);
  object.setProperty(runtime, "screenX", this->screenPoint.x);
  object.setProperty(runtime, "screenY", this->screenPoint.y);
  object.setProperty(runtime, "offsetX", this->offsetPoint.x);
  object.setProperty(runtime, "offsetY", this->offsetPoint.y);
  object.setProperty(runtime, "width", this->width);
  object.setProperty(runtime, "height", this->height);
  object.setProperty(runtime, "tiltX", this->tiltX);
  object.setProperty(runtime, "tiltY", this->tiltY);
  object.setProperty(runtime, "detail", this->detail);
  object.setProperty(runtime, "buttons", this->buttons);
  object.setProperty(runtime, "tangentialPressure", this->tangentialPressure);
  object.setProperty(runtime, "twist", this->twist);
  object.setProperty(runtime, "ctrlKey", this->ctrlKey);
  object.setProperty(runtime, "shiftKey", this->shiftKey);
  object.setProperty(runtime, "altKey", this->altKey);
  object.setProperty(runtime, "metaKey", this->metaKey);
  object.setProperty(runtime, "isPrimary", this->isPrimary);
  object.setProperty(runtime, "button", this->button);
  return object;
}

EventPayloadType PointerEvent::getType() const {
  return EventPayloadType::PointerEvent;
}

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const PointerEvent& /*pointerEvent*/) {
  return "PointerEvent";
}

std::vector<DebugStringConvertibleObject> getDebugProps(
    const PointerEvent& pointerEvent,
    DebugStringConvertibleOptions options) {
  return {
      {.name = "pointerId",
       .value = getDebugDescription(pointerEvent.pointerId, options)},
      {.name = "pressure",
       .value = getDebugDescription(pointerEvent.pressure, options)},
      {.name = "pointerType",
       .value = getDebugDescription(pointerEvent.pointerType, options)},
      {.name = "clientPoint",
       .value = getDebugDescription(pointerEvent.clientPoint, options)},
      {.name = "screenPoint",
       .value = getDebugDescription(pointerEvent.screenPoint, options)},
      {.name = "offsetPoint",
       .value = getDebugDescription(pointerEvent.offsetPoint, options)},
      {.name = "width",
       .value = getDebugDescription(pointerEvent.width, options)},
      {.name = "height",
       .value = getDebugDescription(pointerEvent.height, options)},
      {.name = "tiltX",
       .value = getDebugDescription(pointerEvent.tiltX, options)},
      {.name = "tiltY",
       .value = getDebugDescription(pointerEvent.tiltY, options)},
      {.name = "detail",
       .value = getDebugDescription(pointerEvent.detail, options)},
      {.name = "buttons",
       .value = getDebugDescription(pointerEvent.buttons, options)},
      {.name = "tangentialPressure",
       .value = getDebugDescription(pointerEvent.tangentialPressure, options)},
      {.name = "twist",
       .value = getDebugDescription(pointerEvent.twist, options)},
      {.name = "ctrlKey",
       .value = getDebugDescription(pointerEvent.ctrlKey, options)},
      {.name = "shiftKey",
       .value = getDebugDescription(pointerEvent.shiftKey, options)},
      {.name = "altKey",
       .value = getDebugDescription(pointerEvent.altKey, options)},
      {.name = "metaKey",
       .value = getDebugDescription(pointerEvent.metaKey, options)},
      {.name = "isPrimary",
       .value = getDebugDescription(pointerEvent.isPrimary, options)},
      {.name = "button",
       .value = getDebugDescription(pointerEvent.button, options)},
      {.name = "timeStamp",
       .value = getDebugDescription(pointerEvent.timeStamp, options)},
  };
}

#endif

} // namespace facebook::react
