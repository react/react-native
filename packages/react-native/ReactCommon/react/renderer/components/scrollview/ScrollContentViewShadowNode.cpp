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
    const ScrollContentViewState& state) {
  auto rtl = state.layoutDirection == LayoutDirection::RightToLeft;
  auto swap = rtl && state.swapLeftAndRightInRTL;
  switch (edge) {
    case Edge::Top:
      return {Edge::Top, Edge::Vertical, Edge::All, Edge::All};
    case Edge::Bottom:
      return {Edge::Bottom, Edge::Vertical, Edge::All, Edge::All};
    case Edge::Left:
      if (swap) {
        return {Edge::Right, Edge::End, Edge::Horizontal, Edge::All};
      }
      return {
          rtl ? Edge::End : Edge::Start,
          Edge::Left,
          Edge::Horizontal,
          Edge::All};
    case Edge::Right:
      if (swap) {
        return {Edge::Left, Edge::Start, Edge::Horizontal, Edge::All};
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
    const ScrollContentViewState& state) {
  for (auto candidate : paddingEdges(edge, state)) {
    auto value = style.padding(candidate);
    if (value.isDefined()) {
      return value;
    }
  }
  return StyleLength::undefined();
}

StyleLength padded(StyleLength value, Float inset) {
  if (inset == 0) {
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
  padForSafeArea(style, getStateData());
  yogaNode_.setStyle(style);
  yogaNode_.setDirty(wasDirty || style != previousStyle);
}

/*static*/ void ScrollContentViewShadowNode::padForSafeArea(
    yoga::Style& style,
    const ScrollContentViewState& state) {
  const auto& insets = state.safeAreaPadding;
  if (insets.top != 0 || insets.bottom != 0) {
    auto top = padded(resolvedPadding(style, Edge::Top, state), insets.top);
    auto bottom =
        padded(resolvedPadding(style, Edge::Bottom, state), insets.bottom);
    style.setPadding(Edge::Top, top);
    style.setPadding(Edge::Bottom, bottom);
  }
  if (insets.left != 0 || insets.right != 0) {
    auto left = padded(resolvedPadding(style, Edge::Left, state), insets.left);
    auto right =
        padded(resolvedPadding(style, Edge::Right, state), insets.right);
    // The logical edges take precedence over every other padding edge along
    // the row. The physical edges are cleared, since at layout they are copied
    // over the logical ones when left and right swap in RTL.
    auto rtl = state.layoutDirection == LayoutDirection::RightToLeft;
    style.setPadding(Edge::Start, rtl ? right : left);
    style.setPadding(Edge::End, rtl ? left : right);
    style.setPadding(Edge::Left, StyleLength::undefined());
    style.setPadding(Edge::Right, StyleLength::undefined());
  }
}

} // namespace facebook::react
