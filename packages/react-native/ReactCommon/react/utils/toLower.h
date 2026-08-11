/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook::react {

/**
 * constexpr version of tolower
 */
constexpr char toLower(char c) {
  if (c >= 'A' && c <= 'Z') {
    return static_cast<char>(c + 32);
  }
  return c;
}

} // namespace facebook::react
