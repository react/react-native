/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/utils/toLower.h>
#include <string_view>

namespace facebook::react {

/**
 * constexpr check for case insensitive equality of two strings.
 */
constexpr bool iequals(std::string_view a, std::string_view b) {
  if (a.size() != b.size()) {
    return false;
  }

  for (size_t i = 0; i < a.size(); i++) {
    if (toLower(a[i]) != toLower(b[i])) {
      return false;
    }
  }

  return true;
}

} // namespace facebook::react
