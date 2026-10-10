/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ExecutionContextManager.h"
#include "InstanceAgent.h"
#include "SessionState.h"

#include <jsinspector-modern/InstanceTarget.h>

#include <utility>

namespace facebook::react::jsinspector_modern {

std::shared_ptr<InstanceTarget> InstanceTarget::create(
    std::shared_ptr<ExecutionContextManager> executionContextManager,
    InstanceTargetDelegate& delegate,
    VoidExecutor executor) {
  std::shared_ptr<InstanceTarget> instanceTarget{
      new InstanceTarget(executionContextManager, delegate)};
  instanceTarget->setExecutor(std::move(executor));
  return instanceTarget;
}

InstanceTarget::InstanceTarget(
    std::shared_ptr<ExecutionContextManager> executionContextManager,
    InstanceTargetDelegate& delegate)
    : delegate_(delegate),
      executionContextManager_(std::move(executionContextManager)) {
  (void)delegate_;
}

InstanceTargetDelegate::~InstanceTargetDelegate() = default;

std::shared_ptr<InstanceAgent> InstanceTarget::createAgent(
    const FrontendChannel& channel,
    SessionState& sessionState) {
  auto instanceAgent =
      std::make_shared<InstanceAgent>(channel, *this, sessionState);
  instanceAgent->setCurrentRuntime(currentRuntime_.get());
  agents_.insert(instanceAgent);
  return instanceAgent;
}

std::shared_ptr<InstanceTracingAgent> InstanceTarget::createTracingAgent(
    tracing::TraceRecordingState& state) {
  auto agent = std::make_shared<InstanceTracingAgent>(state);
  agent->setTracedRuntime(currentRuntime_.get());
  tracingAgent_ = agent;
  return agent;
}

InstanceTarget::~InstanceTarget() {
  // Agents are owned by the session, not by InstanceTarget, but
  // they hold an InstanceTarget& that we must guarantee is valid.
  assert(
      agents_.empty() &&
      "InstanceAgent objects must be destroyed before their InstanceTarget. Did you call HostTarget::unregisterInstance()?");

  // Tracing Agents are owned by the HostTargetTraceRecording.
  assert(
      tracingAgent_.expired() &&
      "InstanceTracingAgent must be destroyed before their InstanceTarget. Did you call HostTarget::unregisterInstance()?");
}

RuntimeTarget& InstanceTarget::registerRuntime(
    RuntimeTargetDelegate& delegate,
    RuntimeExecutor jsExecutor) {
  assert(!currentRuntime_ && "Only one Runtime allowed");
  currentRuntime_ = RuntimeTarget::create(
      ExecutionContextDescription{
          .id = executionContextManager_->allocateExecutionContextId(),
          .origin = "",
          .name = "main",
          .uniqueId = std::nullopt},
      delegate,
      std::move(jsExecutor),
      makeVoidExecutor(executorFromThis()));

  agents_.forEach([currentRuntime = &*currentRuntime_](InstanceAgent& agent) {
    agent.setCurrentRuntime(currentRuntime);
  });

  if (auto tracingAgent = tracingAgent_.lock()) {
    // Registers the Runtime for tracing, if a Trace is currently being
    // recorded.
    tracingAgent->setTracedRuntime(currentRuntime_.get());
  }

  return *currentRuntime_;
}

void InstanceTarget::unregisterRuntime(RuntimeTarget& Runtime) {
  assert(
      currentRuntime_ && currentRuntime_.get() == &Runtime &&
      "Invalid unregistration");
  agents_.forEach(
      [](InstanceAgent& agent) { agent.setCurrentRuntime(nullptr); });

  if (auto tracingAgent = tracingAgent_.lock()) {
    // Unregisters the Runtime for tracing, if a Trace is currently being
    // recorded.
    tracingAgent->setTracedRuntime(nullptr);
  }

  currentRuntime_.reset();
}

} // namespace facebook::react::jsinspector_modern
