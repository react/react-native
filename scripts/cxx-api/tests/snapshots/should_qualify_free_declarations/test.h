/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

namespace test {

struct Param {};

void freeFunction(Param p);
typedef void (*FreeFnPtr)(Param);
using FreeCallback = void(Param);

} // namespace test
