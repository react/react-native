/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct Param {};
struct Result {};

struct Container {
  using Callback = void(Param);
  using Processor = Result(Param, int);
};

} // namespace test
