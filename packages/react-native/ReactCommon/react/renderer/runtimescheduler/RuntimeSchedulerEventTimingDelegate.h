/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/timing/primitives.h>
#include <unordered_set>

namespace facebook::react {

using SurfaceId = int32_t;

class RuntimeSchedulerEventTimingDelegate {
 public:
  virtual ~RuntimeSchedulerEventTimingDelegate() = default;

  virtual void dispatchPendingEventTimingEntries(
      HighResTimeStamp taskEndTime,
      const std::unordered_set<SurfaceId>&
          surfaceIdsWithPendingRenderingUpdates) = 0;
};

} // namespace facebook::react
