/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct Param {};

struct Container {
  void doSomething(Param p);
  void doConst(const Param &p);
  void doMultiple(Param a, Param b, int x);
};

} // namespace test
