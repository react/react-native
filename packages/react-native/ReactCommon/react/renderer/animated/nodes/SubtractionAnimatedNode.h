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

#include <folly/dynamic.h>
#include "ValueAnimatedNode.h"

namespace facebook::react {

class SubtractionAnimatedNode final : public OperatorAnimatedNode {
 public:
  SubtractionAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager)
      : OperatorAnimatedNode(tag, config, manager) {}

  void update() override;
};

} // namespace facebook::react
