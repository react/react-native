/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifdef HERMES_ENABLE_DEBUGGER

#include "HermesRuntimeTargetDelegate.h"

#include <ReactCommon/RuntimeExecutor.h>
#include <hermes/hermes.h>
#include <jsinspector-modern/ReactCdp.h>

namespace facebook::react::jsinspector_modern {

/**
 * A RuntimeAgentDelegate that handles requests from the Chrome DevTools
 * Protocol for an instance of Hermes, using the modern CDPAgent API.
 */
class HermesRuntimeAgentDelegate : public RuntimeAgentDelegate {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param sessionState The state of the current CDP session. This will only
   * be accessed on the main thread (during the constructor, in handleRequest,
   * etc).
   * \param previouslyExportedState The exported state from a previous instance
   * of RuntimeAgentDelegate (NOT necessarily HermesRuntimeAgentDelegate).
   * This may be nullptr, and if not nullptr it may be of any concrete type that
   * implements RuntimeAgentDelegate::ExportedState.
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param runtime The HermesRuntime that this agent is attached to. The caller
   * is responsible for keeping this object alive for the duration of the
   * \c HermesRuntimeAgentDelegate lifetime.
   * \param runtimeTargetDelegate The \c HermesRuntimeTargetDelegate object
   * object for the passed runtime.
   * \param runtimeExecutor A callback for scheduling work on the JS thread.
   * \c runtimeExecutor may drop scheduled work if the runtime is destroyed
   * first.
   */
  HermesRuntimeAgentDelegate(
      FrontendChannel frontendChannel,
      SessionState& sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState>
          previouslyExportedState,
      const ExecutionContextDescription& executionContextDescription,
      hermes::HermesRuntime& runtime,
      HermesRuntimeTargetDelegate& runtimeTargetDelegate,
      RuntimeExecutor runtimeExecutor);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   * \returns true if this agent has responded, or will respond asynchronously,
   * to the request (with either a success or error message). False if the
   * agent expects another agent to respond to the request instead.
   */
  bool handleRequest(const cdp::PreparsedRequest& req) override;

  std::unique_ptr<RuntimeAgentDelegate::ExportedState> getExportedState()
      override;

 private:
  class Impl;

  const std::unique_ptr<Impl> impl_;
};

} // namespace facebook::react::jsinspector_modern

#else
#error \
    "HERMES_ENABLE_DEBUGGER must be enabled to use HermesRuntimeAgentDelegate."
#endif // HERMES_ENABLE_DEBUGGER
