/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/RuntimeExecutor.h>

#include <cxxreact/MessageQueueThread.h>
#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

#ifdef HERMES_ENABLE_DEBUGGER
#include <hermes/cdp/CDPDebugAPI.h>
#endif

#include <memory>

namespace facebook::react::jsinspector_modern {

/**
 * A RuntimeTargetDelegate that enables debugging a Hermes runtime over CDP.
 */
class HermesRuntimeTargetDelegate : public RuntimeTargetDelegate {
 public:
  /**
   * Creates a HermesRuntimeTargetDelegate for the given runtime.
   */
  explicit HermesRuntimeTargetDelegate(std::shared_ptr<jsi::Runtime> runtime, hermes::HermesRuntime &hermesRuntime);

  ~HermesRuntimeTargetDelegate() override;

  // RuntimeTargetDelegate methods

  std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate> createAgentDelegate(
      jsinspector_modern::FrontendChannel frontendChannel,
      jsinspector_modern::SessionState &sessionState,
      std::unique_ptr<jsinspector_modern::RuntimeAgentDelegate::ExportedState> previouslyExportedState,
      const jsinspector_modern::ExecutionContextDescription &executionContextDescription,
      RuntimeExecutor runtimeExecutor) override;

  void addConsoleMessage(jsi::Runtime &runtime, ConsoleMessage message) override;

  bool supportsConsole() const override;

  std::unique_ptr<StackTrace> captureStackTrace(jsi::Runtime &runtime, size_t framesToSkip) override;

  void enableSamplingProfiler() override;
  void disableSamplingProfiler() override;
  tracing::RuntimeSamplingProfile collectSamplingProfile() override;

  std::optional<folly::dynamic> serializeStackTrace(const StackTrace &stackTrace) override;

 private:
  // We use the private implementation idiom to ensure this class has the same
  // layout regardless of whether HERMES_ENABLE_DEBUGGER is defined. The net
  // effect is that callers can include HermesRuntimeTargetDelegate.h without
  // setting HERMES_ENABLE_DEBUGGER one way or the other.
  class Impl;

// Callers within this library may set HERMES_ENABLE_DEBUGGER to see this extra
// API.
#ifdef HERMES_ENABLE_DEBUGGER
  friend class HermesRuntimeAgentDelegate;

  hermes::cdp::CDPDebugAPI &getCDPDebugAPI();
#endif

  std::unique_ptr<Impl> impl_;
};

} // namespace facebook::react::jsinspector_modern
