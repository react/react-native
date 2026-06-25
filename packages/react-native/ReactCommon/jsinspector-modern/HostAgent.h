/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "HostTarget.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/InstanceAgent.h>
#include <jsinspector-modern/cdp/CdpJson.h>
#include <jsinspector-modern/tracing/TargetTracingAgent.h>

namespace facebook::react::jsinspector_modern {

class InstanceAgent;

/**
 * An Agent that handles requests from the Chrome DevTools Protocol for the
 * given Host.
 * The constructor, destructor and all public methods must be called on the
 * same thread, which is also the thread where the associated HostTarget is
 * constructed and managed.
 */
class HostAgent final {
 public:
  /**
   * \param frontendChannel A channel used to send responses and events to the
   * frontend.
   * \param targetController An interface to the HostTarget that this agent is
   * attached to. The caller is responsible for ensuring that the
   * HostTargetDelegate and underlying HostTarget both outlive the agent.
   * \param hostMetadata Metadata about the host that created this agent.
   * \param sessionState The state of the session that created this agent.
   * \param executor A void executor to be used by async-aware handlers.
   */
  HostAgent(
      const FrontendChannel &frontendChannel,
      HostTargetController &targetController,
      HostTargetMetadata hostMetadata,
      SessionState &sessionState,
      VoidExecutor executor);

  HostAgent(const HostAgent &) = delete;
  HostAgent(HostAgent &&) = delete;
  HostAgent &operator=(const HostAgent &) = delete;
  HostAgent &operator=(HostAgent &&) = delete;

  ~HostAgent();

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  void handleRequest(const cdp::PreparsedRequest &req);

  /**
   * Replace the current InstanceAgent with the given one and notify the
   * frontend about the new instance.
   * \param agent The new InstanceAgent. May be null to signify that there is
   * currently no active instance.
   */
  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> agent);

  /**
   * Returns whether this HostAgent is eligible to receive notifications about
   * background traces.
   */
  bool isEligibleForBackgroundTrace() const;

  /**
   * Emits a system state changed event when the number of ReactHost instances
   * changes.
   */
  void emitSystemStateChanged(bool isSingleHost);

 private:
  // We use the private implementation idiom to ensure this class has the same
  // layout regardless of whether REACT_NATIVE_DEBUGGER_ENABLED is defined. The
  // net effect is that callers can include HostAgent.h without setting
  // HERMES_ENABLE_DEBUGGER one way or the other.
  class Impl;

  std::unique_ptr<Impl> impl_;
};

#pragma mark - Tracing

/**
 * An Agent that handles Tracing events for a particular InstanceTarget.
 *
 * Lifetime of this agent is bound to the lifetime of the Tracing session -
 * HostTargetTraceRecording.
 */
class HostTracingAgent : tracing::TargetTracingAgent {
 public:
  explicit HostTracingAgent(tracing::TraceRecordingState &state);

  /**
   * Registers the InstanceTarget with this tracing agent.
   */
  void setTracedInstance(InstanceTarget *instanceTarget);

 private:
  std::shared_ptr<InstanceTracingAgent> instanceTracingAgent_{nullptr};
};

} // namespace facebook::react::jsinspector_modern
