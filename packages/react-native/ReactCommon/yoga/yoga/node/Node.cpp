/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <algorithm>
#include <cstddef>
#include <iostream>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/debug/AssertFatal.h>
#include <yoga/debug/Log.h>
#include <yoga/node/Node.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

Node::Node() : Node{&Config::getDefault()} {}

Node::Node(const yoga::Config* config) : config_{config} {
  yoga::assertFatal(
      config != nullptr, "Attempting to construct Node with null config");

  if (config->useWebDefaults()) {
    useWebDefaults();
  }
}

Node::Node(Node&& node) noexcept
    : hasNewLayout_(node.hasNewLayout_),
      isReferenceBaseline_(node.isReferenceBaseline_),
      isDirty_(node.isDirty_),
      alwaysFormsContainingBlock_(node.alwaysFormsContainingBlock_),
      nodeType_(node.nodeType_),
      context_(node.context_),
      measureFunc_(node.measureFunc_),
      baselineFunc_(node.baselineFunc_),
      dirtiedFunc_(node.dirtiedFunc_),
      style_(std::move(node.style_)),
      layout_(node.layout_),
      lineIndex_(node.lineIndex_),
      contentsChildrenCount_(node.contentsChildrenCount_),
      owner_(node.owner_),
      children_(std::move(node.children_)),
      config_(node.config_),
      processedDimensions_(node.processedDimensions_) {
  for (auto c : children_) {
    c->setOwner(this);
  }
}

YGSize Node::measure(
    float availableWidth,
    MeasureMode widthMode,
    float availableHeight,
    MeasureMode heightMode) {
  const auto size = measureFunc_(
      this,
      availableWidth,
      unscopedEnum(widthMode),
      availableHeight,
      unscopedEnum(heightMode));

  if (yoga::isUndefined(size.height) || size.height < 0 ||
      yoga::isUndefined(size.width) || size.width < 0) {
    yoga::log(
        this,
        LogLevel::Warn,
        "Measure function returned an invalid dimension to Yoga: [width=%f, height=%f]",
        size.width,
        size.height);
    return {
        .width = maxOrDefined(0.0f, size.width),
        .height = maxOrDefined(0.0f, size.height)};
  }

  return size;
}

float Node::baseline(float width, float height) const {
  return baselineFunc_(this, width, height);
}

float Node::dimensionWithMargin(
    const FlexDirection axis,
    const float widthSize) {
  return getLayout().measuredDimension(dimension(axis)) +
      style_.computeMarginForAxis(axis, widthSize);
}

bool Node::isLayoutDimensionDefined(const FlexDirection axis) {
  const float value = getLayout().measuredDimension(dimension(axis));
  return yoga::isDefined(value) && value >= 0.0f;
}

// Setters

void Node::setMeasureFunc(YGMeasureFunc measureFunc) {
  if (measureFunc == nullptr) {
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(NodeType::Default);
  } else {
    yoga::assertFatalWithNode(
        this,
        children_.empty(),
        "Cannot set measure function: Nodes with measure functions cannot have "
        "children.");
    // TODO: t18095186 Move nodeType to opt-in function and mark appropriate
    // places in Litho
    setNodeType(NodeType::Text);
  }

  measureFunc_ = measureFunc;
}

void Node::replaceChild(Node* child, size_t index) {
  auto previousChild = children_[index];
  if (previousChild->style().display() == Display::Contents &&
      child->style().display() != Display::Contents) {
    contentsChildrenCount_--;
  } else if (
      previousChild->style().display() != Display::Contents &&
      child->style().display() == Display::Contents) {
    contentsChildrenCount_++;
  }

  children_[index] = child;
}

void Node::replaceChild(Node* oldChild, Node* newChild) {
  if (oldChild->style().display() == Display::Contents &&
      newChild->style().display() != Display::Contents) {
    contentsChildrenCount_--;
  } else if (
      oldChild->style().display() != Display::Contents &&
      newChild->style().display() == Display::Contents) {
    contentsChildrenCount_++;
  }

  std::replace(children_.begin(), children_.end(), oldChild, newChild);
}

void Node::insertChild(Node* child, size_t index) {
  if (child->style().display() == Display::Contents) {
    contentsChildrenCount_++;
  }

  children_.insert(children_.begin() + static_cast<ptrdiff_t>(index), child);
}

void Node::setConfig(yoga::Config* config) {
  yoga::assertFatal(
      config != nullptr, "Attempting to set a null config on a Node");
  yoga::assertFatalWithConfig(
      config,
      config->useWebDefaults() == config_->useWebDefaults(),
      "UseWebDefaults may not be changed after constructing a Node");

  if (yoga::configUpdateInvalidatesLayout(*config_, *config)) {
    markDirtyAndPropagate();
    layout_.configVersion = 0;
  } else {
    // If the config is functionally the same, then align the configVersion so
    // that we can reuse the layout cache
    layout_.configVersion = config->getVersion();
  }

  config_ = config;
}

void Node::setDirty(bool isDirty) {
  if (static_cast<int>(isDirty) == isDirty_) {
    return;
  }
  isDirty_ = isDirty;
  if (isDirty && (dirtiedFunc_ != nullptr)) {
    dirtiedFunc_(this);
  }
}

void Node::setChildren(const std::vector<Node*>& children) {
  children_ = children;

  contentsChildrenCount_ = 0;
  for (const auto& child : children) {
    if (child->style().display() == Display::Contents) {
      contentsChildrenCount_++;
    }
  }
}

bool Node::removeChild(Node* child) {
  auto p = std::find(children_.begin(), children_.end(), child);
  if (p != children_.end()) {
    if (child->style().display() == Display::Contents) {
      contentsChildrenCount_--;
    }

    children_.erase(p);
    return true;
  }
  return false;
}

void Node::removeChild(size_t index) {
  if (children_[index]->style().display() == Display::Contents) {
    contentsChildrenCount_--;
  }

  children_.erase(children_.begin() + static_cast<ptrdiff_t>(index));
}

void Node::setLayoutDirection(Direction direction) {
  layout_.setDirection(direction);
}

void Node::setLayoutMargin(float margin, PhysicalEdge edge) {
  layout_.setMargin(edge, margin);
}

void Node::setLayoutBorder(float border, PhysicalEdge edge) {
  layout_.setBorder(edge, border);
}

void Node::setLayoutPadding(float padding, PhysicalEdge edge) {
  layout_.setPadding(edge, padding);
}

void Node::setLayoutLastOwnerDirection(Direction direction) {
  layout_.lastOwnerDirection = direction;
}

void Node::setLayoutComputedFlexBasis(const FloatOptional computedFlexBasis) {
  layout_.computedFlexBasis = computedFlexBasis;
}

void Node::setLayoutPosition(float position, PhysicalEdge edge) {
  layout_.setPosition(edge, position);
}

void Node::setLayoutComputedFlexBasisGeneration(
    uint32_t computedFlexBasisGeneration) {
  layout_.computedFlexBasisGeneration = computedFlexBasisGeneration;
}

void Node::setLayoutMeasuredDimension(
    float measuredDimension,
    Dimension dimension) {
  layout_.setMeasuredDimension(dimension, measuredDimension);
}

void Node::setLayoutHadOverflow(bool hadOverflow) {
  layout_.setHadOverflow(hadOverflow);
}

void Node::setLayoutDimension(float lengthValue, Dimension dimension) {
  layout_.setDimension(dimension, lengthValue);
  layout_.setRawDimension(dimension, lengthValue);
}

// If both left and right are defined, then use left. Otherwise return +left or
// -right depending on which is defined. Ignore statically positioned nodes as
// insets do not apply to them.
float Node::relativePosition(
    FlexDirection axis,
    Direction direction,
    float axisSize) const {
  if (style_.positionType() == PositionType::Static) {
    return 0;
  }
  if (style_.isInlineStartPositionDefined(axis, direction) &&
      !style_.isInlineStartPositionAuto(axis, direction)) {
    return style_.computeInlineStartPosition(axis, direction, axisSize);
  }

  return -1 * style_.computeInlineEndPosition(axis, direction, axisSize);
}

void Node::setPosition(
    const Direction direction,
    const float ownerWidth,
    const float ownerHeight) {
  /* Root nodes should be always layouted as LTR, so we don't return negative
   * values. */
  const Direction directionRespectingRoot =
      owner_ != nullptr ? direction : Direction::LTR;
  const FlexDirection mainAxis =
      yoga::resolveDirection(style_.flexDirection(), directionRespectingRoot);
  const FlexDirection crossAxis =
      yoga::resolveCrossDirection(mainAxis, directionRespectingRoot);

  // In the case of position static these are just 0. See:
  // https://www.w3.org/TR/css-position-3/#valdef-position-static
  const float relativePositionMain = relativePosition(
      mainAxis,
      directionRespectingRoot,
      isRow(mainAxis) ? ownerWidth : ownerHeight);
  const float relativePositionCross = relativePosition(
      crossAxis,
      directionRespectingRoot,
      isRow(mainAxis) ? ownerHeight : ownerWidth);

  const auto mainAxisLeadingEdge = inlineStartEdge(mainAxis, direction);
  const auto mainAxisTrailingEdge = inlineEndEdge(mainAxis, direction);
  const auto crossAxisLeadingEdge = inlineStartEdge(crossAxis, direction);
  const auto crossAxisTrailingEdge = inlineEndEdge(crossAxis, direction);

  setLayoutPosition(
      (style_.computeInlineStartMargin(mainAxis, direction, ownerWidth) +
       relativePositionMain),
      mainAxisLeadingEdge);
  setLayoutPosition(
      (style_.computeInlineEndMargin(mainAxis, direction, ownerWidth) +
       relativePositionMain),
      mainAxisTrailingEdge);
  setLayoutPosition(
      (style_.computeInlineStartMargin(crossAxis, direction, ownerWidth) +
       relativePositionCross),
      crossAxisLeadingEdge);
  setLayoutPosition(
      (style_.computeInlineEndMargin(crossAxis, direction, ownerWidth) +
       relativePositionCross),
      crossAxisTrailingEdge);
}

Style::SizeLength Node::processFlexBasis() const {
  Style::SizeLength flexBasis = style_.flexBasis();
  if (!flexBasis.isAuto() && !flexBasis.isUndefined()) {
    return flexBasis;
  }
  if (style_.flex().isDefined() && style_.flex().unwrap() > 0.0f) {
    return config_->useWebDefaults() ? StyleSizeLength::ofAuto()
                                     : StyleSizeLength::points(0);
  }
  return StyleSizeLength::ofAuto();
}

FloatOptional Node::resolveFlexBasis(
    Direction direction,
    FlexDirection flexDirection,
    float referenceLength,
    float ownerWidth) const {
  FloatOptional value = processFlexBasis().resolve(referenceLength);
  if (style_.boxSizing() == BoxSizing::BorderBox) {
    return value;
  }

  Dimension dim = dimension(flexDirection);
  FloatOptional dimensionPaddingAndBorder = FloatOptional{
      style_.computePaddingAndBorderForDimension(direction, dim, ownerWidth)};

  return value +
      (dimensionPaddingAndBorder.isDefined() ? dimensionPaddingAndBorder
                                             : FloatOptional{0.0});
}

void Node::processDimensions() {
  for (auto dim : {Dimension::Width, Dimension::Height}) {
    if (style_.maxDimension(dim).isDefined() &&
        yoga::inexactEquals(
            style_.maxDimension(dim), style_.minDimension(dim))) {
      processedDimensions_[yoga::to_underlying(dim)] = style_.maxDimension(dim);
    } else {
      processedDimensions_[yoga::to_underlying(dim)] = style_.dimension(dim);
    }
  }
}

Direction Node::resolveDirection(const Direction ownerDirection) {
  if (style_.direction() == Direction::Inherit) {
    return ownerDirection != Direction::Inherit ? ownerDirection
                                                : Direction::LTR;
  } else {
    return style_.direction();
  }
}

void Node::clearChildren() {
  children_.clear();
  children_.shrink_to_fit();
}

// Other Methods

void Node::cloneChildrenIfNeeded() {
  size_t i = 0;
  for (Node*& child : children_) {
    if (child->getOwner() != this) {
      child = resolveRef(config_->cloneNode(child, this, i));
      child->setOwner(this);

      if (child->style().display() == Display::Contents) [[unlikely]] {
        // The contents node's children are treated as children of the
        // contents node's parent for layout purposes, so they need
        // to be cloned as well.
        child->cloneChildrenIfNeeded();
      } else if (child->hasContentsChildren()) [[unlikely]] {
        child->cloneContentsChildrenIfNeeded();
      }
    }
    i += 1;
  }
}

void Node::cloneContentsChildrenIfNeeded() {
  size_t i = 0;
  for (Node*& child : children_) {
    if (child->style().display() == Display::Contents &&
        child->getOwner() != this) {
      child = resolveRef(config_->cloneNode(child, this, i));
      child->setOwner(this);
      child->cloneChildrenIfNeeded();
    }
    i += 1;
  }
}

void Node::markDirtyAndPropagate() {
  if (!isDirty_) {
    setDirty(true);
    setLayoutComputedFlexBasis(FloatOptional());
    if (owner_ != nullptr) {
      owner_->markDirtyAndPropagate();
    }
  }
}

float Node::resolveFlexGrow() const {
  // Root nodes flexGrow should always be 0
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (style_.flexGrow().isDefined()) {
    return style_.flexGrow().unwrap();
  }
  if (style_.flex().isDefined() && style_.flex().unwrap() > 0.0f) {
    return style_.flex().unwrap();
  }
  return Style::DefaultFlexGrow;
}

float Node::resolveFlexShrink() const {
  if (owner_ == nullptr) {
    return 0.0;
  }
  if (style_.flexShrink().isDefined()) {
    return style_.flexShrink().unwrap();
  }
  if (!config_->useWebDefaults() && style_.flex().isDefined() &&
      style_.flex().unwrap() < 0.0f) {
    return -style_.flex().unwrap();
  }
  return config_->useWebDefaults() ? Style::WebDefaultFlexShrink
                                   : Style::DefaultFlexShrink;
}

bool Node::isNodeFlexible() {
  return (
      (style_.positionType() != PositionType::Absolute) &&
      (resolveFlexGrow() != 0 || resolveFlexShrink() != 0));
}

void Node::reset() {
  yoga::assertFatalWithNode(
      this,
      children_.empty(),
      "Cannot reset a node which still has children attached");
  yoga::assertFatalWithNode(
      this, owner_ == nullptr, "Cannot reset a node still attached to a owner");

  *this = Node{getConfig()};
}

} // namespace facebook::yoga
