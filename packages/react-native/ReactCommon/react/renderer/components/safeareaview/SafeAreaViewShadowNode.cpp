/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "SafeAreaViewShadowNode.h"

#include <yoga/Yoga.h>
#include <cmath>

namespace facebook::react {

using namespace yoga;

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
const char SafeAreaViewComponentName[] = "SafeAreaView";

namespace {

Style::Length valueFromEdges(
    Style::Length edge,
    Style::Length axis,
    Style::Length defaultValue) {
  if (edge.isDefined()) {
    return edge;
  }
  if (axis.isDefined()) {
    return axis;
  }
  return defaultValue;
}

float getEdgeValue(
    const std::string& edgeMode,
    float insetValue,
    float edgeValue) {
  if (edgeMode == "off") {
    return edgeValue;
  }
  if (edgeMode == "maximum") {
    return std::fmax(insetValue, edgeValue);
  }
  // "additive" (default)
  return insetValue + edgeValue;
}

} // namespace

void SafeAreaViewShadowNode::adjustLayoutWithState() {
  ensureUnsealed();

  const auto& props = getConcreteProps();
  const auto& stateData =
      static_cast<const SafeAreaViewShadowNode::ConcreteState&>(*getState())
          .getData();
  const auto& edges = props.edges;
  // State carries the raw window insets, reported by the native view.
  const auto& insets = stateData.padding;

  // Read the base padding/margin already set on the node, so `additive` and
  // `maximum` edge modes can build on top of author-supplied values.
  Style::Length top, left, right, bottom;
  if (props.mode == SafeAreaViewMode::Padding) {
    auto defaultPadding = props.yogaStyle.padding(Edge::All);
    top = valueFromEdges(
        props.yogaStyle.padding(Edge::Top),
        props.yogaStyle.padding(Edge::Vertical),
        defaultPadding);
    left = valueFromEdges(
        props.yogaStyle.padding(Edge::Left),
        props.yogaStyle.padding(Edge::Horizontal),
        defaultPadding);
    bottom = valueFromEdges(
        props.yogaStyle.padding(Edge::Bottom),
        props.yogaStyle.padding(Edge::Vertical),
        defaultPadding);
    right = valueFromEdges(
        props.yogaStyle.padding(Edge::Right),
        props.yogaStyle.padding(Edge::Horizontal),
        defaultPadding);
  } else {
    auto defaultMargin = props.yogaStyle.margin(Edge::All);
    top = valueFromEdges(
        props.yogaStyle.margin(Edge::Top),
        props.yogaStyle.margin(Edge::Vertical),
        defaultMargin);
    left = valueFromEdges(
        props.yogaStyle.margin(Edge::Left),
        props.yogaStyle.margin(Edge::Horizontal),
        defaultMargin);
    bottom = valueFromEdges(
        props.yogaStyle.margin(Edge::Bottom),
        props.yogaStyle.margin(Edge::Vertical),
        defaultMargin);
    right = valueFromEdges(
        props.yogaStyle.margin(Edge::Right),
        props.yogaStyle.margin(Edge::Horizontal),
        defaultMargin);
  }

  top = Style::Length::points(
      getEdgeValue(edges.top, insets.top, top.value().unwrapOrDefault(0)));
  left = Style::Length::points(
      getEdgeValue(edges.left, insets.left, left.value().unwrapOrDefault(0)));
  right = Style::Length::points(getEdgeValue(
      edges.right, insets.right, right.value().unwrapOrDefault(0)));
  bottom = Style::Length::points(getEdgeValue(
      edges.bottom, insets.bottom, bottom.value().unwrapOrDefault(0)));

  yoga::Style adjustedStyle = props.yogaStyle;
  if (props.mode == SafeAreaViewMode::Padding) {
    adjustedStyle.setPadding(Edge::Top, top);
    adjustedStyle.setPadding(Edge::Left, left);
    adjustedStyle.setPadding(Edge::Right, right);
    adjustedStyle.setPadding(Edge::Bottom, bottom);
  } else {
    adjustedStyle.setMargin(Edge::Top, top);
    adjustedStyle.setMargin(Edge::Left, left);
    adjustedStyle.setMargin(Edge::Right, right);
    adjustedStyle.setMargin(Edge::Bottom, bottom);
  }

  const auto& currentStyle = yogaNode_.style();
  if (adjustedStyle.padding(Edge::Top) != currentStyle.padding(Edge::Top) ||
      adjustedStyle.padding(Edge::Left) != currentStyle.padding(Edge::Left) ||
      adjustedStyle.padding(Edge::Right) != currentStyle.padding(Edge::Right) ||
      adjustedStyle.padding(Edge::Bottom) !=
          currentStyle.padding(Edge::Bottom) ||
      adjustedStyle.margin(Edge::Top) != currentStyle.margin(Edge::Top) ||
      adjustedStyle.margin(Edge::Left) != currentStyle.margin(Edge::Left) ||
      adjustedStyle.margin(Edge::Right) != currentStyle.margin(Edge::Right) ||
      adjustedStyle.margin(Edge::Bottom) != currentStyle.margin(Edge::Bottom)) {
    yogaNode_.setStyle(adjustedStyle);
    yogaNode_.setDirty(true);
  }
}

} // namespace facebook::react
