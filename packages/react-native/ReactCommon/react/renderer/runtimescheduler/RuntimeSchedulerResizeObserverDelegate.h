/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include <jsi/jsi.h>

namespace facebook::react {

class RuntimeSchedulerResizeObserverDelegate {
 public:
  virtual ~RuntimeSchedulerResizeObserverDelegate() = default;

  virtual void runResizeObservations(jsi::Runtime &runtime) = 0;
};

} // namespace facebook::react
