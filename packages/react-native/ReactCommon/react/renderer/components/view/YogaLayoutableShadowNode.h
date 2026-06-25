/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <vector>

#include <yoga/node/Node.h>

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/view/YogaStylableProps.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/Sealable.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/debug/DebugStringConvertible.h>

namespace facebook::react {

class YogaLayoutableShadowNode : public LayoutableShadowNode {
  // Allow YogaCloneTest to read yogaNode_ for ownership assertions in unit
  // tests. The class is only defined in the tests target; production code
  // sees the friend as a forward declaration with no effect.
  friend class YogaCloneTest;

 public:
  using Shared = std::shared_ptr<const YogaLayoutableShadowNode>;
  using ListOfShared = std::vector<Shared>;

#pragma mark - Constructors

  YogaLayoutableShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);

  YogaLayoutableShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  void completeClone(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment) override;

#pragma mark - Mutating Methods

  /*
   * Connects `measureFunc` function of Yoga node with
   * `LayoutableShadowNode::measure()` method.
   */
  void enableMeasurement();

  void appendChild(const std::shared_ptr<const ShadowNode> &child) override;
  void replaceChild(
      const ShadowNode &oldChild,
      const std::shared_ptr<const ShadowNode> &newChild,
      size_t suggestedIndex = SIZE_MAX) override;

  void updateYogaChildren();

  void updateYogaProps();

  /*
   * Sets layoutable size of node.
   */
  void setSize(Size size) const;

  void setPadding(RectangleEdges<Float> padding) const;

  /*
   * Sets position type of Yoga node (relative, absolute).
   */
  void setPositionType(YGPositionType positionType) const;

#pragma mark - LayoutableShadowNode

  void dirtyLayout() override;
  bool getIsLayoutClean() const override;

  /*
   * Computes layout using Yoga layout engine.
   * See `LayoutableShadowNode` for more details.
   */
  void layoutTree(LayoutContext layoutContext, LayoutConstraints layoutConstraints) override;

  void layout(LayoutContext layoutContext) override;

  Rect getContentBounds() const;

 protected:
  /**
   * Subclasses which provide MeasurableYogaNode may override to signal that a
   * new ShadowNode revision does not need to invalidate existing measurements.
   */
  virtual bool shouldNewRevisionDirtyMeasurement(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
      const;

  /*
   * Yoga config associated (only) with this particular node.
   */
  yoga::Config yogaConfig_;

  /*
   * All Yoga functions only accept non-const arguments, so we have to mark
   * Yoga node as `mutable` here to avoid `static_cast`ing the pointer to this
   * all the time.
   */
  mutable yoga::Node yogaNode_;

 private:
  void updateYogaChildrenOwnersIfNeeded();

  /*
   * Return true if child's yogaNode's owner is this->yogaNode_. Otherwise
   * returns false.
   */
  bool doesOwn(const YogaLayoutableShadowNode &child) const;

  /*
   * Appends a Yoga node to the Yoga node associated with this node.
   * The method does *not* do anything besides that (no cloning or `owner` field
   * adjustment).
   */
  void appendYogaChild(const YogaLayoutableShadowNode::Shared &childNode);

  /*
   * Makes the child node with a given `index` (and Yoga node associated with) a
   * valid child node satisfied requirements of the Concurrent Layout approach.
   */
  void adoptYogaChild(size_t index);

  /**
   * Applies contextual values to the ShadowNode's Yoga tree after the
   * ShadowTree has been constructed, but before it has been is laid out or
   * committed.
   */
  void
  configureYogaTree(float pointScaleFactor, Float fontSizeMultiplier, YGErrata defaultErrata, bool swapLeftAndRight);

  /**
   * Return an errata based on a `layoutConformance` prop if given, otherwise
   * the passed default
   */
  YGErrata resolveErrata(YGErrata defaultErrata) const;

  /**
   * Replcaes a child with a mutable clone of itself, returning the clone.
   */
  YogaLayoutableShadowNode &cloneChildInPlace(size_t layoutableChildIndex);

  static yoga::Config &initializeYogaConfig(yoga::Config &config, YGConfigConstRef previousConfig = nullptr);
  static YGNodeRef
  yogaNodeCloneCallbackConnector(YGNodeConstRef oldYogaNode, YGNodeConstRef parentYogaNode, size_t childIndex);
  static YGSize yogaNodeMeasureCallbackConnector(
      YGNodeConstRef yogaNode,
      float width,
      YGMeasureMode widthMode,
      float height,
      YGMeasureMode heightMode);
  static float yogaNodeBaselineCallbackConnector(YGNodeConstRef yogaNode, float width, float height);
  static YogaLayoutableShadowNode &shadowNodeFromContext(YGNodeConstRef yogaNode);

#pragma mark - RTL Legacy Autoflip

  /*
   * Reassigns the following values:
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   * This is neccesarry to be backwards compatible with old renderer, it swaps
   * the values as well in https://fburl.com/diffusion/kl7bjr3h
   */
  void swapStyleLeftAndRight();
  /*
   * In shadow node passed as argument, reassigns following values
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   */
  void swapLeftAndRightInViewProps();
  /*
   * In yoga node passed as argument, reassigns following values
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   */
  void swapLeftAndRightInYogaStyleProps();

  /*
   * Combine a base yoga::Style with aliased properties which should be
   * flattened into it. E.g. reconciling "marginInlineStart" and "marginStart".
   */
  static yoga::Style applyAliasedProps(const yoga::Style &baseStyle, const YogaStylableProps &props);

#pragma mark - Consistency Ensuring Helpers

  void ensureConsistency() const;
  void ensureYogaChildrenAlignment() const;
  void ensureYogaChildrenLookFine() const;

#pragma mark - Private member variables
  /*
   * List of children which derive from YogaLayoutableShadowNode
   */
  ListOfShared yogaLayoutableChildren_;

  /*
   * Whether the full Yoga subtree of this Node has been configured.
   */
  bool yogaTreeHasBeenConfigured_{false};
};

} // namespace facebook::react
