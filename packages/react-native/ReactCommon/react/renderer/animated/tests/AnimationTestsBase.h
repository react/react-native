/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef _WIN32
#include <folly/portability/Unistd.h>
#include <folly/portability/Windows.h>
#endif

#include <gtest/gtest.h>
#include <react/renderer/animated/NativeAnimatedNodesManager.h>

namespace facebook::react {

class AnimationTestsBase : public testing::Test {
 public:
  AnimationTestsBase() = default;

 protected:
  void initNodesManager() noexcept {
    nodesManager_.reset();
    nodesManager_ = std::make_shared<NativeAnimatedNodesManager>(
        [this](Tag reactTag, const folly::dynamic& changedProps) {
          lastUpdatedNodeTag = reactTag;
          lastCommittedProps = changedProps;
        },
        [this](const std::unordered_map<Tag, folly::dynamic>& nodesProps) {
          if (!nodesProps.empty()) {
            lastUpdatedNodeTag = nodesProps.begin()->first;
            lastCommittedProps = nodesProps.begin()->second;
          }
        },
        nullptr);
    NativeAnimatedNodesManager::isOnRenderThread_ = true;
  }

  bool nodeNeedsUpdate(Tag nodeTag) const {
    return nodesManager_->updatedNodeTags_.contains(nodeTag);
  }

  void runAnimationFrame(double timestamp) {
    nodesManager_->onAnimationFrame(timestamp);
  }

  std::shared_ptr<NativeAnimatedNodesManager> nodesManager_;
  folly::dynamic lastCommittedProps{folly::dynamic::object()};
  Tag lastUpdatedNodeTag{};
};

} // namespace facebook::react
