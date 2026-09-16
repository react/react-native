/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "TraceRecordingState.h"

namespace facebook::react::jsinspector_modern::tracing {

/**
 * An interface for a tracing agent of a target.
 * Tracing Agents are only allocated during an active tracing session.
 *
 * Construction of a TracingAgent means that either the recording has just
 * started or the target was just created during an active recording.
 * Destruction of a TracingAgent means that either the recording has stopped or
 * the target is about to be destroyed.
 */
class TargetTracingAgent {
 public:
  explicit TargetTracingAgent(TraceRecordingState &state) : state_(state)
  {
    (void)state_;
  }

  bool isRunningInBackgroundMode()
  {
    return state_.mode == tracing::Mode::Background;
  }

 protected:
  TraceRecordingState &state_;
};

} // namespace facebook::react::jsinspector_modern::tracing
