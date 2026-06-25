/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace test {

union MethodUnion {
 public:
  int32_t intValue;
  float floatValue;

  int32_t getInt() const;
};

} // namespace test
