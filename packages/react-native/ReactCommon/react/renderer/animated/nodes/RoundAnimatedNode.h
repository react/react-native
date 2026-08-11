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

#include "ValueAnimatedNode.h"

#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

/**
 * Animated node that rounds the value of another animated node to the nearest
 * multiple of a given number.
 */
class RoundAnimatedNode : public ValueAnimatedNode {
 public:
  RoundAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;

 private:
  Tag inputNodeTag_;
  double nearest_;
};

} // namespace facebook::react
