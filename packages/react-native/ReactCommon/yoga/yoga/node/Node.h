/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <cstdio>
#include <vector>

#include <yoga/Yoga.h>
#include <yoga/node/LayoutableChildren.h>

#include <yoga/config/Config.h>
#include <yoga/enums/Dimension.h>
#include <yoga/enums/Direction.h>
#include <yoga/enums/Edge.h>
#include <yoga/enums/Errata.h>
#include <yoga/enums/MeasureMode.h>
#include <yoga/enums/NodeType.h>
#include <yoga/enums/PhysicalEdge.h>
#include <yoga/node/LayoutResults.h>
#include <yoga/style/Style.h>

// Tag struct used to form the opaque YGNodeRef for the public C API
struct YGNode {};

namespace facebook::yoga {

class YG_EXPORT Node : public ::YGNode {
 public:
  using LayoutableChildren = yoga::LayoutableChildren<Node>;
  Node();
  explicit Node(const Config* config);

  Node(Node&& node) noexcept;

  // Does not expose true value semantics, as children are not cloned eagerly.
  // Should we remove this?
  Node(const Node& node) = default;

  // assignment means potential leaks of existing children, or alternatively
  // freeing unowned memory, double free, or freeing stack memory.
  Node& operator=(const Node&) = delete;

  // Getters
  void* getContext() const {
    return context_;
  }

  bool alwaysFormsContainingBlock() const {
    return alwaysFormsContainingBlock_;
  }

  bool getHasNewLayout() const {
    return hasNewLayout_;
  }

  NodeType getNodeType() const {
    return nodeType_;
  }

  bool hasMeasureFunc() const noexcept {
    return measureFunc_ != nullptr;
  }

  YGSize measure(
      float availableWidth,
      MeasureMode widthMode,
      float availableHeight,
      MeasureMode heightMode);

  bool hasMinContentMeasureFunc() const noexcept {
    return minContentMeasureFunc_ != nullptr;
  }

  YGSize measureMinContent(
      float availableWidth,
      MeasureMode widthMode,
      float availableHeight,
      MeasureMode heightMode);

  FloatOptional getMinContentWidth() const noexcept {
    return minContentWidth_;
  }

  FloatOptional getMinContentHeight() const noexcept {
    return minContentHeight_;
  }

  bool hasBaselineFunc() const noexcept {
    return baselineFunc_ != nullptr;
  }

  float baseline(float width, float height) const;

  float dimensionWithMargin(FlexDirection axis, float widthSize);

  bool isLayoutDimensionDefined(FlexDirection axis);

  /**
   * Whether the node has a "definite length" along the given axis.
   * https://www.w3.org/TR/css-sizing-3/#definite
   */
  inline bool hasDefiniteLength(Dimension dimension, float ownerSize) {
    auto usedValue = getProcessedDimension(dimension).resolve(ownerSize, this);
    return usedValue.isDefined() && usedValue.unwrap() >= 0.0f;
  }

  bool hasErrata(Errata errata) const {
    return config_->hasErrata(errata);
  }

  bool hasContentsChildren() const {
    return contentsChildrenCount_ != 0;
  }

  YGDirtiedFunc getDirtiedFunc() const {
    return dirtiedFunc_;
  }

  // For Performance reasons passing as reference.
  Style& style() {
    return style_;
  }

  const Style& style() const {
    return style_;
  }

  // For Performance reasons passing as reference.
  LayoutResults& getLayout() {
    return layout_;
  }

  const LayoutResults& getLayout() const {
    return layout_;
  }

  size_t getLineIndex() const {
    return lineIndex_;
  }

  bool isReferenceBaseline() const {
    return isReferenceBaseline_;
  }

  // returns the Node that owns this Node. An owner is used to identify
  // the YogaTree that a Node belongs to. This method will return the parent
  // of the Node when a Node only belongs to one YogaTree or nullptr when
  // the Node is shared between two or more YogaTrees.
  Node* getOwner() const {
    return owner_;
  }

  const std::vector<Node*>& getChildren() const {
    return children_;
  }

  Node* getChild(size_t index) const {
    return children_.at(index);
  }

  size_t getChildCount() const {
    return children_.size();
  }

  LayoutableChildren getLayoutChildren() const {
    return LayoutableChildren(this);
  }

  size_t getLayoutChildCount() const {
    if (contentsChildrenCount_ == 0) {
      return children_.size();
    } else {
      size_t count = 0;
      for (auto iter = getLayoutChildren().begin();
           iter != getLayoutChildren().end();
           iter++) {
        count++;
      }
      return count;
    }
  }

  const Config* getConfig() const {
    return config_;
  }

  bool isDirty() const {
    return isDirty_;
  }

  Style::SizeLength getProcessedDimension(Dimension dimension) const {
    return processedDimensions_[static_cast<size_t>(dimension)];
  }

  FloatOptional getResolvedDimension(
      Direction direction,
      Dimension dimension,
      float referenceLength,
      float ownerWidth) const {
    FloatOptional value =
        getProcessedDimension(dimension).resolve(referenceLength, this);
    if (style_.boxSizing() == BoxSizing::BorderBox) {
      return value;
    }

    FloatOptional dimensionPaddingAndBorder =
        FloatOptional{style_.computePaddingAndBorderForDimension(
            direction, dimension, ownerWidth, this)};

    return value +
        (dimensionPaddingAndBorder.isDefined() ? dimensionPaddingAndBorder
                                               : FloatOptional{0.0});
  }

  // Setters

  void setContext(void* context) {
    context_ = context;
  }

  void setAlwaysFormsContainingBlock(bool alwaysFormsContainingBlock) {
    alwaysFormsContainingBlock_ = alwaysFormsContainingBlock;
  }

  void setHasNewLayout(bool hasNewLayout) {
    hasNewLayout_ = hasNewLayout;
  }

  void setNodeType(NodeType nodeType) {
    nodeType_ = nodeType;
  }

  void setMeasureFunc(YGMeasureFunc measureFunc);

  void setMinContentMeasureFunc(YGMinContentMeasureFunc minContentMeasureFunc) {
    minContentMeasureFunc_ = minContentMeasureFunc;
  }

  void setMinContentWidth(FloatOptional minContentWidth) noexcept {
    minContentWidth_ = minContentWidth;
  }

  void setMinContentHeight(FloatOptional minContentHeight) noexcept {
    minContentHeight_ = minContentHeight;
  }

  void setBaselineFunc(YGBaselineFunc baseLineFunc) {
    baselineFunc_ = baseLineFunc;
  }

  void setDirtiedFunc(YGDirtiedFunc dirtiedFunc) {
    dirtiedFunc_ = dirtiedFunc;
  }

  void setStyle(const Style& style) {
    style_ = style;
  }

  void setLayout(const LayoutResults& layout) {
    layout_ = layout;
  }

  void setLineIndex(size_t lineIndex) {
    lineIndex_ = lineIndex;
  }

  void setIsReferenceBaseline(bool isReferenceBaseline) {
    isReferenceBaseline_ = isReferenceBaseline;
  }

  void setOwner(Node* owner) {
    owner_ = owner;
  }

  // TODO: rvalue override for setChildren

  void setConfig(Config* config);

  void setDirty(bool isDirty);
  void setChildren(const std::vector<Node*>& children);
  void setLayoutLastOwnerDirection(Direction direction);
  void setLayoutComputedFlexBasis(FloatOptional computedFlexBasis);
  void setLayoutComputedFlexBasisGeneration(
      uint32_t computedFlexBasisGeneration);
  void setLayoutMeasuredDimension(float measuredDimension, Dimension dimension);
  void setLayoutHadOverflow(bool hadOverflow);
  void setLayoutDimension(float lengthValue, Dimension dimension);
  void setLayoutDirection(Direction direction);
  void setLayoutMargin(float margin, PhysicalEdge edge);
  void setLayoutBorder(float border, PhysicalEdge edge);
  void setLayoutPadding(float padding, PhysicalEdge edge);
  void setLayoutPosition(float position, PhysicalEdge edge);
  void setPosition(Direction direction, float ownerWidth, float ownerHeight);

  // Other methods
  Style::SizeLength processFlexBasis() const;
  FloatOptional resolveFlexBasis(
      Direction direction,
      FlexDirection flexDirection,
      float referenceLength,
      float ownerWidth) const;
  void processDimensions();
  Direction resolveDirection(Direction ownerDirection);
  void clearChildren();
  /// Replaces the occurrences of oldChild with newChild
  void replaceChild(Node* oldChild, Node* newChild);
  void replaceChild(Node* child, size_t index);
  void insertChild(Node* child, size_t index);
  /// Removes the first occurrence of child
  bool removeChild(Node* child);
  void removeChild(size_t index);

  void cloneChildrenIfNeeded();
  void cloneContentsChildrenIfNeeded();
  void markDirtyAndPropagate();
  float resolveFlexGrow() const;
  float resolveFlexShrink() const;
  bool isNodeFlexible();
  void reset();

  float relativePosition(
      FlexDirection axis,
      Direction direction,
      float axisSize) const;

 private:
  // Used to allow resetting the node
  Node& operator=(Node&&) noexcept = default;

  void useWebDefaults() {
    style_.setFlexDirection(FlexDirection::Row);
    style_.setAlignContent(Align::Stretch);
  }

  bool hasNewLayout_ : 1 = true;
  bool isReferenceBaseline_ : 1 = false;
  bool isDirty_ : 1 = true;
  bool alwaysFormsContainingBlock_ : 1 = false;
  NodeType nodeType_ : bitCount<NodeType>() = NodeType::Default;
  void* context_ = nullptr;
  YGMeasureFunc measureFunc_ = nullptr;
  YGMinContentMeasureFunc minContentMeasureFunc_ = nullptr;
  FloatOptional minContentWidth_{};
  FloatOptional minContentHeight_{};
  YGBaselineFunc baselineFunc_ = nullptr;
  YGDirtiedFunc dirtiedFunc_ = nullptr;
  Style style_;
  LayoutResults layout_;
  size_t lineIndex_ = 0;
  size_t contentsChildrenCount_ = 0;
  Node* owner_ = nullptr;
  std::vector<Node*> children_;
  const Config* config_;
  std::array<Style::SizeLength, 2> processedDimensions_{
      {StyleSizeLength::undefined(), StyleSizeLength::undefined()}};
};

inline Node* resolveRef(const YGNodeRef ref) {
  return static_cast<Node*>(ref);
}

inline const Node* resolveRef(const YGNodeConstRef ref) {
  return static_cast<const Node*>(ref);
}

} // namespace facebook::yoga
