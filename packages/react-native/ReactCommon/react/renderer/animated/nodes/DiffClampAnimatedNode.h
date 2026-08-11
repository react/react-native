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

namespace facebook::react {

class DiffClampAnimatedNode final : public ValueAnimatedNode {
 public:
  DiffClampAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;

 private:
  Tag inputNodeTag_;
  double min_;
  double max_;
  double lastValue_{0};
};

} // namespace facebook::react
