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
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/Size.h>
#include <cstdint>
#include <optional>

namespace facebook::react {

using ResizeObserverObserverId = int32_t;

// Corresponds to the `box` option of `ResizeObserver#observe`.
// https://w3c.github.io/csswg-drafts/resize-observer/#resize-observer-box-options
enum class ResizeObserverBoxOptions { ContentBox, BorderBox, DevicePixelContentBox };

struct ResizeObserverEntry {
  ResizeObserverObserverId resizeObserverId;
  ShadowNodeFamily::Shared shadowNodeFamily;
  Rect contentRect;
  Size borderBoxSize;
  Size contentBoxSize;
  Size devicePixelContentBoxSize;
};

struct ResizeObservationResult {
  // Set when the observed box changed (i.e. the observation is active).
  std::optional<ResizeObserverEntry> entry;
  // The size to store in `lastReportedSize_` when this is broadcast.
  Size observedSize{};
  // Spec "calculate depth for node": nodes on the path from target to root.
  size_t targetDepth{0};
  // Whether the target was found outside the tree.
  bool detached{false};
};

class ResizeObserver {
 public:
  ResizeObserver(
      ResizeObserverObserverId resizeObserverId,
      ShadowNodeFamily::Shared targetShadowNodeFamily,
      ResizeObserverBoxOptions boxOptions,
      uint64_t observationSequence);

  // Computes whether the observation is active and builds a pending entry. It
  // must not change any state that decides future deliveries: a skipped
  // observation has to stay active for a later round.
  ResizeObservationResult computeActiveObservation(const RootShadowNode &rootShadowNode) const;

  // Applies the state the spec assigns during broadcast.
  void markAsReported(const ResizeObservationResult &result);

  // Records detachment for a pass that produced no entry. Without this, a
  // target whose final 0x0 was suppressed as a duplicate would never be marked
  // detached, and so would be recomputed on every later commit.
  void updateDetachedState(bool detached)
  {
    detached_ = detached;
  }

  ResizeObserverObserverId getResizeObserverId() const
  {
    return resizeObserverId_;
  }

  ShadowNodeFamily::Shared getTargetShadowNodeFamily() const
  {
    return targetShadowNodeFamily_;
  }

  // Monotonic order of `observe()` registration for this observation.
  uint64_t getObservationSequence() const
  {
    return observationSequence_;
  }

  // Still awaiting its first delivery (just registered, or target removed).
  bool needsInitialDeliveryCheck() const
  {
    return !lastReportedSize_.has_value();
  }

  // Whether the target left the tree and its final 0x0 entry was already
  // delivered; such observations stay quiet until reinserted (dirty path).
  bool hasDeliveredDetachedState() const
  {
    return detached_ && lastReportedSize_.has_value();
  }

 private:
  ResizeObserverObserverId resizeObserverId_;
  ShadowNodeFamily::Shared targetShadowNodeFamily_;
  ResizeObserverBoxOptions boxOptions_;
  uint64_t observationSequence_;

  // Last delivered observed-box size; empty until the first entry.
  std::optional<Size> lastReportedSize_;

  // True once the detached target's final 0x0 entry was delivered; cleared as
  // soon as the target is found attached again.
  bool detached_{false};
};

} // namespace facebook::react
