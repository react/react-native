/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct MyType {};

template <typename T>
class Container {
 public:
  void push(T value);
  void pop();
};

template <>
class Container<MyType> {
 public:
  void push(MyType value);
  void pop();
};

} // namespace test
