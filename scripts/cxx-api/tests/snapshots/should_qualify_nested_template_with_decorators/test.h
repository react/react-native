/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct Inner {};

template <typename T>
struct Outer {};

template <typename T>
class Container {
 public:
  void set(T value);
  T get();
};

template <>
class Container<const Outer<const Inner *> *> {
 public:
  void set(const Outer<const Inner *> *value);
  const Outer<const Inner *> *get();
};

} // namespace test
