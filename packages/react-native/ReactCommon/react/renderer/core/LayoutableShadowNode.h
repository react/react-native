/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <array>
#include <cmath>
#include <memory>
#include <vector>

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Transform.h>

namespace facebook::react {

struct LayoutConstraints;
struct LayoutContext;

/*
 * Describes all sufficient layout API (in approach-agnostic way)
 * which makes a concurrent layout possible.
 */
class LayoutableShadowNode : public ShadowNode {
 public:
  LayoutableShadowNode(
      const ShadowNodeFragment& fragment,
      const ShadowNodeFamily::Shared& family,
      ShadowNodeTraits traits);

  LayoutableShadowNode(
      const ShadowNode& sourceShadowNode,
      const ShadowNodeFragment& fragment);

  struct LayoutInspectingPolicy {
    bool includeTransform{true};
    bool includeViewportOffset{false};
    bool enableOverflowClipping{false};
  };

  using UnsharedList = std::vector<LayoutableShadowNode*>;

  /*
   * Returns layout metrics of a node represented as `descendantNodeFamily`
   * from `rootNode` like `computeRelativeLayoutMetrics` but returns absolute
   * transform for node if used as root.
   */
  static LayoutMetrics computeLayoutMetricsFromRoot(
      const ShadowNodeFamily& descendantNodeFamily,
      const LayoutableShadowNode& rootNode,
      LayoutInspectingPolicy policy);

  /*
   * Returns layout metrics of a node represented as `descendantNodeFamily`
   * computed relatively to given `ancestorNode`. Returns `EmptyLayoutMetrics`
   * if the nodes don't form an ancestor-descender relationship in the same
   * tree.
   */
  static LayoutMetrics computeRelativeLayoutMetrics(
      const ShadowNodeFamily& descendantNodeFamily,
      const LayoutableShadowNode& ancestorNode,
      LayoutInspectingPolicy policy);

  /*
   * Computes the layout metrics of a node relative to its specified ancestors.
   */
  static LayoutMetrics computeRelativeLayoutMetrics(
      const AncestorList& ancestors,
      LayoutInspectingPolicy policy);

  /*
   * Performs layout of the tree starting from this node. Usually is being
   * called on the root node.
   * Default implementation does nothing.
   */
  virtual void layoutTree(
      LayoutContext layoutContext,
      LayoutConstraints layoutConstraints) = 0;

  /*
   * Measures the node (and node content, probably recursively) with
   * given constrains and relying on possible layout.
   * Default implementation returns zero size.
   */
  virtual Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const;

  /*
   * Measures the node with given `layoutContext` and `layoutConstraints`.
   * The size of nested content and the padding should be included, the margin
   * should *not* be included. Default implementation returns zero size.
   */
  virtual Size measure(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const;

  /*
   * Computes layout recursively.
   * Additional environmental constraints might be provided via `layoutContext`
   * argument.
   *
   * The typical concrete-layout-specific implementation of this method should:
   * - Measure children with `LayoutConstraints` calculated from its size using
   *   a particular layout approach;
   * - Calculate and assign `LayoutMetrics` for the children;
   * - Call itself recursively on every child if needed.
   */
  virtual void layout(LayoutContext layoutContext) = 0;

  /*
   * Returns layout metrics computed during previous layout pass.
   */
  LayoutMetrics getLayoutMetrics() const;

  /*
   * Returns a transform object that represents transformations that will/should
   * be applied on top of regular layout metrics by mounting layer.
   * The `transform` value modifies a coordinate space of a layout system.
   * Default implementation returns `Identity` transform.
   */
  virtual Transform getTransform() const;

  /*
   * Returns offset which is applied to children's origin in
   * `LayoutableShadowNode::getRelativeLayoutMetrics` and
   * `LayoutableShadowNode::findNodeAtPoint`.
   * `includeTransform` is a flag to include the transform in the offset. This
   * is a rare case but needed for case where transform is involved for e.g. in
   * ScrollView.
   */
  virtual Point getContentOriginOffset(bool includeTransform) const;

  /*
   * Sets layout metrics for the shadow node.
   */
  void setLayoutMetrics(LayoutMetrics layoutMetrics);

  /*
   * Returns the ShadowNode that is rendered at the Point received as a
   * parameter.
   */
  static std::shared_ptr<const ShadowNode> findNodeAtPoint(
      const std::shared_ptr<const ShadowNode>& node,
      Point point);

  /*
   * Clean or Dirty layout state:
   * Indicates whether all nodes (and possibly their subtrees) along the path
   * to the root node should be re-laid out.
   */
  virtual void dirtyLayout() = 0;
  virtual bool getIsLayoutClean() const = 0;

  /*
   * Unifed methods to access text layout metrics.
   */
  virtual Float baseline(const LayoutContext& layoutContext, Size size) const;

  virtual bool canBeTouchTarget() const;
  virtual bool canChildrenBeTouchTarget() const;

  /*
   * Returns layoutable children to iterate on.
   */
  LayoutableShadowNode::UnsharedList getLayoutableChildNodes() const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const;
#endif

  LayoutMetrics layoutMetrics_;
};

} // namespace facebook::react
