/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "folly/json/dynamic.h"

#include <functional>
#include <optional>
#include <vector>

namespace facebook::react {

struct BufferEvent {
  uint64_t start;
  uint64_t end;
  std::string name;
  std::string track;
};

/**
 * @deprecated Replaced by jsinspector_modern::PerformanceTracer and will be
 * removed when we delete FuseboxPerfettoDataSource.
 */
class FuseboxTracer {
 public:
  FuseboxTracer(const FuseboxTracer&) = delete;

  bool isTracing();
  // Verifies that tracing isn't started and starts tracing all in one step.
  // Returns true if we were able to successful start tracing.
  bool startTracing();
  // Verifies that we're tracing and dumps the trace all in one step to avoid
  // TOCTOU bugs. Returns false if we're not tracing. No result callbacks
  // are expected in that scenario.
  bool stopTracing(const std::function<void(const folly::dynamic& eventsChunk)>&
                       resultCallback);
  bool stopTracingAndWriteToFile(const std::string& path);
  void addEvent(
      const std::string_view& name,
      uint64_t start,
      uint64_t end,
      const std::optional<std::string_view>& track);

  static FuseboxTracer& getFuseboxTracer();

 private:
  FuseboxTracer() {}

  bool tracing_{false};
  std::vector<BufferEvent> buffer_;
  std::mutex mutex_;
};

} // namespace facebook::react
