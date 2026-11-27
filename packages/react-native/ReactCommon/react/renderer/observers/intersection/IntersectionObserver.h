/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/components/root/RootShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <memory>
#include <optional>
#include "IntersectionObserverState.h"

namespace facebook::react {

using IntersectionObserverObserverId = int32_t;

// Parse a normalized margin string that's always in the format:
// "top right bottom left" where each value is either "Npx" or "N%".
// The string is already validated and normalized by JS.
// Returns std::nullopt if the margin is a no-op or cannot be parsed.
std::optional<EdgeMargins> parseNormalizedMargin(const std::string &marginStr);

struct IntersectionObserverEntry {
  IntersectionObserverObserverId intersectionObserverId;
  ShadowNodeFamily::Shared shadowNodeFamily;
  Rect targetRect;
  Rect rootRect;
  Rect intersectionRect;
  bool isIntersectingAboveThresholds;
  HighResTimeStamp time;

  bool sameShadowNodeFamily(const ShadowNodeFamily &otherShadowNodeFamily) const
  {
    return std::addressof(*shadowNodeFamily) == std::addressof(otherShadowNodeFamily);
  }
};

class IntersectionObserver {
 public:
  IntersectionObserver(
      IntersectionObserverObserverId intersectionObserverId,
      std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily,
      ShadowNodeFamily::Shared targetShadowNodeFamily,
      std::vector<Float> thresholds,
      std::optional<std::vector<Float>> rootThresholds,
      std::optional<EdgeMargins> rootMargins,
      std::optional<EdgeMargins> scrollMargins);

  // Partially equivalent to
  // https://w3c.github.io/IntersectionObserver/#update-intersection-observations-algo
  std::optional<IntersectionObserverEntry> updateIntersectionObservation(
      const RootShadowNode &rootShadowNode,
      HighResTimeStamp time);

  std::optional<IntersectionObserverEntry> updateIntersectionObservationForSurfaceUnmount(HighResTimeStamp time);

  IntersectionObserverObserverId getIntersectionObserverId() const
  {
    return intersectionObserverId_;
  }

  ShadowNodeFamily::Shared getTargetShadowNodeFamily() const
  {
    return targetShadowNodeFamily_;
  }

  std::vector<Float> getThresholds() const
  {
    return thresholds_;
  }

 private:
  std::optional<IntersectionObserverEntry> setIntersectingState(
      const Rect &rootBoundingRect,
      const Rect &targetBoundingRect,
      const Rect &intersectionRect,
      Float threshold,
      Float rootThreshold,
      HighResTimeStamp time);

  std::optional<IntersectionObserverEntry> setNotIntersectingState(
      const Rect &rootBoundingRect,
      const Rect &targetBoundingRect,
      const Rect &intersectionRect,
      HighResTimeStamp time);

  IntersectionObserverObserverId intersectionObserverId_;
  std::optional<ShadowNodeFamily::Shared> observationRootShadowNodeFamily_;
  ShadowNodeFamily::Shared targetShadowNodeFamily_;
  std::vector<Float> thresholds_;
  std::optional<std::vector<Float>> rootThresholds_;
  // Parsed rootMargin, dilating the root intersection rectangle
  std::optional<EdgeMargins> rootMargins_;
  // Parsed scrollMargin, dilating the clip rect of every scrollport between
  // the root and the target
  std::optional<EdgeMargins> scrollMargins_;
  mutable IntersectionObserverState state_ = IntersectionObserverState::Initial();
};

} // namespace facebook::react
