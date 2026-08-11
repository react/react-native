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
#include <react/debug/flags.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::react {

enum class AnimatedNodeType {
  Style,
  Value,
  Props,
  Interpolation,
  Addition,
  Subtraction,
  Division,
  Multiplication,
  Modulus,
  Diffclamp,
  Transform,
  Tracking,
  Color,
  Round,
  Object
};

class NativeAnimatedNodesManager;

class AnimatedNode {
 public:
  AnimatedNode(
      Tag tag,
      folly::dynamic config,
      // TODO: T190028913 maybe pass in strongly typed data when constructing
      // AnimatedNode
      NativeAnimatedNodesManager& manager,
      AnimatedNodeType type);

  // Detach Node
  virtual ~AnimatedNode() = default;

  AnimatedNode(AnimatedNode&&) noexcept = default;
  AnimatedNode& operator=(AnimatedNode&&) noexcept = default;
  AnimatedNode(const AnimatedNode&) = default;
  AnimatedNode& operator=(const AnimatedNode&) = default;

  Tag tag() const noexcept {
    return tag_;
  }

  void addChild(Tag tag);

  void removeChild(Tag tag);

  const std::unordered_set<Tag>& getChildren() const noexcept {
    return children_;
  }

  AnimatedNodeType type() const noexcept {
    return type_;
  }

  const folly::dynamic& getConfig() const noexcept {
    return config_;
  }

#ifdef REACT_NATIVE_DEBUG
  std::string debugID() const {
    return (getConfig().count("debugID") != 0u)
        ? getConfig()["debugID"].asString()
        : "";
  }
#endif

  virtual void update() {}

  virtual void onDetachedFromNode(Tag /*animatedNodeTag*/) {}
  virtual void onAttachToNode(Tag /*animatedNodeTag*/) {}

  static std::optional<AnimatedNodeType> getNodeTypeByName(
      const std::string& nodeTypeName);

  int activeIncomingNodes = 0;
  int bfsColor = 0;

  static constexpr int INITIAL_BFS_COLOR = 0;

 protected:
  AnimatedNode* getChildNode(Tag tag);
  Tag tag_{0};
  NativeAnimatedNodesManager* manager_;
  AnimatedNodeType type_;
  std::unordered_set<Tag> children_{};

 private:
  // Should remain unchanged after initialized in constructor
  folly::dynamic config_;
};
} // namespace facebook::react
