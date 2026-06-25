/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/graphics/Float.h>
#include <functional>
#include <optional>

namespace facebook::react {

class UIManagerViewTransitionDelegate {
 public:
  virtual ~UIManagerViewTransitionDelegate() = default;

  virtual void
  applyViewTransitionName(const ShadowNode &shadowNode, const std::string &name, const std::string &className)
  {
  }

  virtual void createViewTransitionInstance(const std::string & /*name*/, Tag /*pseudoElementTag*/) {}

  virtual void cancelViewTransitionName(const ShadowNode &shadowNode, const std::string &name) {}

  virtual void restoreViewTransitionName(const ShadowNode &shadowNode) {}

  /*
   * Start a view transition. mutationCallback and onReadyCallback MUST be
   * called from a thread with access to the jsi::Runtime.
   * onCompleteCallback may be called from any thread.
   */
  virtual void startViewTransition(
      std::function<void()> mutationCallback,
      std::function<void()> onReadyCallback,
      std::function<void()> onCompleteCallback)
  {
  }

  virtual void startViewTransitionReadyFinished() {}

  virtual void startViewTransitionEnd() {}

  struct ViewTransitionInstance {
    Float x{0};
    Float y{0};
    Float width{0};
    Float height{0};
    Tag nativeTag{-1};
  };

  virtual std::optional<ViewTransitionInstance> getViewTransitionInstance(
      const std::string &name,
      const std::string &pseudo)
  {
    return std::nullopt;
  }

  // Similar to UIManager::findShadowNodeByTag, but searches all direct children
  // of the root node (where pseudo-element nodes live) rather than just the
  // first child. Pseudo-element nodes are appended as additional children of the
  // root node, rather than inserted into the main React tree, to avoid
  // disrupting the user-created component tree.
  virtual std::shared_ptr<const ShadowNode> findPseudoElementShadowNodeByTag(Tag /*tag*/) const
  {
    return nullptr;
  }

  // Called by the reconciler to signal that the next view transition should
  // be suspended until the currently active one finishes.
  virtual void suspendOnActiveViewTransition() {}

  virtual void waitForTransitionAnimation(int animationId) {}

  virtual void transitionAnimationFinished(int animationId) {}
};

} // namespace facebook::react
