/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/FrameworksGuard.h>

#include "ExecutionContextManager.h"
#include "RuntimeTarget.h"
#include "ScopedExecutor.h"
#include "SessionState.h"
#include "WeakList.h"

#include <jsinspector-modern/InspectorInterfaces.h>
#include <jsinspector-modern/RuntimeAgent.h>
#include <jsinspector-modern/tracing/TraceRecordingState.h>

#include <memory>

namespace facebook::react::jsinspector_modern {

class InstanceAgent;
class InstanceTracingAgent;
class HostTargetTraceRecording;

/**
 * Receives events from an InstanceTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class InstanceTargetDelegate {
 public:
  InstanceTargetDelegate() = default;
  InstanceTargetDelegate(const InstanceTargetDelegate &) = delete;
  InstanceTargetDelegate(InstanceTargetDelegate &&) = delete;
  InstanceTargetDelegate &operator=(const InstanceTargetDelegate &) = delete;
  InstanceTargetDelegate &operator=(InstanceTargetDelegate &&) = delete;

  virtual ~InstanceTargetDelegate();
};

/**
 * A Target that represents a single instance of React Native.
 */
class InstanceTarget : public EnableExecutorFromThis<InstanceTarget> {
 public:
  /**
   * Constructs a new InstanceTarget.
   * \param executionContextManager Assigns unique execution context IDs.
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   * \param executor An executor that may be used to call methods on this
   * InstanceTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the InstanceTarget is destroyed.
   */
  static std::shared_ptr<InstanceTarget> create(
      std::shared_ptr<ExecutionContextManager> executionContextManager,
      InstanceTargetDelegate &delegate,
      VoidExecutor executor);

  InstanceTarget(const InstanceTarget &) = delete;
  InstanceTarget(InstanceTarget &&) = delete;
  InstanceTarget &operator=(const InstanceTarget &) = delete;
  InstanceTarget &operator=(InstanceTarget &&) = delete;
  ~InstanceTarget();

  std::shared_ptr<InstanceAgent> createAgent(const FrontendChannel &channel, SessionState &sessionState);

  /**
   * Creates a new InstanceTracingAgent.
   * This Agent is not owned by the InstanceTarget. The Agent will be destroyed
   * either before the InstanceTarget is destroyed, as part of the
   * InstanceTarget unregistration in HostTarget, or at the end of the tracing
   * session.
   *
   * \param state A reference to the state of the active trace recording.
   */
  std::shared_ptr<InstanceTracingAgent> createTracingAgent(tracing::TraceRecordingState &state);

  /**
   * Registers a JS runtime with this InstanceTarget. \returns a reference to
   * the created RuntimeTarget, which is owned by the \c InstanceTarget. All the
   * requirements of \c RuntimeTarget::create must be met.
   */
  RuntimeTarget &registerRuntime(RuntimeTargetDelegate &delegate, RuntimeExecutor executor);

  /**
   * Unregisters a JS runtime from this InstanceTarget. This destroys the \c
   * RuntimeTarget, and it is no longer valid to use. Note that the \c
   * RuntimeTargetDelegate& initially provided to \c registerRuntime may
   * continue to be used as long as JavaScript execution continues in the
   * runtime.
   */
  void unregisterRuntime(RuntimeTarget &runtime);

 private:
  /**
   * Constructs a new InstanceTarget. The caller must call setExecutor
   * immediately afterwards.
   * \param executionContextManager Assigns unique execution context IDs.
   * \param delegate The object that will receive events from this target.
   * The caller is responsible for ensuring that the delegate outlives this
   * object.
   */
  InstanceTarget(std::shared_ptr<ExecutionContextManager> executionContextManager, InstanceTargetDelegate &delegate);

  InstanceTargetDelegate &delegate_;
  std::shared_ptr<RuntimeTarget> currentRuntime_{nullptr};
  WeakList<InstanceAgent> agents_;
  std::shared_ptr<ExecutionContextManager> executionContextManager_;

  /**
   * This TracingAgent is owned by the HostTracingAgent, both are bound to
   * the lifetime of their corresponding targets and the lifetime of the tracing
   * session - HostTargetTraceRecording.
   */
  std::weak_ptr<InstanceTracingAgent> tracingAgent_;
};

} // namespace facebook::react::jsinspector_modern
