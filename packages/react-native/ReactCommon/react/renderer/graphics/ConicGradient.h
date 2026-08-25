/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/ColorStop.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/RadialGradient.h>

#if RN_DEBUG_STRING_CONVERTIBLE
#include <sstream>
#endif

#include <vector>

namespace facebook::react {

struct ConicGradient {
  Float from{};
  RadialGradientPosition position;
  std::vector<ColorStop> colorStops;

  bool operator==(const ConicGradient &other) const = default;

#ifdef RN_SERIALIZABLE_STATE
  folly::dynamic toDynamic() const;
#endif

#if RN_DEBUG_STRING_CONVERTIBLE
  void toString(std::stringstream &ss) const;
#endif
};

} // namespace facebook::react
