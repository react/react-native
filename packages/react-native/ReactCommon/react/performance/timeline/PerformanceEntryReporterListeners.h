/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "PerformanceEntry.h"

#include <folly/dynamic.h>
#include <react/timing/primitives.h>

namespace facebook::react {

using UserTimingDetailProvider = std::function<folly::dynamic()>;

class PerformanceEntryReporterEventListener {
 public:
  virtual ~PerformanceEntryReporterEventListener() = default;

  virtual void onMeasureEntry(
      const PerformanceMeasure& /*entry*/,
      const std::optional<UserTimingDetailProvider>& /*detailProvider*/) {}

  virtual void onEventTimingEntry(const PerformanceEventTiming& /*entry*/) {}
};

} // namespace facebook::react
