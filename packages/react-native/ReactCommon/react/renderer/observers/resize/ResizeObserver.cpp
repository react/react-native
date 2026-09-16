/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ResizeObserver.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeTraits.h>
#include <algorithm>
#include <cmath>
#include <utility>

namespace facebook::react {

namespace {

const ShadowNode* FOLLY_NULLABLE
getTargetShadowNode(const ShadowNodeFamily::AncestorList& ancestors) {
  if (ancestors.empty()) {
    return nullptr;
  }

  const auto& parentChildPair = ancestors.back();
  return parentChildPair.first.get()
      .getChildren()
      .at(parentChildPair.second)
      .get();
}

bool isHidden(const ShadowNode& shadowNode) {
  // `display: 'none'` sets the Hidden trait when props commit, possibly before
  // layout updates `displayType`.
  if (shadowNode.getTraits().check(ShadowNodeTraits::Trait::Hidden)) {
    return true;
  }

  if (const auto* layoutableShadowNode =
          dynamic_cast<const LayoutableShadowNode*>(&shadowNode)) {
    return layoutableShadowNode->getLayoutMetrics().displayType ==
        DisplayType::None;
  }

  return false;
}

// Descendants of a `display: none` node are not laid out, so their own layout
// metrics are not a size we can report.
bool hasHiddenAncestor(const ShadowNodeFamily::AncestorList& ancestors) {
  return std::any_of(
      ancestors.begin(), ancestors.end(), [](const auto& parentChildPair) {
        return isHidden(parentChildPair.first.get());
      });
}

Size getObservedSize(
    ResizeObserverBoxOptions boxOptions,
    Size borderBoxSize,
    Size contentBoxSize,
    Size devicePixelContentBoxSize) {
  if (boxOptions == ResizeObserverBoxOptions::ContentBox) {
    return contentBoxSize;
  }
  if (boxOptions == ResizeObserverBoxOptions::DevicePixelContentBox) {
    return devicePixelContentBoxSize;
  }
  return borderBoxSize;
}

ResizeObserverEntry makeResizeObserverEntry(
    ResizeObserverObserverId resizeObserverId,
    const ShadowNodeFamily::Shared& targetShadowNodeFamily,
    Size borderBoxSize,
    Size contentBoxSize,
    Size devicePixelContentBoxSize,
    Rect contentRect) {
  return ResizeObserverEntry{
      .resizeObserverId = resizeObserverId,
      .shadowNodeFamily = targetShadowNodeFamily,
      .contentRect = contentRect,
      .borderBoxSize = borderBoxSize,
      .contentBoxSize = contentBoxSize,
      .devicePixelContentBoxSize = devicePixelContentBoxSize};
}

} // namespace

ResizeObserver::ResizeObserver(
    ResizeObserverObserverId resizeObserverId,
    ShadowNodeFamily::Shared targetShadowNodeFamily,
    ResizeObserverBoxOptions boxOptions,
    uint64_t observationSequence)
    : resizeObserverId_{resizeObserverId},
      targetShadowNodeFamily_{std::move(targetShadowNodeFamily)},
      boxOptions_{boxOptions},
      observationSequence_{observationSequence} {}

ResizeObservationResult ResizeObserver::computeActiveObservation(
    const RootShadowNode& rootShadowNode) const {
  auto ancestors = targetShadowNodeFamily_->getAncestors(rootShadowNode);
  const auto* targetShadowNode = getTargetShadowNode(ancestors);

  // Spec "calculate depth for node": number of nodes on the parent-traversal
  // path from the target to the root (inclusive). `ancestors` excludes the
  // target, so add one.
  ResizeObservationResult result{};
  result.targetDepth = ancestors.size() + 1;

  if (targetShadowNode == nullptr) {
    // Target left the tree. Per spec, removal fires one final 0x0 entry. Keep
    // `lastReportedSize_` at 0x0 so we don't re-deliver, and mark detached to
    // stop re-checking until it's reinserted (via the dirty-family path).
    // Every box is 0x0, so the observed box is too, whichever was requested.
    auto zeroSize = Size{.width = 0, .height = 0};
    auto observedSize = zeroSize;

    result.detached = true;

    const auto alreadyDelivered = lastReportedSize_.has_value() &&
        lastReportedSize_.value() == observedSize;
    if (alreadyDelivered) {
      return result;
    }

    result.observedSize = observedSize;
    result.entry = makeResizeObserverEntry(
        resizeObserverId_,
        targetShadowNodeFamily_,
        zeroSize,
        zeroSize,
        zeroSize,
        Rect{.origin = {.x = 0, .y = 0}, .size = zeroSize});
    return result;
  }

  const auto isInitialDelivery = !lastReportedSize_.has_value();

  // Per spec, `display: none` reports zero-sized boxes. Use the Hidden trait
  // instead of possibly-stale layout metrics and check ancestors.
  if (isHidden(*targetShadowNode) || hasHiddenAncestor(ancestors)) {
    auto zeroSize = Size{.width = 0, .height = 0};
    auto zeroContentRect = Rect{.origin = {.x = 0, .y = 0}, .size = zeroSize};
    auto observedSize = zeroSize;

    // Exact float comparison is intentional: each pass recomputes the size from
    // the same layout metrics, so an unchanged box compares equal with no
    // accumulated error.
    if (!isInitialDelivery && lastReportedSize_.value() == observedSize) {
      return result;
    }

    result.observedSize = observedSize;
    result.entry = makeResizeObserverEntry(
        resizeObserverId_,
        targetShadowNodeFamily_,
        zeroSize,
        zeroSize,
        zeroSize,
        zeroContentRect);
    return result;
  }

  // Only the target's size matters here, never its position, so we read its own
  // layout metrics instead of computing viewport-relative ones.
  const auto* layoutableShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(targetShadowNode);

  // Not layoutable, so there is no size to report. Observed targets are always
  // host components, so this is not expected to happen.
  if (layoutableShadowNode == nullptr) {
    return result;
  }

  auto layoutMetrics = layoutableShadowNode->getLayoutMetrics();
  auto borderBoxSize = layoutMetrics.frame.size;

  // RN's `contentInsets` is border + padding per side, matching the Web
  // content-box. Clamp to zero: a frame can be smaller than its insets, but a
  // content box is never negative.
  auto contentFrame = layoutMetrics.getContentFrame();
  auto contentBoxSize = Size{
      .width = std::max(Float{0}, contentFrame.size.width),
      .height = std::max(Float{0}, contentFrame.size.height)};

  // Per spec, `contentRect`'s origin is the offset of the content box from
  // the padding box (i.e. the paddings only, excluding borders).
  // https://w3c.github.io/csswg-drafts/resize-observer/#dom-resizeobserverentry-contentrect
  auto contentRect = Rect{
      .origin =
          {.x = layoutMetrics.contentInsets.left -
               layoutMetrics.borderWidth.left,
           .y =
               layoutMetrics.contentInsets.top - layoutMetrics.borderWidth.top},
      .size = contentBoxSize};

  // Per spec the device-pixel-content-box holds integers. Round each axis
  // (best-effort: we have no pixel-snapped origin or sibling to align to).
  auto devicePixelContentBoxSize = Size{
      .width =
          std::round(contentBoxSize.width * layoutMetrics.pointScaleFactor),
      .height =
          std::round(contentBoxSize.height * layoutMetrics.pointScaleFactor)};

  auto observedSize = getObservedSize(
      boxOptions_, borderBoxSize, contentBoxSize, devicePixelContentBoxSize);

  // Skip when the observed box is unchanged. The first delivery always runs
  // (including 0x0 content-box), matching browser behavior on `observe()`.
  if (!isInitialDelivery && lastReportedSize_.value() == observedSize) {
    return result;
  }

  result.observedSize = observedSize;
  result.entry = makeResizeObserverEntry(
      resizeObserverId_,
      targetShadowNodeFamily_,
      borderBoxSize,
      contentBoxSize,
      devicePixelContentBoxSize,
      contentRect);
  return result;
}

void ResizeObserver::markAsReported(const ResizeObservationResult& result) {
  // Only broadcast results carry a size to report; marking anything else
  // would regress `lastReportedSize_` to 0x0.
  react_native_assert(result.entry.has_value());

  lastReportedSize_ = result.observedSize;
  detached_ = result.detached;
}

} // namespace facebook::react
