/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InstanceTracingProfile.h"
#include "RuntimeSamplingProfile.h"
#include "TracingMode.h"

#include <oscompat/OSCompat.h>
#include <react/timing/primitives.h>

#include <vector>

namespace facebook::react::jsinspector_modern::tracing {

/**
 * The global state for the given Trace Recording.
 * Shared with Tracing Agents, which could use it to stash the corresponding target profiles during reloads.
 */
struct TraceRecordingState {
  TraceRecordingState(
      tracing::Mode tracingMode,
      std::set<tracing::Category> enabledCategories,
      std::optional<HighResDuration> windowSize = std::nullopt)
      : mode(tracingMode), enabledCategories(std::move(enabledCategories)), windowSize(windowSize)
  {
  }

  // Explicitly move-only: RuntimeSamplingProfile is not copyable, so the
  // implicit copy constructor is ill-formed the moment it is instantiated.
  // Plain C++ never instantiates it, but Swift's C++ interop (ClangImporter)
  // does when a consumer imports these headers as part of a module, turning
  // it into a hard compile error (Xcode 26.3).
  TraceRecordingState(const TraceRecordingState &) = delete;
  TraceRecordingState &operator=(const TraceRecordingState &) = delete;
  TraceRecordingState(TraceRecordingState &&) = default;
  TraceRecordingState &operator=(TraceRecordingState &&) = default;
  ~TraceRecordingState() = default;

  // The mode of this Trace Recording.
  tracing::Mode mode;

  // All captured Runtime Sampling Profiles during this Trace Recording.
  std::vector<RuntimeSamplingProfile> runtimeSamplingProfiles{};

  // All captures Instance Tracing Profiles during this Trace Recording.
  std::vector<InstanceTracingProfile> instanceTracingProfiles{};

  // The list of categories that are enabled for this recording.
  std::set<tracing::Category> enabledCategories;

  // The size of the time window for this recording.
  std::optional<HighResDuration> windowSize;
};

} // namespace facebook::react::jsinspector_modern::tracing
