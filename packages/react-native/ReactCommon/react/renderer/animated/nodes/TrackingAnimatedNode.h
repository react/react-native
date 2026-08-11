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

class TrackingAnimatedNode final : public AnimatedNode {
 public:
  TrackingAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;

 private:
  int animationId_{};
  Tag toValueNodeId_{}; // Value node to be tracked
  Tag valueNodeId_{}; // Value node to be updated
};

} // namespace facebook::react
