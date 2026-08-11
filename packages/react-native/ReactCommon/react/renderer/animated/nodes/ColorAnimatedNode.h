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

#include <react/renderer/graphics/Color.h>

namespace facebook::react {
class ColorAnimatedNode final : public AnimatedNode {
 public:
  ColorAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);

  void update() override;

  Color getColor();

 private:
  Tag rNodeTag_{};
  Tag gNodeTag_{};
  Tag bNodeTag_{};
  Tag aNodeTag_{};

  Color color_{0};
};
} // namespace facebook::react
