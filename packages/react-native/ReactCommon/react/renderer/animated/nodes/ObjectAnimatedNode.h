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

#include <folly/dynamic.h>

namespace facebook::react {

class ObjectAnimatedNode final : public AnimatedNode {
 public:
  ObjectAnimatedNode(
      Tag tag,
      const folly::dynamic& config,
      NativeAnimatedNodesManager& manager);
  void collectViewUpdates(std::string propKey, folly::dynamic& props);

 private:
  folly::dynamic collectViewUpdatesObjectHelper(
      const folly::dynamic& value) const;

  folly::dynamic collectViewUpdatesArrayHelper(
      const folly::dynamic& value) const;

  folly::dynamic getValueProp(const folly::dynamic& prop) const;
};

} // namespace facebook::react
