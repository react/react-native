/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/renderer/graphics/Float.h>

namespace facebook::react {

struct Vector {
  Float x{0};
  Float y{0};
  Float z{0};
  Float w{0};
};

} // namespace facebook::react
