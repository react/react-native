/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <optional>
#include <string>

namespace facebook::react::jsinspector_modern {

class HostTargetDelegate;

struct PerfIssuePayload {
  std::string name;
  std::optional<std::string> severity;
  std::optional<std::string> description;
  std::optional<std::string> learnMoreUrl;
};

/**
 * [Experimental] Utility to handle performance metrics updates received from
 * the runtime and forward update events to the V2 Perf Monitor UI.
 */
class PerfMonitorUpdateHandler {
 public:
  explicit PerfMonitorUpdateHandler(HostTargetDelegate &delegate) : delegate_(delegate) {}

  /**
   * Handle a new "__react_native_perf_issues_reporter" message.
   */
  void handlePerfIssueAdded(const std::string &message);

 private:
  HostTargetDelegate &delegate_;
};

} // namespace facebook::react::jsinspector_modern
