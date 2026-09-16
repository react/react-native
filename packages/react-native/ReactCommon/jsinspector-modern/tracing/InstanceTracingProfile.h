/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "TraceEvent.h"

namespace facebook::react::jsinspector_modern::tracing {

struct InstanceTracingProfile {
  std::vector<TraceEvent> performanceTraceEvents;
};

} // namespace facebook::react::jsinspector_modern::tracing
