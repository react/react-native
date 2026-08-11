/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

namespace facebook::react {

// https://www.w3.org/TR/compositing-1/#isolation
enum class Isolation {
  Auto,
  Isolate,
};

inline std::optional<Isolation> isolationFromString(
    std::string_view isolationSetting) {
  if (isolationSetting == "auto") {
    return Isolation::Auto;
  } else if (isolationSetting == "isolate") {
    return Isolation::Isolate;
  } else {
    return std::nullopt;
  }
}
} // namespace facebook::react
