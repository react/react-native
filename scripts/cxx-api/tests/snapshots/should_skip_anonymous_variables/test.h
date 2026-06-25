/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>

namespace test {

struct BundleHeader {
  union {
    uint32_t magic32;
    uint64_t magic64;
  };
  uint32_t version;
};

} // namespace test
