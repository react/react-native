/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "RuntimeTarget.h"
#include "SessionState.h"

#include <string>

namespace facebook::react::jsinspector_modern {

/**
 * A RuntimeTargetDelegate that stubs out debugging functionality for a
 * JavaScript runtime that does not natively support debugging.
 */
class FallbackRuntimeTargetDelegate : public RuntimeTargetDelegate {
 public:
  explicit FallbackRuntimeTargetDelegate(std::string engineDescription);

  std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel channel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      RuntimeExecutor runtimeExecutor) override;

  void addConsoleMessage(jsi::Runtime& runtime, ConsoleMessage message)
      override;

  bool supportsConsole() const override;

  std::unique_ptr<StackTrace> captureStackTrace(
      jsi::Runtime& runtime,
      size_t framesToSkip) override;

  void enableSamplingProfiler() override;

  void disableSamplingProfiler() override;

  tracing::RuntimeSamplingProfile collectSamplingProfile() override;

  std::optional<folly::dynamic> serializeStackTrace(
      const StackTrace& stackTrace) override;

 private:
  std::string engineDescription_;
};

} // namespace facebook::react::jsinspector_modern
