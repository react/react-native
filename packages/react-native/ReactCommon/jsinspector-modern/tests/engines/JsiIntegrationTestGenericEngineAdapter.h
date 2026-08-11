/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "../utils/InspectorFlagOverridesGuard.h"

#include <jsinspector-modern/FallbackRuntimeTargetDelegate.h>
#include <jsinspector-modern/RuntimeTarget.h>

#include <folly/executors/QueuedImmediateExecutor.h>
#include <jsi/jsi.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * An engine adapter for JsiIntegrationTest that represents a generic
 * JSI-compatible engine, with no engine-specific CDP support. Uses Hermes under
 * the hood, without Hermes's CDP support.
 */
class JsiIntegrationTestGenericEngineAdapter {
 public:
  explicit JsiIntegrationTestGenericEngineAdapter(folly::Executor& jsExecutor);

  static InspectorFlagOverrides getInspectorFlagOverrides() noexcept;

  RuntimeTargetDelegate& getRuntimeTargetDelegate();

  jsi::Runtime& getRuntime() const noexcept;

  RuntimeExecutor getRuntimeExecutor() const noexcept;

 private:
  std::unique_ptr<jsi::Runtime> runtime_;
  folly::Executor& jsExecutor_;
  jsinspector_modern::FallbackRuntimeTargetDelegate runtimeTargetDelegate_;
};

} // namespace facebook::react::jsinspector_modern
