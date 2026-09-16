/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "FrameTimingSequence.h"
#include "InstanceTracingProfile.h"
#include "RuntimeSamplingProfile.h"

#include <react/timing/primitives.h>

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * The final tracing profile for the given HostTarget.
 * Contains all necessary information that is required to be be emitted as a series of Tracing.dataCollected CDP
 * messages.
 */
struct HostTracingProfile {
  HostTracingProfile() = default;

  // Explicitly move-only: FrameTimingSequence and RuntimeSamplingProfile are
  // not copyable, so the implicit copy constructor is ill-formed the moment it
  // is instantiated. Plain C++ never instantiates it, but Swift's C++ interop
  // does when these headers are reached from an imported module, turning it
  // into a hard compile error (Xcode 26.3).
  HostTracingProfile(const HostTracingProfile &) = delete;
  HostTracingProfile &operator=(const HostTracingProfile &) = delete;
  HostTracingProfile(HostTracingProfile &&) = default;
  HostTracingProfile &operator=(HostTracingProfile &&) = default;
  ~HostTracingProfile() = default;

  // The ID of the OS-level process that this Trace Recording is associated
  // with.
  ProcessId processId{};

  // The timestamp at which this Trace Recording started.
  HighResTimeStamp startTime;

  // Frame timings captured on the Host side.
  std::vector<FrameTimingSequence> frameTimings;

  // All captured Instance Tracing Profiles during this Trace Recording.
  std::vector<InstanceTracingProfile> instanceTracingProfiles;

  // All captured Runtime Sampling Profiles during this Trace Recording.
  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles;
};

} // namespace facebook::react::jsinspector_modern::tracing
