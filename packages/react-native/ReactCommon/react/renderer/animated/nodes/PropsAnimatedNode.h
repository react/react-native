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

#include <react/renderer/animated/internal/primitives.h>
#include <react/renderer/core/ShadowNode.h>
#include <mutex>

namespace facebook::react {
class PropsAnimatedNode final : public AnimatedNode {
 public:
  PropsAnimatedNode(Tag tag, const folly::dynamic &config, NativeAnimatedNodesManager &manager);

  // Only called when `useSharedAnimatedBackend`==true
  void connectToShadowNodeFamily(ShadowNodeFamily::Weak shadowNodeFamily);
  void disconnectFromShadowNodeFamily();

  void connectToView(Tag viewTag);
  void disconnectFromView(Tag viewTag);
  void restoreDefaultValues();

  Tag connectedViewTag() const
  {
    return connectedViewTag_;
  }

  SurfaceId connectedRootTag() const
  {
    return connectedRootTag_;
  }

  folly::dynamic props()
  {
    std::lock_guard<std::mutex> lock(propsMutex_);
    return props_;
  }

  void update() override;

  void update(bool forceFabricCommit);

 private:
  std::mutex propsMutex_;
  folly::dynamic props_;
  bool layoutStyleUpdated_{false};

  Tag connectedViewTag_{animated::undefinedAnimatedNodeIdentifier};
  ShadowNodeFamily::Weak shadowNodeFamily_;

  // Needed for PlatformColor resolver
  SurfaceId connectedRootTag_{animated::undefinedAnimatedNodeIdentifier};
};
} // namespace facebook::react
