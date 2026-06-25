/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Base {
 public:
  Base() = default;
  Base(int test);
  Base(const Base &other);
};

class Derived : public Base {
 public:
  using Base::Base;
};

} // namespace test
