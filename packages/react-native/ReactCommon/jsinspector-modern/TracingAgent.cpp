/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TracingAgent.h"
#include "HostTargetTracing.h"

#include <jsinspector-modern/tracing/PerformanceTracer.h>
#include <jsinspector-modern/tracing/RuntimeSamplingProfileTraceEventSerializer.h>
#include <jsinspector-modern/tracing/TraceEventSerializer.h>
#include <jsinspector-modern/tracing/TracingMode.h>

namespace facebook::react::jsinspector_modern {

TracingAgent::TracingAgent(
    FrontendChannel frontendChannel,
    SessionState& sessionState,
    HostTargetController& hostTargetController)
    : frontendChannel_(std::move(frontendChannel)),
      sessionState_(sessionState),
      hostTargetController_(hostTargetController) {}

TracingAgent::~TracingAgent() {
  // Agents are owned by the session. If the agent is destroyed, it means that
  // the session was destroyed. We should stop pending recording.
  if (sessionState_.hasPendingTraceRecording) {
    hostTargetController_.stopTracing();
  }
}

bool TracingAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Tracing.start") {
    auto& inspector = getInspectorInstance();
    if (inspector.getSystemState().registeredHostsCount > 1) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InternalError,
              "The Tracing domain is unavailable when multiple React Native hosts are registered."));

      return true;
    }

    if (sessionState_.isDebuggerDomainEnabled) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InternalError,
              "Debugger domain is expected to be disabled before starting Tracing"));

      return true;
    }

    /**
     * This logic has to be updated with the next upgrade of Chrome
     * DevTools Frotnend fork.
     *
     * At the moment of writing this, our fork uses categories field, which is
     * marked as depreacted in CDP spec.
     *
     * Latest versions of Chrome DevTools in stable channel of Chromium are
     * already using traceConfig field.
     */
    std::set<tracing::Category> enabledCategories;
    if (req.params.isObject() && req.params.count("categories") != 0 &&
        req.params["categories"].isString()) {
      enabledCategories = tracing::parseSerializedTracingCategories(
          req.params["categories"].getString());
    }

    bool didNotHaveAlreadyRunningRecording = hostTargetController_.startTracing(
        tracing::Mode::CDP, std::move(enabledCategories));
    if (!didNotHaveAlreadyRunningRecording) {
      // @cdp Tracing.start fails if there is a tracing session already running
      // in the current target. This matches Chrome's behavior.
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InvalidRequest,
              "Tracing has already been started"));

      return true;
    }

    sessionState_.hasPendingTraceRecording = true;
    frontendChannel_(cdp::jsonResult(req.id));

    return true;
  } else if (req.method == "Tracing.end") {
    if (!sessionState_.hasPendingTraceRecording) {
      frontendChannel_(
          cdp::jsonError(
              req.id,
              cdp::ErrorCode::InvalidRequest,
              "Tracing has not been started"));

      return true;
    }

    auto tracingProfile = hostTargetController_.stopTracing();

    sessionState_.hasPendingTraceRecording = false;
    // Send response to Tracing.end request.
    frontendChannel_(cdp::jsonResult(req.id));

    emitNotificationsForTracingProfile(
        std::move(tracingProfile),
        frontendChannel_,
        /* isBackgroundTrace */ false);
    return true;
  }

  return false;
}

} // namespace facebook::react::jsinspector_modern
