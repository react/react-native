/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <unordered_map>
#include <vector>
#include "PerformanceEntryBuffer.h"

namespace facebook::react {

class PerformanceEntryKeyedBuffer : public PerformanceEntryBuffer {
 public:
  PerformanceEntryKeyedBuffer() = default;

  void add(const PerformanceEntry& entry) override;

  void getEntries(std::vector<PerformanceEntry>& target) const override;

  void getEntries(
      std::vector<PerformanceEntry>& target,
      const std::string& name) const override;

  void clear() override;
  void clear(const std::string& name) override;

  std::optional<PerformanceEntry> find(const std::string& name) const;

 private:
  std::unordered_map<std::string, std::vector<PerformanceEntry>> entryMap_{};
};

} // namespace facebook::react
