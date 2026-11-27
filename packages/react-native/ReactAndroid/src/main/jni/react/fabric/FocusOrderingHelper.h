/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/uimanager/UIManager.h>

#include <optional>
#include <vector>

namespace facebook::react {

enum class FocusDirection {
  FocusDown = 0,
  FocusUp = 1,
  FocusRight = 2,
  FocusLeft = 3,
  FocusForward = 4,
  FocusBackward = 5,
};

class FocusOrderingHelper {
 public:
  static void traverseAndUpdateNextFocusableElement(
      const std::shared_ptr<const ShadowNode> &parentShadowNode,
      const std::shared_ptr<const ShadowNode> &focusedShadowNode,
      const std::shared_ptr<const ShadowNode> &currNode,
      FocusDirection focusDirection,
      const UIManager &uimanager,
      Rect sourceRect,
      std::optional<Rect> &nextRect,
      std::shared_ptr<const ShadowNode> &nextNode);

  static std::shared_ptr<const ShadowNode> findShadowNodeByTagRecursively(
      const std::shared_ptr<const ShadowNode> &parentShadowNode,
      Tag tag);

  static std::optional<FocusDirection> resolveFocusDirection(int direction);

  /*
   * The tags of the nodes between `rootShadowNode` and `childShadowNode`,
   * outermost first: empty for a direct child of `rootShadowNode`, and
   * `std::nullopt` when `childShadowNode` does not descend from it.
   */
  static std::optional<std::vector<Tag>> getRelativeAncestorTags(
      const ShadowNode &rootShadowNode,
      const ShadowNode &childShadowNode);
};
} // namespace facebook::react
