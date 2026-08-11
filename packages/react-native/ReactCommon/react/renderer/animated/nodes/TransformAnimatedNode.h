/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/*
 * Adapted from react-native-windows under the MIT license.
 */

#pragma once

#include "AnimatedNode.h"

namespace facebook::react {

struct TransformConfig {
 public:
  std::string property;
  Tag nodeTag;
  double value;
};

class TransformAnimatedNode final : public AnimatedNode {
 public:
  TransformAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void collectViewUpdates(folly::dynamic& props);
};
} // namespace facebook::react
