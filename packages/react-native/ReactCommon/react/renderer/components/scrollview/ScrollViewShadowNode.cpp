/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ScrollViewShadowNode.h"

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutMetrics.h>

namespace facebook::react {

// NOLINTNEXTLINE(facebook-hte-CArray)
const char ScrollViewComponentName[] = "ScrollView";

void ScrollViewShadowNode::updateStateIfNeeded() {
  ensureUnsealed();

  auto contentBoundingRect = Rect{};
  for (const auto& childNode : getLayoutableChildNodes()) {
    contentBoundingRect.unionInPlace(childNode->getLayoutMetrics().frame);
  }

  auto state = getStateData();

  if (state.contentBoundingRect != contentBoundingRect) {
    state.contentBoundingRect = contentBoundingRect;
#ifndef ANDROID
    // RTL scroll views start on the right until the native view reports.
    if (getState()->getRevision() == State::initialRevisionValue &&
        getLayoutMetrics().layoutDirection == LayoutDirection::RightToLeft &&
        state.contentOffset.x == 0) {
      state.contentOffset.x =
          contentBoundingRect.size.width - getLayoutMetrics().frame.size.width;
    }
#endif
    setStateData(std::move(state));
  }
}

void ScrollViewShadowNode::updateScrollContentOffsetIfNeeded() {
#ifndef ANDROID
  if (getLayoutMetrics().layoutDirection == LayoutDirection::RightToLeft) {
    // Yoga places `contentView` on the right side of `scrollView` when RTL
    // layout is enforced. To correct for this, in RTL setting, correct the
    // frame's origin. React Native Classic does this as well in
    // `RCTScrollContentShadowView.m`.
    for (auto layoutableNode : getLayoutableChildNodes()) {
      auto layoutMetrics = layoutableNode->getLayoutMetrics();
      if (layoutMetrics.frame.origin.x != 0) {
        layoutMetrics.frame.origin.x = 0;
        layoutableNode->setLayoutMetrics(layoutMetrics);
      }
    }
  }
#endif
}

ScrollViewState ScrollViewShadowNode::initialStateData(
    const Props::Shared& props,
    const ShadowNodeFamily::Shared& /*family*/,
    const ComponentDescriptor& /*componentDescriptor*/) {
  return {static_cast<const ScrollViewProps&>(*props).contentOffset, {}, 0};
}

#pragma mark - LayoutableShadowNode

void ScrollViewShadowNode::layout(LayoutContext layoutContext) {
  ConcreteViewShadowNode::layout(layoutContext);
  updateScrollContentOffsetIfNeeded();
  updateStateIfNeeded();
}

Point ScrollViewShadowNode::getContentOriginOffset(
    bool includeTransform) const {
  auto stateData = getStateData();
  auto contentOffset = stateData.contentOffset;
  auto transform = includeTransform ? getTransform() : Transform::Identity();
  auto result = transform *
      Vector{
          .x = -contentOffset.x, .y = -contentOffset.y, .z = 0.0f, .w = 1.0f};

  return {
      .x = result.x,
      .y = result.y + static_cast<float>(stateData.scrollAwayPaddingTop)};
}
} // namespace facebook::react
