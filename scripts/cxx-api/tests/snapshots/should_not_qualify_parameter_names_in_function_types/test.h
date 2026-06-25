/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

class Tracer {
 public:
  bool isActive;
  using StateCallback = void (*)(bool isActive);
  uint32_t subscribe(StateCallback callback);
};

} // namespace test
