/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

template <typename T>
class Base {
 public:
  Base(int value);
};

class Derived : public Base<int> {
 public:
  using BaseAlias = Base<int>;
  using Base::Base;
};

} // namespace test
