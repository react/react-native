/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>
#include <jsi/jsi.h>
#include <react/performance/timeline/PerformanceEntry.h>
#include <react/performance/timeline/PerformanceEntryReporterListeners.h>
#include <react/timing/primitives.h>

namespace facebook::react {

/**
 * [Experimental] Reports new Performance Issues via the
 * "__react_native_perf_issues_reporter" runtime binding.
 *
 * This populates the Perf Issues indicator in the V2 Perf Monitor. Events are
 * reported immediately and do not require an active CDP Tracing session.
 */
class CdpPerfIssuesReporter : public PerformanceEntryReporterEventListener {
 public:
  explicit CdpPerfIssuesReporter(RuntimeExecutor runtimeExecutor);

  void onMeasureEntry(const PerformanceMeasure &entry, const std::optional<UserTimingDetailProvider> &detailProvider)
      override;

 private:
  const RuntimeExecutor runtimeExecutor_{};
};

} // namespace facebook::react
