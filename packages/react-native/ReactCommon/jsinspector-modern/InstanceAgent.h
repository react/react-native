/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "RuntimeTarget.h"
#include "SessionState.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InstanceTarget.h>
#include <jsinspector-modern/RuntimeAgent.h>
#include <jsinspector-modern/cdp/CdpJson.h>
#include <jsinspector-modern/tracing/InstanceTracingProfile.h>
#include <jsinspector-modern/tracing/TargetTracingAgent.h>

#include <functional>

namespace facebook::react::jsinspector_modern {

/**
 * An Agent that handles requests from the Chrome DevTools Protocol for the
 * given InstanceTarget.
 */
class InstanceAgent final {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param target The InstanceTarget that this agent is attached to. The
   * caller is responsible for ensuring that the InstanceTarget outlives this
   * object.
   * \param sessionState The state of the session that created this agent.
   */
  explicit InstanceAgent(
      FrontendChannel frontendChannel,
      InstanceTarget& target,
      SessionState& sessionState);

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest& req);

  /**
   * Replace the current RuntimeAgent hostAgent_ with a new one
   * connected to the new RuntimeTarget.
   * \param runtime The new runtime target. May be nullptr to indicate
   * there's no current debuggable runtime.
   */
  void setCurrentRuntime(RuntimeTarget* runtime);

  /**
   * Send a console message to the frontend, or buffer it to be sent later.
   */
  void sendConsoleMessage(SimpleConsoleMessage message);

 private:
  void maybeSendExecutionContextCreatedNotification();
  void sendConsoleMessageImmediately(SimpleConsoleMessage message);
  void maybeSendPendingConsoleMessages();

  FrontendChannel frontendChannel_;
  InstanceTarget& target_;
  std::shared_ptr<RuntimeAgent> runtimeAgent_;
  SessionState& sessionState_;
};

#pragma mark - Tracing

/**
 * An Agent that handles Tracing events for a particular InstanceTarget.
 *
 * Lifetime of this agent is bound to the lifetime of the Tracing session -
 * HostTargetTraceRecording and to the lifetime of the InstanceTarget.
 */
class InstanceTracingAgent : tracing::TargetTracingAgent {
 public:
  explicit InstanceTracingAgent(tracing::TraceRecordingState& state);

  ~InstanceTracingAgent();

  /**
   * Registers the RuntimeTarget with this tracing agent.
   */
  void setTracedRuntime(RuntimeTarget* runtimeTarget);

 private:
  std::shared_ptr<RuntimeTracingAgent> runtimeTracingAgent_;
};

} // namespace facebook::react::jsinspector_modern
