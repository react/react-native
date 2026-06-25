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
class Wrapper {
 public:
  void set(T value);
  T get();
};

template <>
class Wrapper<MyType *> {
 public:
  void set(MyType *value);
  MyType *get();
};

} // namespace test
