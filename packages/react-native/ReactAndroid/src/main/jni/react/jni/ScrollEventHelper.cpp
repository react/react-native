/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollEventHelper.h"

#include <stdexcept>

#include "WritableNativeMap.h"

using namespace facebook::jni;

namespace facebook::react {

namespace {

// Keep in sync with the field indices in ScrollEventHelper.kt.
constexpr jint kContentOffsetXIndex = 0;
constexpr jint kContentOffsetYIndex = 1;
constexpr jint kContentWidthIndex = 2;
constexpr jint kContentHeightIndex = 3;
constexpr jint kLayoutWidthIndex = 4;
constexpr jint kLayoutHeightIndex = 5;
constexpr jint kVelocityXIndex = 6;
constexpr jint kVelocityYIndex = 7;
constexpr jint kTimestampIndex = 8;
constexpr jint kFields = 9;

local_ref<WritableNativeMap::jhybridobject> createScrollPayload(
    alias_ref<jclass> /*unused*/,
    alias_ref<JArrayDouble> data,
    jint target,
    jboolean responderIgnoreScroll) {
  if (data->size() != kFields) {
    throw std::invalid_argument("Invalid scroll event data");
  }
  auto values = data->getRegion(0, kFields);
  const double* fields = values.get();

  auto jPayload = WritableNativeMap::newObjectJavaArgs();
  auto* payload = jPayload->cthis();
  // NOLINTBEGIN(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  WritableNativeMap contentInset(
      folly::dynamic::object("top", 0.0)("bottom", 0.0)("left", 0.0)(
          "right", 0.0));
  payload->putNativeMap("contentInset", &contentInset);
  WritableNativeMap contentOffset(
      folly::dynamic::object("x", fields[kContentOffsetXIndex])(
          "y", fields[kContentOffsetYIndex]));
  payload->putNativeMap("contentOffset", &contentOffset);
  WritableNativeMap contentSize(
      folly::dynamic::object("width", fields[kContentWidthIndex])(
          "height", fields[kContentHeightIndex]));
  payload->putNativeMap("contentSize", &contentSize);
  WritableNativeMap layoutMeasurement(
      folly::dynamic::object("width", fields[kLayoutWidthIndex])(
          "height", fields[kLayoutHeightIndex]));
  payload->putNativeMap("layoutMeasurement", &layoutMeasurement);
  WritableNativeMap velocity(
      folly::dynamic::object("x", fields[kVelocityXIndex])(
          "y", fields[kVelocityYIndex]));
  payload->putNativeMap("velocity", &velocity);
  payload->putInt("target", target);
  payload->putDouble("timestamp", fields[kTimestampIndex]);
  // NOLINTEND(cppcoreguidelines-pro-bounds-pointer-arithmetic)
  payload->putBoolean("responderIgnoreScroll", responderIgnoreScroll != 0u);
  return jPayload;
}

} // namespace

void ScrollEventHelper::registerNatives() {
  javaClassLocal()->registerNatives({
      makeNativeMethod("nativeCreateScrollPayload", createScrollPayload),
  });
}

} // namespace facebook::react
