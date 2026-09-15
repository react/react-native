/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/animationbackend/AnimatedProps.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <vector>

namespace facebook::react {

struct AnimatedPropsBuffer {
  std::vector<int> ints;
  std::vector<double> doubles;
  std::vector<folly::dynamic> rawProps;
};

AnimatedPropsBuffer encodeAnimatedProps(const std::unordered_map<Tag, AnimatedProps> &updates);

} // namespace facebook::react
