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
#include <utility>

namespace facebook::react {

// Parse a normalized rootMargin string that's always in the format:
// "top right bottom left" where each value is either "Npx" or "N%"
// The string is already validated and normalized by JS.
// Returns a vector of 4 MarginValue structures (top, right, bottom, left).
// Returns an empty vector if parsing fails.
std::vector<MarginValue> parseNormalizedRootMargin(
    const std::string& marginStr) {
  // If unset or set to default, return empty so we don't apply any margins
  if (marginStr.empty() || marginStr == "0px 0px 0px 0px") {
    return {};
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
      // Only support px units for rootMargin (per W3C spec)
      if (length.unit != CSSLengthUnit::Px) {
        return {};
      }
      values.push_back({length.value, false});
    } else if (std::holds_alternative<CSSPercentage>(parsed)) {
      auto percentage = std::get<CSSPercentage>(parsed);
      values.push_back({percentage.value, true});
    } else {
      // Invalid token
      return {};
    }
  }

  // Should have exactly 4 values since JS normalizes to this format
  if (values.size() != 4) {
    return {};
  }

  return values;
}

namespace {

// Convert margin values to actual pixel values based on root rect.
// Per W3C spec: top/bottom percentages use height, left/right use width.
EdgeInsets calculateRootMarginInsets(
    const std::vector<MarginValue>& margins,
    const Rect& rootRect) {
  Float top = margins[0].isPercentage
      ? (margins[0].value / 100.0f) * rootRect.size.height
      : margins[0].value;
  Float right = margins[1].isPercentage
      ? (margins[1].value / 100.0f) * rootRect.size.width
      : margins[1].value;
  Float bottom = margins[2].isPercentage
      ? (margins[2].value / 100.0f) * rootRect.size.height
      : margins[2].value;
  Float left = margins[3].isPercentage
      ? (margins[3].value / 100.0f) * rootRect.size.width
      : margins[3].value;

  return EdgeInsets{left, top, right, bottom};
}

} // namespace

IntersectionObserver::IntersectionObserver(
    IntersectionObserverObserverId intersectionObserverId,
    std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily,
    ShadowNodeFamily::Shared targetShadowNodeFamily,
    std::vector<Float> thresholds,
    std::optional<std::vector<Float>> rootThresholds,
    std::vector<MarginValue> rootMargins)
    : intersectionObserverId_(intersectionObserverId),
      observationRootShadowNodeFamily_(
          std::move(observationRootShadowNodeFamily)),
      targetShadowNodeFamily_(std::move(targetShadowNodeFamily)),
      thresholds_(std::move(thresholds)),
      rootThresholds_(std::move(rootThresholds)),
      rootMargins_(std::move(rootMargins)) {}

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

static Rect getClippedTargetBoundingRect(
    const ShadowNodeFamily::AncestorList& targetAncestors) {
  auto layoutMetrics = LayoutableShadowNode::computeRelativeLayoutMetrics(
      targetAncestors,
      {/* .includeTransform = */ .includeTransform = true,
       /* .includeViewportOffset = */ .includeViewportOffset = true,
       /* .applyParentClipping = */ .enableOverflowClipping = true});

  return layoutMetrics == EmptyLayoutMetrics ? Rect{} : layoutMetrics.frame;
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
    const Rect& rootMarginBoundingRect,
    const Rect& targetBoundingRect,
    const ShadowNodeFamily::AncestorList& targetToRootAncestors,
    bool hasExplicitRoot) {
  // Use intersectOrNull to properly distinguish between edge-adjacent
  // (valid intersection) and separated rectangles (no intersection)
  auto absoluteIntersectionRect =
      intersectOrNull(rootMarginBoundingRect, targetBoundingRect);
  if (!absoluteIntersectionRect.has_value()) {
    return std::nullopt;
  }

  // Coordinates of the target after clipping the parts hidden by a parent,
  // until till the root (e.g.: in scroll views, or in views with a parent with
  // overflow: hidden)
  auto clippedTargetFromRoot =
      getClippedTargetBoundingRect(targetToRootAncestors);

  // Use root origin (without rootMargins) to translate coordinates of
  // clippedTarget from relative to root, to top-level coordinate system
  auto clippedTargetBoundingRect = hasExplicitRoot ? Rect{
      .origin= rootBoundingRect.origin + clippedTargetFromRoot.origin,
      .size=clippedTargetFromRoot.size}
      : clippedTargetFromRoot;

  return intersectOrNull(rootMarginBoundingRect, clippedTargetBoundingRect);
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
  if (!rootMargins_.empty()) {
    // Calculate the actual insets based on current root dimensions
    // (converts percentages to pixels)
    auto insets = calculateRootMarginInsets(rootMargins_, rootBoundingRect);
    // Use outsetBy to expand the root rect (positive values expand, negative
    // contract)
    rootMarginBoundingRect = outsetBy(rootBoundingRect, insets);
  }

  auto targetAncestors = targetShadowNodeFamily_->getAncestors(rootShadowNode);

  // Absolute coordinates of the target
  auto targetBoundingRect = getBoundingRect(targetAncestors);

  if ((hasExplicitRoot && rootAncestors.empty()) || targetAncestors.empty()) {
    // If observation root or target is not a descendant of `rootShadowNode`
    return setNotIntersectingState(
        rootMarginBoundingRect, targetBoundingRect, {}, time);
  }

  auto targetToRootAncestors = hasExplicitRoot
      ? targetShadowNodeFamily_->getAncestors(*getShadowNode(rootAncestors))
      : targetAncestors;

  auto intersection = computeIntersection(
      rootBoundingRect,
      rootMarginBoundingRect,
      targetBoundingRect,
      targetToRootAncestors,
      hasExplicitRoot);

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
