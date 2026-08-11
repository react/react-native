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

class ModulusAnimatedNode final : public ValueAnimatedNode {
 public:
  ModulusAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;

 private:
  Tag inputNodeTag_{};
  double modulus_{};
};

} // namespace facebook::react
