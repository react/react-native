/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>

namespace test {

struct Param {};
struct Result {};

struct Container {
  std::function<void(Param)> simpleCallback;
  std::function<Result(Param, int)> processor;
  std::function<void(const Param &, Result)> multiRef;
  void (*fnPtr)(Param, int);
  Result (*fnPtrReturn)(const Param &);
};

} // namespace test
