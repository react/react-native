/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct FunctionPointers {
  void (*simple)(int);
  int (*withReturn)(double, float);
  void *(*returnsPointer)(const char *);
};

} // namespace test
