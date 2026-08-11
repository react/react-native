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
struct Bridging<bool> {
  static bool fromJs(jsi::Runtime& /*unused*/, const jsi::Value& value) {
    return value.asBool();
  }

  static bool toJs(jsi::Runtime& /*unused*/, bool value) {
    return value;
  }
};

} // namespace facebook::react
