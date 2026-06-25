/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace facebook {

namespace react {

enum class Enum {
  A,
  B,
};

void test(react::Enum e = Enum::A);

} // namespace react

} // namespace facebook
