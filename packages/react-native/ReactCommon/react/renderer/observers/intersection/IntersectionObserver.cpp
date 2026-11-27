/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "IntersectionObserver.h"
#include <react/debug/react_native_assert.h>
#include <react/renderer/core/LayoutMetrics.h>
#include <react/renderer/core/LayoutableShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <iterator>
#include <utility>

namespace facebook::react {

// Parse a normalized margin string that's always in the format:
// "top right bottom left" where each value is either "Npx" or "N%"
// The string is already validated and normalized by JS.
// Returns std::nullopt if the margin is a no-op or parsing fails.
std::optional<EdgeMargins> parseNormalizedMargin(const std::string& marginStr) {
  // If unset or set to default, return nullopt so we don't apply any margins
  if (marginStr.empty() || marginStr == "0px 0px 0px 0px") {
    return std::nullopt;
  }

  std::vector<MarginValue> values;
  CSSSyntaxParser syntaxParser(marginStr);
  CSSValueParser valueParser(syntaxParser);

  // Parse exactly 4 space-separated values
  while (!syntaxParser.isFinished() && values.size() < 4) {
    syntaxParser.consumeWhitespace();
    if (syntaxParser.isFinished()) {
      break;
    }

    auto parsed = valueParser.parseNextValue<CSSLength, CSSPercentage>();

    if (std::holds_alternative<CSSLength>(parsed)) {
      auto length = std::get<CSSLength>(parsed);
      // Only support px units for margins (per W3C spec)
      if (length.unit != CSSLengthUnit::Px) {
        return std::nullopt;
      }
      values.push_back({length.value, false});
    } else if (std::holds_alternative<CSSPercentage>(parsed)) {
      auto percentage = std::get<CSSPercentage>(parsed);
      values.push_back({percentage.value, true});
    } else {
      // Invalid token
      return std::nullopt;
    }
  }

  // Should have exactly 4 values since JS normalizes to this format
  if (values.size() != 4) {
    return std::nullopt;
  }

  return EdgeMargins{
      .left = values[3],
      .top = values[0],
      .right = values[1],
      .bottom = values[2]};
}

IntersectionObserver::IntersectionObserver(
    IntersectionObserverObserverId intersectionObserverId,
    std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily,
    ShadowNodeFamily::Shared targetShadowNodeFamily,
    std::vector<Float> thresholds,
    std::optional<std::vector<Float>> rootThresholds,
    std::optional<EdgeMargins> rootMargins,
    std::optional<EdgeMargins> scrollMargins)
    : intersectionObserverId_(intersectionObserverId),
      observationRootShadowNodeFamily_(
          std::move(observationRootShadowNodeFamily)),
      targetShadowNodeFamily_(std::move(targetShadowNodeFamily)),
      thresholds_(std::move(thresholds)),
      rootThresholds_(std::move(rootThresholds)),
      rootMargins_(rootMargins),
      scrollMargins_(scrollMargins) {}

static std::shared_ptr<const ShadowNode> getShadowNode(
    const ShadowNodeFamily::AncestorList& ancestors) {
  if (ancestors.empty()) {
    return nullptr;
  }

  const auto& lastAncestor = ancestors.back();
  const ShadowNode& parentNode = lastAncestor.first.get();
  int childIndex = lastAncestor.second;

  const std::shared_ptr<const ShadowNode>& childNode =
      parentNode.getChildren().at(childIndex);
  return childNode;
}

static Rect getRootNodeBoundingRect(const RootShadowNode& rootShadowNode) {
  const auto layoutableRootShadowNode =
      dynamic_cast<const LayoutableShadowNode*>(&rootShadowNode);

  react_native_assert(
      layoutableRootShadowNode != nullptr &&
      "RootShadowNode instances must always inherit from LayoutableShadowNode.");

  auto layoutMetrics = layoutableRootShadowNode->getLayoutMetrics();

  if (layoutMetrics == EmptyLayoutMetrics ||
      layoutMetrics.displayType == DisplayType::None) {
    return Rect{};
  }

  // Apply the transform to translate the root view to its location in the
  // viewport.
  return layoutMetrics.frame * layoutableRootShadowNode->getTransform();
}

static Rect getBoundingRect(const ShadowNodeFamily::AncestorList& ancestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      ancestors,
      {/* .includeTransform = */ .includeTransform = true,
       /* .includeViewportOffset = */ .includeViewportOffset = true});
  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
}

// Returns std::nullopt if the target is entirely clipped by an ancestor.
static std::optional<Rect> getClippedTargetBoundingRect(
    const ShadowNodeFamily::AncestorList& targetAncestors,
    const std::optional<EdgeMargins>& scrollMargins) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      targetAncestors,
      {/* .includeTransform = */ .includeTransform = true,
       /* .includeViewportOffset = */ .includeViewportOffset = true,
       /* .applyParentClipping = */ .enableOverflowClipping = true,
       /* .clipSpecifiedAncestor = */ .clipSpecifiedAncestor = false,
       /* .clipMargin = */ .clipMargin = scrollMargins});

  if (layoutMetrics == EmptyLayoutMetrics) {
    return std::nullopt;
  }
  return layoutMetrics.frame;
}

// Distinguishes between edge-adjacent vs. no intersection
static std::optional<Rect> intersectOrNull(
    const Rect& rect1,
    const Rect& rect2) {
  auto result = Rect::intersect(rect1, rect2);
  // Check if the result has zero area (could be empty or degenerate)
  if (result.size.width == 0 || result.size.height == 0) {
    // Check if origin is within both rectangles (touching case)
    bool originInRect1 = result.origin.x >= rect1.getMinX() &&
        result.origin.x <= rect1.getMaxX() &&
        result.origin.y >= rect1.getMinY() &&
        result.origin.y <= rect1.getMaxY();

    bool originInRect2 = result.origin.x >= rect2.getMinX() &&
        result.origin.x <= rect2.getMaxX() &&
        result.origin.y >= rect2.getMinY() &&
        result.origin.y <= rect2.getMaxY();

    if (!originInRect1 || !originInRect2) {
      // No actual intersection - rectangles are separated
      return std::nullopt;
    }
  }

  // Valid intersection (including degenerate edge/corner cases)
  return result;
}

// Partially equivalent to
// https://w3c.github.io/IntersectionObserver/#calculate-intersection-rect-algo
static std::optional<Rect> computeIntersection(
    const Rect& rootBoundingRect,
    const Rect& rootClipRect,
    const Rect& targetBoundingRect,
    const ShadowNodeFamily::AncestorList& targetToRootAncestors,
    bool hasExplicitRoot,
    const std::optional<EdgeMargins>& scrollMargins) {
  // Use intersectOrNull to properly distinguish between edge-adjacent
  // (valid intersection) and separated rectangles (no intersection)
  auto absoluteIntersectionRect =
      intersectOrNull(rootClipRect, targetBoundingRect);
  if (!absoluteIntersectionRect.has_value()) {
    return std::nullopt;
  }

  // Clip against ancestors until the observation root, dilating only
  // scroll-container clips by scrollMargin. Other content clips stay unchanged.
  // The root's clip is handled by the final intersection with rootClipRect.
  auto clippedTargetFromRoot =
      getClippedTargetBoundingRect(targetToRootAncestors, scrollMargins);
  if (!clippedTargetFromRoot.has_value()) {
    // Don't fall through with an empty rect: at the origin, it would count as
    // edge-adjacent to any root rect containing the origin.
    return std::nullopt;
  }

  // Use root origin (without rootMargins) to translate coordinates of
  // clippedTarget from relative to root, to top-level coordinate system
  auto clippedTargetBoundingRect = hasExplicitRoot ? Rect{
      .origin= rootBoundingRect.origin + clippedTargetFromRoot->origin,
      .size=clippedTargetFromRoot->size}
      : *clippedTargetFromRoot;

  return intersectOrNull(rootClipRect, clippedTargetBoundingRect);
}

static Float getHighestThresholdCrossed(
    Float intersectionRatio,
    const std::vector<Float>& thresholds) {
  Float highestThreshold = -1.0f;
  for (auto threshold : thresholds) {
    if (intersectionRatio >= threshold) {
      highestThreshold = threshold;
    }
  }
  return highestThreshold;
}

// Partially equivalent to
// https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
std::optional<IntersectionObserverEntry>
IntersectionObserver::updateIntersectionObservation(
    const RootShadowNode& rootShadowNode,
    HighResTimeStamp time) {
  bool hasExplicitRoot = observationRootShadowNodeFamily_.has_value();

  auto rootAncestors = hasExplicitRoot
      ? observationRootShadowNodeFamily_.value()->getAncestors(rootShadowNode)
      : ShadowNodeFamily::AncestorList{};

  // Absolute coordinates of the root
  auto rootBoundingRect = hasExplicitRoot
      ? getBoundingRect(rootAncestors)
      : getRootNodeBoundingRect(rootShadowNode);

  auto rootMarginBoundingRect = rootBoundingRect;

  // Apply rootMargin to expand/contract the root bounding rect
  if (rootMargins_.has_value()) {
    // Calculate the actual insets based on current root dimensions
    // (converts percentages to pixels)
    auto insets = resolveEdgeMargins(*rootMargins_, rootBoundingRect.size);
    // Use outsetBy to expand the root rect (positive values expand, negative
    // contract)
    rootMarginBoundingRect = outsetBy(rootBoundingRect, insets);
  }

  // Per spec, scrollMargin also applies to a scrollable root. It only dilates
  // the rect targets are clipped against, not `rootBounds` (the root
  // intersection rectangle, which only rootMargin dilates).
  auto rootClipRect = rootMarginBoundingRect;
  if (scrollMargins_.has_value() && hasExplicitRoot) {
    auto observationRootNode = getShadowNode(rootAncestors);
    if (observationRootNode != nullptr &&
        observationRootNode->getTraits().check(
            ShadowNodeTraits::Trait::FormsScrollContainer)) {
      rootClipRect = outsetBy(
          rootClipRect,
          resolveEdgeMargins(*scrollMargins_, rootBoundingRect.size));
    }
  }

  auto targetAncestors = targetShadowNodeFamily_->getAncestors(rootShadowNode);

  // Absolute coordinates of the target
  auto targetBoundingRect = getBoundingRect(targetAncestors);

  if ((hasExplicitRoot && rootAncestors.empty()) || targetAncestors.empty()) {
    // If observation root or target is not a descendant of `rootShadowNode`
    return setNotIntersectingState(
        rootMarginBoundingRect, targetBoundingRect, {}, time);
  }

  ShadowNodeFamily::AncestorList targetToRootAncestors;
  if (hasExplicitRoot && targetAncestors.size() > rootAncestors.size() &&
      &targetAncestors[rootAncestors.size()].first.get() ==
          getShadowNode(rootAncestors).get()) {
    targetToRootAncestors.assign(
        targetAncestors.begin() + std::ssize(rootAncestors),
        targetAncestors.end());
  }

  auto intersection = computeIntersection(
      rootBoundingRect,
      rootClipRect,
      targetBoundingRect,
      hasExplicitRoot ? targetToRootAncestors : targetAncestors,
      hasExplicitRoot,
      scrollMargins_);

  auto intersectionRect =
      intersection.has_value() ? intersection.value() : Rect{};

  Float targetBoundingRectArea =
      targetBoundingRect.size.width * targetBoundingRect.size.height;
  auto intersectionRectArea =
      intersectionRect.size.width * intersectionRect.size.height;

  Float intersectionRatio =
      targetBoundingRectArea == 0 // prevent division by zero
      ? 0
      : intersectionRectArea / targetBoundingRectArea;

  if (!intersection.has_value()) {
    return setNotIntersectingState(
        rootMarginBoundingRect, targetBoundingRect, intersectionRect, time);
  }

  auto highestThresholdCrossed =
      getHighestThresholdCrossed(intersectionRatio, thresholds_);

  auto highestRootThresholdCrossed = -1.0f;
  if (rootThresholds_.has_value()) {
    Float rootMarginBoundingRectArea =
        rootMarginBoundingRect.size.width * rootMarginBoundingRect.size.height;
    Float rootThresholdIntersectionRatio = rootMarginBoundingRectArea == 0
        ? 0
        : intersectionRectArea / rootMarginBoundingRectArea;
    highestRootThresholdCrossed = getHighestThresholdCrossed(
        rootThresholdIntersectionRatio, rootThresholds_.value());
  }

  if (highestThresholdCrossed == -1.0f &&
      highestRootThresholdCrossed == -1.0f) {
    return setNotIntersectingState(
        rootMarginBoundingRect, targetBoundingRect, intersectionRect, time);
  }

  return setIntersectingState(
      rootMarginBoundingRect,
      targetBoundingRect,
      intersectionRect,
      highestThresholdCrossed,
      highestRootThresholdCrossed,
      time);
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::updateIntersectionObservationForSurfaceUnmount(
    HighResTimeStamp time) {
  return setNotIntersectingState(Rect{}, Rect{}, Rect{}, time);
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::setIntersectingState(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const Rect& intersectionRect,
    Float threshold,
    Float rootThreshold,
    HighResTimeStamp time) {
  auto newState =
      IntersectionObserverState::Intersecting(threshold, rootThreshold);

  if (state_ != newState) {
    state_ = newState;
    IntersectionObserverEntry entry{
        .intersectionObserverId = intersectionObserverId_,
        .shadowNodeFamily = targetShadowNodeFamily_,
        .targetRect = targetBoundingRect,
        .rootRect = rootBoundingRect,
        .intersectionRect = intersectionRect,
        .isIntersectingAboveThresholds = true,
        .time = time,
    };
    return std::optional<IntersectionObserverEntry>{std::move(entry)};
  }

  return std::nullopt;
}

std::optional<IntersectionObserverEntry>
IntersectionObserver::setNotIntersectingState(
    const Rect& rootBoundingRect,
    const Rect& targetBoundingRect,
    const Rect& intersectionRect,
    HighResTimeStamp time) {
  if (state_ != IntersectionObserverState::NotIntersecting()) {
    state_ = IntersectionObserverState::NotIntersecting();
    IntersectionObserverEntry entry{
        .intersectionObserverId = intersectionObserverId_,
        .shadowNodeFamily = targetShadowNodeFamily_,
        .targetRect = targetBoundingRect,
        .rootRect = rootBoundingRect,
        .intersectionRect = intersectionRect,
        .isIntersectingAboveThresholds = false,
        .time = time,
    };
    return std::optional<IntersectionObserverEntry>(std::move(entry));
  }

  return std::nullopt;
}

} // namespace facebook::react
