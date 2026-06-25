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
  T value;
};

template <typename T = int>
class Derived : public Base<T> {};

} // namespace test
