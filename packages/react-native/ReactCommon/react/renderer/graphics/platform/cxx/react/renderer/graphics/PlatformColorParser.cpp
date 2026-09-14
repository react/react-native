/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <react/renderer/graphics/PlatformColorParser.h>

namespace facebook::react {

SharedColor parsePlatformColor(
    const ContextContainer& /*contextContainer*/,
    int32_t /*surfaceId*/,
    const RawValue& /*value*/) {
  float alpha = 0;
  float red = 0;
  float green = 0;
  float blue = 0;

  return {colorFromComponents(
      {.red = red, .green = green, .blue = blue, .alpha = alpha})};
}

} // namespace facebook::react
