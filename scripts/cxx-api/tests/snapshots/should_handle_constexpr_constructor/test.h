/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Clss {
 public:
  constexpr Clss() = default;
  constexpr Clss(const Clss &) = default;
  constexpr Clss(Clss &&) = default;
  explicit constexpr Clss(int value);
};

} // namespace test
