/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>
#include "PerformanceEntry.h"

namespace facebook::react {

// Default duration threshold for reporting performance entries (0 means "report
// all")
constexpr HighResDuration DEFAULT_DURATION_THRESHOLD = HighResDuration::zero();

/**
 * Abstract performance entry buffer with reporting flags.
 * Subtypes differ on how entries are stored.
 */
class PerformanceEntryBuffer {
 public:
  HighResDuration durationThreshold = DEFAULT_DURATION_THRESHOLD;
  size_t droppedEntriesCount{0};

  explicit PerformanceEntryBuffer() = default;
  virtual ~PerformanceEntryBuffer() = default;

  virtual void add(const PerformanceEntry& entry) = 0;
  virtual void getEntries(std::vector<PerformanceEntry>& target) const = 0;
  virtual void getEntries(
      std::vector<PerformanceEntry>& target,
      const std::string& name) const = 0;
  virtual void clear() = 0;
  virtual void clear(const std::string& name) = 0;
};

} // namespace facebook::react
