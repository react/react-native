/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ConsoleMessage.h"
#include "EnumArray.h"
#include "ExecutionContext.h"
#include "InspectorInterfaces.h"
#include "RuntimeAgent.h"
#include "ScopedExecutor.h"
#include "StackTrace.h"
#include "WeakList.h"

#include <ReactCommon/RuntimeExecutor.h>
#include <jsinspector-modern/tracing/RuntimeSamplingProfile.h>
#include <jsinspector-modern/tracing/TraceRecordingState.h>

#include <memory>
#include <optional>
#include <utility>

#ifndef JSINSPECTOR_EXPORT
#ifdef _MSC_VER
#ifdef CREATE_SHARED_LIBRARY
#define JSINSPECTOR_EXPORT __declspec(dllexport)
#else
#define JSINSPECTOR_EXPORT
#endif // CREATE_SHARED_LIBRARY
#else // _MSC_VER
#define JSINSPECTOR_EXPORT __attribute__((visibility("default")))
#endif // _MSC_VER
#endif // !defined(JSINSPECTOR_EXPORT)

namespace facebook::react::jsinspector_modern {

class RuntimeAgent;
class RuntimeTracingAgent;
class RuntimeAgentDelegate;
class RuntimeTarget;
struct SessionState;

/**
 * Receives events from a RuntimeTarget. This is a shared interface that
 * each React Native platform needs to implement in order to integrate with
 * the debugging stack.
 */
class RuntimeTargetDelegate {
 public:
  virtual ~RuntimeTargetDelegate() = default;
  virtual std::unique_ptr<RuntimeAgentDelegate> createAgentDelegate(
      FrontendChannel channel,
      SessionState &sessionState,
      std::unique_ptr<RuntimeAgentDelegate::ExportedState> previouslyExportedState,
      const ExecutionContextDescription &executionContextDescription,
      RuntimeExecutor runtimeExecutor) = 0;

  /**
   * Called when the runtime intercepts a console API call. The target delegate
   * should notify the frontend (via its agent delegates) of the message, and
   * perform any buffering required for logging the message later (in the
   * existing and/or new sessions).
   *
   * \note The method is called on the JS thread, and receives a valid reference
   * to the current \c jsi::Runtime. The callee MAY use its own intrinsic
   * Runtime reference, if it has one, without checking it for equivalence with
   * the one provided here.
   */
  virtual void addConsoleMessage(jsi::Runtime &runtime, ConsoleMessage message) = 0;

  /**
   * \returns true if the runtime supports reporting console API calls over CDP.
   * \c addConsoleMessage MAY be called even if this method returns false.
   */
  virtual bool supportsConsole() const = 0;

  /**
   * \returns an opaque representation of a stack trace. This may be passed back
   * to the `RuntimeTargetDelegate` as part of `addConsoleMessage` or other APIs
   * that report stack traces.
   * \param framesToSkip The number of call frames to skip. The first call frame
   * is the topmost (current) frame on the Runtime's call stack, which will
   * typically be the (native) JSI HostFunction that called this method.
   * \note The method is called on the JS thread, and receives a valid reference
   * to the current \c jsi::Runtime. The callee MAY use its own intrinsic
   * Runtime reference, if it has one, without checking it for equivalence with
   * the one provided here.
   */
  virtual std::unique_ptr<StackTrace> captureStackTrace(jsi::Runtime &runtime, size_t framesToSkip = 0) = 0;

  /**
   * Start sampling profiler.
   */
  virtual void enableSamplingProfiler() = 0;
  /**
   * Stop sampling profiler.
   */
  virtual void disableSamplingProfiler() = 0;
  /**
   * Return recorded sampling profile for the previous sampling session.
   */
  virtual tracing::RuntimeSamplingProfile collectSamplingProfile() = 0;

  /**
   * \returns a JSON representation of the given stack trace, conforming to the
   * @cdp Runtime.StackTrace type, if the runtime supports it. Otherwise,
   * returns std::nullopt.
   */
  virtual std::optional<folly::dynamic> serializeStackTrace(const StackTrace &stackTrace) = 0;
};

/**
 * The limited interface that RuntimeTarget exposes to its connected agents.
 */
class RuntimeTargetController {
 public:
  enum class Domain { Log, Network, Runtime, kMaxValue };

  explicit RuntimeTargetController(RuntimeTarget &target);

  /**
   * Adds a function with the given name on the runtime's global object, that
   * when called will send a Runtime.bindingCalled event through all connected
   * sessions that have registered to receive binding events for that name.
   */
  void installBindingHandler(const std::string &bindingName);

  /**
   * Evaluates the given JavaScript source on the runtime's thread before any
   * user code runs. Used to replay @cdp
   * Page.addScriptToEvaluateOnNewDocument scripts onto a freshly created
   * runtime.
   */
  void installScriptToEvaluateOnNewDocument(const std::string &source);

  /**
   * Notifies the target that an agent has received an enable or disable
   * message for the given domain.
   */
  void notifyDomainStateChanged(Domain domain, bool enabled, const RuntimeAgent &notifyingAgent);

  /**
   * Start sampling profiler for the corresponding RuntimeTarget.
   */
  void enableSamplingProfiler();
  /**
   * Stop sampling profiler for the corresponding RuntimeTarget.
   */
  void disableSamplingProfiler();
  /**
   * Return recorded sampling profile for the previous sampling session.
   */
  tracing::RuntimeSamplingProfile collectSamplingProfile();

  /**
   * Emits a tracing state change to JavaScript via the tracing state observer.
   */
  void emitTracingStateChange(bool isTracing);

 private:
  RuntimeTarget &target_;
};

/**
 * A Target corresponding to a JavaScript runtime.
 */
class JSINSPECTOR_EXPORT RuntimeTarget : public EnableExecutorFromThis<RuntimeTarget> {
 public:
  /**
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param delegate The object that will receive events from this target. The
   * caller is responsible for ensuring that the delegate outlives this object
   * AND that it remains valid for as long as the JS runtime is executing any
   * code, even if the \c RuntimeTarget itself is destroyed. The delegate SHOULD
   * be the object that owns the underlying jsi::Runtime, if any.
   * \param jsExecutor A RuntimeExecutor that can be used to schedule work on
   * the JS runtime's thread. The executor's queue should be empty when
   * RuntimeTarget is constructed (i.e. anything scheduled during the
   * constructor should be executed before any user code is run).
   * \param selfExecutor An executor that may be used to call methods on this
   * RuntimeTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the RuntimeTarget is destroyed.
   */
  static std::shared_ptr<RuntimeTarget> create(
      const ExecutionContextDescription &executionContextDescription,
      RuntimeTargetDelegate &delegate,
      RuntimeExecutor jsExecutor,
      VoidExecutor selfExecutor);

  RuntimeTarget(const RuntimeTarget &) = delete;
  RuntimeTarget(RuntimeTarget &&) = delete;
  RuntimeTarget &operator=(const RuntimeTarget &) = delete;
  RuntimeTarget &operator=(RuntimeTarget &&) = delete;
  ~RuntimeTarget();

  /**
   * Create a new RuntimeAgent that can be used to debug the underlying JS VM.
   * The agent will be destroyed when the session ends, the containing
   * InstanceTarget is unregistered from its HostTarget, or the RuntimeAgent is
   * unregistered from its InstanceTarget (whichever happens first).
   * \param channel A thread-safe channel forHostTargetDP messages to the
   * frontend.
   * \returns The new agent, or nullptr if the runtime is not debuggable.
   */
  std::shared_ptr<RuntimeAgent> createAgent(const FrontendChannel &channel, SessionState &sessionState);

  /**
   * Creates a new RuntimeTracingAgent.
   * This Agent is not owned by the RuntimeTarget. The Agent will be destroyed
   * either before the RuntimeTarget is destroyed, as part of the RuntimeTarget
   * unregistration in InstanceTarget, or at the end of the tracing session.
   *
   * \param state A reference to the state of the active trace recording.
   */
  std::shared_ptr<RuntimeTracingAgent> createTracingAgent(tracing::TraceRecordingState &state);

 private:
  using Domain = RuntimeTargetController::Domain;

  /**
   * Constructs a new RuntimeTarget. The caller must call setExecutor
   * immediately afterwards.
   * \param executionContextDescription A description of the execution context
   * represented by this runtime. This is used for disambiguating the
   * source/destination of CDP messages when there are multiple runtimes
   * (concurrently or over the life of a Host).
   * \param delegate The object that will receive events from this target. The
   * caller is responsible for ensuring that the delegate outlives this object
   * AND that it remains valid for as long as the JS runtime is executing any
   * code, even if the \c RuntimeTarget itself is destroyed. The delegate SHOULD
   * be the object that owns the underlying jsi::Runtime, if any.
   * \param jsExecutor A RuntimeExecutor that can be used to schedule work on
   * the JS runtime's thread. The executor's queue should be empty when
   * RuntimeTarget is constructed (i.e. anything scheduled during the
   * constructor should be executed before any user code is run).
   */
  RuntimeTarget(
      ExecutionContextDescription executionContextDescription,
      RuntimeTargetDelegate &delegate,
      RuntimeExecutor jsExecutor);

  const ExecutionContextDescription executionContextDescription_;
  RuntimeTargetDelegate &delegate_;
  RuntimeExecutor jsExecutor_;
  WeakList<RuntimeAgent> agents_;
  RuntimeTargetController controller_{*this};

  /**
   * Keeps track of the agents that have enabled various domains.
   */
  EnumArray<Domain, std::unordered_set<const RuntimeAgent *>> agentsByEnabledDomain_;

  /**
   * For each Domain, contains true if the domain has been enabled by any
   * active agent. Unlike agentsByEnabledDomain_, this is safe to read from any
   * thread. \see isDomainEnabled.
   */
  EnumArray<Domain, std::atomic<bool>> threadSafeDomainStatus_{};

  /**
   * The number of agents that currently have both the Log and Runtime domains
   * enabled.
   */
  size_t agentsWithRuntimeAndLogDomainsEnabled_{0};

  /**
   * This TracingAgent is owned by the InstanceTracingAgent, both are bound to
   * the lifetime of their corresponding targets and the lifetime of the tracing
   * session - HostTargetTraceRecording.
   */
  std::weak_ptr<RuntimeTracingAgent> tracingAgent_;

  /**
   * Start sampling profiler for a particular JavaScript runtime.
   */
  void enableSamplingProfiler();
  /**
   * Stop sampling profiler for a particular JavaScript runtime.
   */
  void disableSamplingProfiler();
  /**
   * Return recorded sampling profile for the previous sampling session.
   */
  tracing::RuntimeSamplingProfile collectSamplingProfile();

  /**
   * Adds a function with the given name on the runtime's global object, that
   * when called will send a Runtime.bindingCalled event through all connected
   * sessions that have registered to receive binding events for that name.
   */
  void installBindingHandler(const std::string &bindingName);

  /**
   * Evaluates the given JavaScript source on the runtime's thread before any
   * user code runs. Used to replay @cdp
   * Page.addScriptToEvaluateOnNewDocument scripts onto a freshly created
   * runtime.
   */
  void installScriptToEvaluateOnNewDocument(const std::string &source);

  /**
   * Installs any global values we want to expose to framework/user JavaScript
   * code.
   */
  void installGlobals();

  /**
   * Installs __notifyFastRefreshComplete on the runtime's global object.
   * When called from JS, dispatches to all connected RuntimeAgents.
   */
  void installFastRefreshHandler();

  /**
   * Install the console API handler.
   */
  void installConsoleHandler();
  /**
   * Returns whether console.createTask should actually capture stack traces.
   */
  bool isConsoleCreateTaskEnabled() const;

  /**
   * Installs __DEBUGGER_SESSION_OBSERVER__ object on the JavaScript's global
   * object, which later could be referenced from JavaScript side for
   * determining the status of the debugger session.
   */
  void installDebuggerSessionObserver();

  /**
   * Installs __TRACING_STATE_OBSERVER__ object on the JavaScript's global
   * object, which can be referenced from JavaScript side for determining the
   * status of performance tracing.
   */
  void installTracingStateObserver();

  /**
   * Installs the private __NETWORK_REPORTER__ object on the Runtime's
   * global object.
   */
  void installNetworkReporterAPI();

  /**
   * Propagates the debugger session state change to the JavaScript via calling
   * onStatusChange on __DEBUGGER_SESSION_OBSERVER__.
   */
  void emitDebuggerSessionCreated();

  /**
   * Propagates the debugger session state change to the JavaScript via calling
   * onStatusChange on __DEBUGGER_SESSION_OBSERVER__.
   */
  void emitDebuggerSessionDestroyed();

  /**
   * Emits a tracing state change to JavaScript via the tracing state observer.
   */
  void emitTracingStateChange(bool isTracing);

  /**
   * \returns a globally unique ID for a network request.
   * May be called from any thread as long as the RuntimeTarget is valid.
   */
  std::string createNetworkRequestId();

  /**
   * Notifies the target that an agent has received an enable or disable
   * message for the given domain.
   */
  void notifyDomainStateChanged(Domain domain, bool enabled, const RuntimeAgent &notifyingAgent);

  /**
   * Processes the changes to the state of a given domain.
   *
   * Returns a pair of booleans:
   *   1. Returns true, if an only if the given domain state changed locally,
   *   for a given session.
   *   2. Returns true, if and only if the given domain state changed globally:
   *   when the given Agent is the only Agent that enabled given domain across
   *   sessions, or when the only Agent that had this domain enabled has
   *   disconnected.
   */
  std::pair<bool, bool> processDomainChange(Domain domain, bool enabled, const RuntimeAgent &notifyingAgent);

  /**
   * Checks whether the given domain is enabled in at least one session
   * that is currently connected. This may be called from any thread, with
   * the caveat that the result can change at arbitrary times unless the caller
   * is on the inspector thread.
   */
  bool isDomainEnabled(Domain domain) const;

  // Necessary to allow RuntimeAgent to access RuntimeTarget's internals in a
  // controlled way (i.e. only RuntimeTargetController gets friend access, while
  // RuntimeAgent itself doesn't).
  friend class RuntimeTargetController;
};

} // namespace facebook::react::jsinspector_modern
