/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

namespace test {

struct Method {};

class Base {
 public:
  virtual auto getMethods() -> std::vector<Method> = 0;
  virtual auto getName() -> const char * = 0;
};

} // namespace test
