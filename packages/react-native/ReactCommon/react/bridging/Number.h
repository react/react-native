/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>

namespace facebook::react {

template <>
struct Bridging<double> {
  static double fromJs(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return value.asNumber();
  }

  static double toJs(jsi::Runtime& /*unused*/, double value) {
    return value;
  }
};

template <>
struct Bridging<float> {
  static float fromJs(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return (float)value.asNumber();
  }

  static float toJs(jsi::Runtime& /*unused*/, float value) {
    return value;
  }
};

template <>
struct Bridging<int32_t> {
  static int32_t fromJs(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return (int32_t)value.asNumber();
  }

  static int32_t toJs(jsi::Runtime& /*unused*/, int32_t value) {
    return value;
  }
};

template <>
struct Bridging<uint32_t> {
  static uint32_t fromJs(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return (uint32_t)value.asNumber();
  }

  static jsi::Value toJs(jsi::Runtime& /*unused*/, uint32_t value) {
    return double(value);
  }
};

} // namespace facebook::react
