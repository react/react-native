/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <hermes/hermes.h>

#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>

namespace facebook::react::jsinspector_modern::tracing {

class RawHermesRuntimeProfile : public RawRuntimeProfile {
 public:
  explicit RawHermesRuntimeProfile(
      hermes::sampling_profiler::Profile hermesProfile)
      : hermesProfile_{std::move(hermesProfile)} {}

 private:
  hermes::sampling_profiler::Profile hermesProfile_;
};

class HermesRuntimeSamplingProfileSerializer {
 public:
  static tracing::RuntimeSamplingProfile serializeToTracingSamplingProfile(
      hermes::sampling_profiler::Profile hermesProfile);
};

} // namespace facebook::react::jsinspector_modern::tracing
