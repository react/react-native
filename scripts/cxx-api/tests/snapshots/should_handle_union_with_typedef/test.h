/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace test {

union TypedefUnion {
 public:
  using ValueType = int32_t;
  typedef float FloatType;

  ValueType intValue;
  FloatType floatValue;
};

} // namespace test
