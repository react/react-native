/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "../utils/InspectorFlagOverridesGuard.h"

#include <jsinspector-modern/RuntimeTarget.h>

#include <folly/executors/QueuedImmediateExecutor.h>
#include <hermes/hermes.h>
#include <hermes/inspector-modern/chrome/HermesRuntimeTargetDelegate.h>
#include <jsi/jsi.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * An engine adapter for JsiIntegrationTest that uses Hermes (and Hermes'
 * modern CDPAgent API).
 */
class JsiIntegrationTestHermesEngineAdapter {
 public:
  explicit JsiIntegrationTestHermesEngineAdapter(folly::Executor& jsExecutor);

  static InspectorFlagOverrides getInspectorFlagOverrides() noexcept;

  RuntimeTargetDelegate& getRuntimeTargetDelegate();

  jsi::Runtime& getRuntime() const noexcept;

  RuntimeExecutor getRuntimeExecutor() const noexcept;

 private:
  std::shared_ptr<facebook::hermes::HermesRuntime> runtime_;
  folly::Executor& jsExecutor_;
  HermesRuntimeTargetDelegate runtimeTargetDelegate_;
};

} // namespace facebook::react::jsinspector_modern
