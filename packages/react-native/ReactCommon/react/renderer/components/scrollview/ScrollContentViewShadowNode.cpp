/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollContentViewShadowNode.h"

#include <array>

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
const char ScrollContentViewComponentName[] = "ScrollContentView";

namespace {

using yoga::Edge;
using yoga::StyleLength;

/*
 * The padding edges Yoga reads for one physical edge, most specific first.
 * Along the row the logical edges take precedence over the physical ones, and
 * when left and right swap in RTL the physical values are copied over the
 * logical ones at layout, so they come first.
 */
std::array<Edge, 4> paddingEdges(
    Edge edge,
    LayoutDirection layoutDirection,
    bool swapLeftAndRightInRTL) {
  auto rtl = layoutDirection == LayoutDirection::RightToLeft;
  switch (edge) {
    case Edge::Top:
      return {Edge::Top, Edge::Vertical, Edge::All, Edge::All};
    case Edge::Bottom:
      return {Edge::Bottom, Edge::Vertical, Edge::All, Edge::All};
    case Edge::Left:
      if (swapLeftAndRightInRTL) {
        return rtl
            ? std::array{Edge::Right, Edge::End, Edge::Horizontal, Edge::All}
            : std::array{Edge::Left, Edge::Start, Edge::Horizontal, Edge::All};
      }
      return {
          rtl ? Edge::End : Edge::Start,
          Edge::Left,
          Edge::Horizontal,
          Edge::All};
    case Edge::Right:
      if (swapLeftAndRightInRTL) {
        return rtl
            ? std::array{Edge::Left, Edge::Start, Edge::Horizontal, Edge::All}
            : std::array{Edge::Right, Edge::End, Edge::Horizontal, Edge::All};
      }
      return {
          rtl ? Edge::Start : Edge::End,
          Edge::Right,
          Edge::Horizontal,
          Edge::All};
    default:
      return {Edge::All, Edge::All, Edge::All, Edge::All};
  }
}

StyleLength resolvedPadding(
    const yoga::Style& style,
    Edge edge,
    LayoutDirection layoutDirection,
    bool swapLeftAndRightInRTL) {
  for (auto candidate :
       paddingEdges(edge, layoutDirection, swapLeftAndRightInRTL)) {
    auto value = style.padding(candidate);
    if (value.isDefined()) {
      return value;
    }
  }
  return StyleLength::undefined();
}

/*
 * A percentage padding keeps the edge as the style set it, with no inset
 * added, since Yoga holds one length per edge and a percentage has no point
 * value to add to.
 */
StyleLength padded(StyleLength value, Float inset) {
  if (inset == 0 || value.isPercent()) {
    return value;
  }
  auto base = value.isPoints() ? value.value().unwrap() : 0.0f;
  return StyleLength::points(base + inset);
}

} // namespace

ScrollContentViewShadowNode::ScrollContentViewShadowNode(
    const ShadowNodeFragment& fragment,
    const ShadowNodeFamily::Shared& family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  initialize();
}

ScrollContentViewShadowNode::ScrollContentViewShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
}

void ScrollContentViewShadowNode::initialize() noexcept {
  if (getConcreteProps().collapsableChildren) {
    traits_.unset(ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  } else {
    traits_.set(ShadowNodeTraits::Trait::ChildrenFormStackingContext);
  }
}

void ScrollContentViewShadowNode::applySafeAreaPadding() {
  ensureUnsealed();
  auto previousStyle = yogaNode_.style();
  auto wasDirty = yogaNode_.isDirty();
  updateYogaProps();
  auto style = yogaNode_.style();
  padForSafeArea(style, getStateData(), getLayoutMetrics().layoutDirection);
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(wasDirty || style != previousStyle);
}

/*static*/ void ScrollContentViewShadowNode::padForSafeArea(
    yoga::Style& style,
    const ScrollContentViewState& state,
    LayoutDirection layoutDirection) {
  const auto& insets = state.safeAreaPadding;
  auto swap = state.swapLeftAndRightInRTL;
  if (insets.top != 0 || insets.bottom != 0) {
    auto top = padded(
        resolvedPadding(style, Edge::Top, layoutDirection, swap), insets.top);
    auto bottom = padded(
        resolvedPadding(style, Edge::Bottom, layoutDirection, swap),
        insets.bottom);
    style.setPadding(Edge::Top, top);
    style.setPadding(Edge::Bottom, bottom);
  }
  if (insets.left != 0 || insets.right != 0) {
    auto left = padded(
        resolvedPadding(style, Edge::Left, layoutDirection, swap), insets.left);
    auto right = padded(
        resolvedPadding(style, Edge::Right, layoutDirection, swap),
        insets.right);
    // The logical edges take precedence over every other padding edge along
    // the row. The physical edges are cleared, since at layout they are copied
    // over the logical ones when left and right swap in RTL.
    auto rtl = layoutDirection == LayoutDirection::RightToLeft;
    style.setPadding(Edge::Start, rtl ? right : left);
    style.setPadding(Edge::End, rtl ? left : right);
    style.setPadding(Edge::Left, StyleLength::undefined());
    style.setPadding(Edge::Right, StyleLength::undefined());
  }
}

} // namespace facebook::react
