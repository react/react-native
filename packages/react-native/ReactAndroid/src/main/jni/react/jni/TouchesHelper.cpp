/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TouchesHelper.h"

#include <stdexcept>

#include "WritableNativeArray.h"
#include "WritableNativeMap.h"

using namespace facebook::jni;

namespace facebook::react {

namespace {

// Keep in sync with the field indices in TouchesHelper.kt.
constexpr jint kPageXIndex = 0;
constexpr jint kPageYIndex = 1;
constexpr jint kLocationXIndex = 2;
constexpr jint kLocationYIndex = 3;
constexpr jint kTargetSurfaceIndex = 4;
constexpr jint kTargetIndex = 5;
constexpr jint kTimestampIndex = 6;
constexpr jint kIdentifierIndex = 7;
constexpr jint kPointerFields = 8;

folly::dynamic createTouch(const double* fields) {
  folly::dynamic touch = folly::dynamic::object();
  // NOLINTBEGIN(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  touch.insert("pageX", fields[kPageXIndex]);
  touch.insert("pageY", fields[kPageYIndex]);
  touch.insert("locationX", fields[kLocationXIndex]);
  touch.insert("locationY", fields[kLocationYIndex]);
  touch.insert("targetSurface", static_cast<int>(fields[kTargetSurfaceIndex]));
  touch.insert("target", static_cast<int>(fields[kTargetIndex]));
  touch.insert("timestamp", fields[kTimestampIndex]);
  touch.insert("identifier", fields[kIdentifierIndex]);
  // NOLINTEND(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  return touch;
}

local_ref<WritableNativeMap::jhybridobject> createTouchPayload(
    alias_ref<jclass> /*unused*/,
    alias_ref<JArrayDouble> pointerData,
    jint eventPointer,
    jint changedPointers,
    jint touchPointers) {
  auto length = static_cast<jint>(pointerData->size());
  jint pointerCount = length / kPointerFields;
  // Pointers are selected by bits of the jint masks.
  if (length % kPointerFields != 0 || pointerCount >= 32 || eventPointer < 0 ||
      eventPointer >= pointerCount) {
    throw std::invalid_argument("Invalid touch pointer data");
  }
  auto values = pointerData->getRegion(0, length);

  folly::dynamic changedTouches = folly::dynamic::array();
  folly::dynamic touches = folly::dynamic::array();
  for (jint index = 0; index < pointerCount; index++) {
    // NOLINTNEXTLINE(cppcoreguidelines-pro-bounds-pointer-arithmetic)
    const double* fields = values.get() + index * kPointerFields;
    if ((changedPointers & (1 << index)) != 0) {
      changedTouches.push_back(createTouch(fields));
    }
    if ((touchPointers & (1 << index)) != 0) {
      touches.push_back(createTouch(fields));
    }
  }

  auto jPayload = WritableNativeMap::newObjectJavaArgs();
  auto* payload = jPayload->cthis();
  // NOLINTBEGIN(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  const double* fields = values.get() + eventPointer * kPointerFields;
  payload->putDouble("pageX", fields[kPageXIndex]);
  payload->putDouble("pageY", fields[kPageYIndex]);
  payload->putDouble("locationX", fields[kLocationXIndex]);
  payload->putDouble("locationY", fields[kLocationYIndex]);
  payload->putInt(
      "targetSurface", static_cast<int>(fields[kTargetSurfaceIndex]));
  payload->putInt("target", static_cast<int>(fields[kTargetIndex]));
  payload->putDouble("timestamp", fields[kTimestampIndex]);
  payload->putDouble("identifier", fields[kIdentifierIndex]);
  // NOLINTEND(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  WritableNativeArray changedTouchesArray(std::move(changedTouches));
  payload->putNativeArray("changedTouches", &changedTouchesArray);
  WritableNativeArray touchesArray(std::move(touches));
  payload->putNativeArray("touches", &touchesArray);
  return jPayload;
}

} // namespace

void TouchesHelper::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeCreateTouchPayload", createTouchPayload),
  });
}

} // namespace facebook::react
