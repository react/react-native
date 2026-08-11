/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_set>

namespace facebook::react {

using SurfaceId = int32_t;

class RuntimeSchedulerIntersectionObserverDelegate {
 public:
  virtual ~RuntimeSchedulerIntersectionObserverDelegate() = default;

  virtual void updateIntersectionObservations(
      const std::unordered_set<SurfaceId>&
          surfaceIdsWithPendingRenderingUpdates) = 0;
};

} // namespace facebook::react
