/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/bridging/Base.h>
#include <react/timing/primitives.h>

namespace facebook::react {

template <>
struct Bridging<HighResTimeStamp> {
  static HighResTimeStamp fromJs(
      jsi::Runtime& /*rt*/,
      const jsi::Value& jsiValue) {
    return HighResTimeStamp::fromDOMHighResTimeStamp(jsiValue.asNumber());
  }

  static double toJs(jsi::Runtime& /*rt*/, const HighResTimeStamp& value) {
    return value.toDOMHighResTimeStamp();
  }
};

template <>
struct Bridging<HighResDuration> {
  static HighResDuration fromJs(
      jsi::Runtime& /*rt*/,
      const jsi::Value& jsiValue) {
    return HighResDuration::fromDOMHighResTimeStamp(jsiValue.asNumber());
  }

  static double toJs(jsi::Runtime& /*rt*/, const HighResDuration& value) {
    return value.toDOMHighResTimeStamp();
  }
};

} // namespace facebook::react
