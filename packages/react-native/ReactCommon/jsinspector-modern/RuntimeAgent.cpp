/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RuntimeAgent.h"
#include "SessionState.h"

#include <folly/dynamic.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <chrono>
#include <utility>

namespace facebook::react::jsinspector_modern {

RuntimeAgent::RuntimeAgent(
    FrontendChannel frontendChannel,
    RuntimeTargetController& targetController,
    ExecutionContextDescription executionContextDescription,
    SessionState& sessionState,
    std::unique_ptr<RuntimeAgentDelegate> delegate)
    : frontendChannel_(std::move(frontendChannel)),
      targetController_(targetController),
      sessionState_(sessionState),
      delegate_(std::move(delegate)),
      executionContextDescription_(std::move(executionContextDescription)) {
  for (auto& [name, contextSelectors] : sessionState_.subscribedBindings) {
    if (matchesAny(executionContextDescription_, contextSelectors)) {
      targetController_.installBindingHandler(name);
    }
  }

  // Replay any scripts registered via @cdp
  // Page.addScriptToEvaluateOnNewDocument onto this newly created runtime, in
  // registration order, so they evaluate before the app's main bundle.
  for (const auto& script : sessionState_.scriptsToEvaluateOnNewDocument) {
    targetController_.installScriptToEvaluateOnNewDocument(script.source);
  }

  if (sessionState_.isRuntimeDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Runtime, true, *this);
  }

  if (sessionState_.isLogDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Log, true, *this);
  }

  if (sessionState_.isNetworkDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Network, true, *this);
  }
}

bool RuntimeAgent::handleRequest(const cdp::PreparsedRequest& req) {
  if (req.method == "Runtime.addBinding") {
    std::string bindingName = req.params["name"].getString();

    // Check if the binding has a context selector that matches the current
    // context. The state will have been updated by HostAgent by the time we
    // receive the request.
    // NOTE: We DON'T do the reverse for removeBinding, for reasons explained
    // in the implementation of HostAgent.
    auto it = sessionState_.subscribedBindings.find(bindingName);
    if (it != sessionState_.subscribedBindings.end()) {
      auto contextSelectors = it->second;
      if (matchesAny(executionContextDescription_, contextSelectors)) {
        targetController_.installBindingHandler(bindingName);
      }
    }

    // We are not responding to this request, just processing a side effect.
    return false;
  }
  if (req.method == "Runtime.enable" || req.method == "Runtime.disable") {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Runtime,
        sessionState_.isRuntimeDomainEnabled,
        *this);
    // Fall through
  } else if (req.method == "Log.enable" || req.method == "Log.disable") {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Log,
        sessionState_.isLogDomainEnabled,
        *this);
    // Fall through
  } else if (
      req.method == "Network.enable" || req.method == "Network.disable") {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Network,
        sessionState_.isNetworkDomainEnabled,
        *this);

    // We are not responding to this request, just processing a side effect.
    return false;
  }

  if (delegate_) {
    return delegate_->handleRequest(req);
  }
  return false;
}

void RuntimeAgent::notifyBindingCalled(
    const std::string& bindingName,
    const std::string& payload) {
  // NOTE: When dispatching @cdp Runtime.bindingCalled notifications, we don't
  // re-check whether the session is expecting notifications from the current
  // context - only that it's subscribed to that binding name.
  // Theoretically, this can result in over-sending notifications from contexts
  // that the client no longer cares about, or never cared about to begin with
  // (e.g. if the binding handler was installed by a previous session).
  //
  // React Native intentionally replicates this behavior for the sake of
  // bug-for-bug compatibility with Chrome, but clients should probably not rely
  // on it.
  if (sessionState_.subscribedBindings.count(bindingName) == 0u) {
    return;
  }

  frontendChannel_(
      cdp::jsonNotification(
          "Runtime.bindingCalled",
          folly::dynamic::object(
              "executionContextId", executionContextDescription_.id)(
              "name", bindingName)("payload", payload)));
}

void RuntimeAgent::notifyFastRefreshComplete() {
  if (!sessionState_.isReactNativeApplicationDomainEnabled) {
    return;
  }
  folly::dynamic params = folly::dynamic::object(
      "timestamp",
      std::chrono::duration_cast<std::chrono::milliseconds>(
          std::chrono::system_clock::now().time_since_epoch())
          .count());
  frontendChannel_(
      cdp::jsonNotification(
          "ReactNativeApplication.unstable_fastRefreshComplete",
          std::move(params)));
}

RuntimeAgent::ExportedState RuntimeAgent::getExportedState() {
  return {
      .delegateState = delegate_ ? delegate_->getExportedState() : nullptr,
  };
}

RuntimeAgent::~RuntimeAgent() {
  if (sessionState_.isRuntimeDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Runtime, false, *this);
  }
  if (sessionState_.isLogDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Log, false, *this);
  }
  if (sessionState_.isNetworkDomainEnabled) {
    targetController_.notifyDomainStateChanged(
        RuntimeTargetController::Domain::Network, false, *this);
  }

  // TODO: Eventually, there may be more than one Runtime per Page, and we'll
  // need to store multiple agent states here accordingly. For now let's do
  // the simple thing and assume (as we do elsewhere) that only one Runtime
  // per Page can exist at a time.
  sessionState_.lastRuntimeAgentExportedState = getExportedState();
}

#pragma mark - Tracing

RuntimeTracingAgent::RuntimeTracingAgent(
    tracing::TraceRecordingState& state,
    RuntimeTargetController& targetController)
    : tracing::TargetTracingAgent(state), targetController_(targetController) {
  if (state.enabledCategories.contains(tracing::Category::JavaScriptSampling)) {
    targetController_.enableSamplingProfiler();
  }
  if (state.mode == tracing::Mode::CDP) {
    targetController_.emitTracingStateChange(true);
  }
}

RuntimeTracingAgent::~RuntimeTracingAgent() {
  if (state_.mode == tracing::Mode::CDP) {
    targetController_.emitTracingStateChange(false);
  }
  if (state_.enabledCategories.contains(
          tracing::Category::JavaScriptSampling)) {
    targetController_.disableSamplingProfiler();
    auto profile = targetController_.collectSamplingProfile();

    state_.runtimeSamplingProfiles.emplace_back(std::move(profile));
  }
}

} // namespace facebook::react::jsinspector_modern
