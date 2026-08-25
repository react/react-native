/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

namespace facebook::react {

enum class ColorSpace { sRGB, DisplayP3 };

ColorSpace getDefaultColorSpace();
void setDefaultColorSpace(ColorSpace newColorSpace);

struct ColorComponents {
  float red{0};
  float green{0};
  float blue{0};
  float alpha{0};
  ColorSpace colorSpace{getDefaultColorSpace()};
};

} // namespace facebook::react
