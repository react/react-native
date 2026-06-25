/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>

namespace test {

struct AccessibilityState {
  bool disabled{false};
  bool selected{false};
  bool busy{false};
  std::optional<bool> expanded{std::nullopt};
  enum CheckedState { Unchecked, Checked, Mixed, None };
  CheckedState checked{CheckedState::None};
};

} // namespace test
