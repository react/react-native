/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "ExecutionContextManager.h"
#include "HostCommand.h"
#include "InspectorInterfaces.h"
#include "InstanceTarget.h"
#include "NetworkIOAgent.h"
#include "PerfMonitorV2.h"
#include "ScopedExecutor.h"
#include "WeakList.h"

#include <functional>
#include <optional>
#include <set>
#include <string>

#include <jsinspector-modern/tracing/FrameTimingSequence.h>
#include <jsinspector-modern/tracing/HostTracingProfile.h>
#include <jsinspector-modern/tracing/TraceRecordingState.h>
#include <jsinspector-modern/tracing/TracingCategory.h>
#include <jsinspector-modern/tracing/TracingMode.h>

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

class HostTargetSession;
class HostAgent;
class HostTracingAgent;
class HostCommandSender;
class HostRuntimeBinding;
class HostTarget;
class HostTargetTraceRecording;

struct HostTargetMetadata {
  std::optional<std::string> appDisplayName{};
  std::optional<std::string> appIdentifier{};
  std::optional<std::string> deviceName{};
  std::optional<std::string> integrationName;
  std::optional<std::string> platform{};
  std::optional<std::string> reactNativeVersion{};
};

/**
 * Receives any performance-related events from a HostTarget: could be Tracing, Performance Monitor, etc.
 */
class HostTargetTracingDelegate {
 public:
  HostTargetTracingDelegate() = default;
  virtual ~HostTargetTracingDelegate() = default;

  /**
   * Fired when the corresponding HostTarget started recording a tracing session.
   * The tracing state is expected to be initialized at this point and the delegate should be able to record events
   * through HostTarget.
   */
  virtual void onTracingStarted(tracing::Mode /* tracingMode */, bool /* screenshotsCategoryEnabled */) {}

  /**
   * Fired when the corresponding HostTarget is about to end recording a tracing session.
   * The tracing state is expected to be still initialized during the call and the delegate should be able to record
   * events through HostTarget.
   *
   * Any attempts to record events after this callback is finished will fail.
   */
  virtual void onTracingStopped() {}

  HostTargetTracingDelegate(const HostTargetTracingDelegate &) = delete;
  HostTargetTracingDelegate(HostTargetTracingDelegate &&) = delete;
  HostTargetTracingDelegate &operator=(const HostTargetTracingDelegate &) = delete;
  HostTargetTracingDelegate &operator=(HostTargetTracingDelegate &&) = delete;
};

/**
 * Receives events from a HostTarget. This is a shared interface that each
 * React Native platform needs to implement in order to integrate with the
 * debugging stack.
 */
class HostTargetDelegate : public LoadNetworkResourceDelegate {
 public:
  HostTargetDelegate() = default;
  HostTargetDelegate(const HostTargetDelegate &) = delete;
  HostTargetDelegate(HostTargetDelegate &&) = delete;
  HostTargetDelegate &operator=(const HostTargetDelegate &) = delete;
  HostTargetDelegate &operator=(HostTargetDelegate &&) = delete;

  // TODO(moti): This is 1:1 the shape of the corresponding CDP message -
  // consider reusing typed/generated CDP interfaces when we have those.
  struct PageReloadRequest {
    // It isn't clear what the ignoreCache parameter of @cdp Page.reload should
    // mean in React Native. We parse it, but don't do anything with it yet.
    std::optional<bool> ignoreCache;

    // TODO: Implement scriptToEvaluateOnLoad parameter of @cdp Page.reload.
    std::optional<std::string> scriptToEvaluateOnLoad;

    /**
     * Equality operator, useful for unit tests
     */
    inline bool operator==(const PageReloadRequest &rhs) const
    {
      return ignoreCache == rhs.ignoreCache && scriptToEvaluateOnLoad == rhs.scriptToEvaluateOnLoad;
    }
  };

  struct OverlaySetPausedInDebuggerMessageRequest {
    /**
     * The message to display in the overlay. If nullopt, hide the overlay.
     */
    std::optional<std::string> message;

    /**
     * Equality operator, useful for unit tests
     */
    inline bool operator==(const OverlaySetPausedInDebuggerMessageRequest &rhs) const
    {
      return message == rhs.message;
    }
  };

  struct PageCaptureScreenshotRequest {
    /**
     * Image compression format. Defaults to "png".
     * Allowed values: "jpeg", "png", "webp".
     */
    std::optional<std::string> format;

    /**
     * Compression quality from range [0..100] (jpeg only).
     */
    std::optional<int> quality;
  };

  struct SetEmulatedMediaRequest {
    /**
     * The color scheme to emulate: "light", "dark", or "" (reset to system
     * default).
     */
    std::string colorScheme;

    inline bool operator==(const SetEmulatedMediaRequest &rhs) const
    {
      return colorScheme == rhs.colorScheme;
    }
  };

  virtual ~HostTargetDelegate() override;

  /**
   * Returns a metadata object describing the host. This is called on an
   * initial response to @cdp ReactNativeApplication.enable.
   */
  virtual HostTargetMetadata getMetadata() = 0;

  /**
   * Called when the debugger requests a reload of the page. This is called on
   * the thread on which messages are dispatched to the session (that is, where
   * ILocalConnection::sendMessage was called).
   */
  virtual void onReload(const PageReloadRequest &request) = 0;

  /**
   * Called when the debugger requests that the "paused in debugger" overlay be
   * shown or hidden. If the message is nullopt, hide the overlay, otherwise
   * show it with the given message. This is called on the inspector thread.
   *
   * If this method is called with a non-null message, it's guaranteed to
   * eventually be called again with a null message. In all other respects,
   * the timing and payload of these messages are fully controlled by the
   * client.
   */
  virtual void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) = 0;

  /**
   * [Experimental] Called when the runtime has new data for the V2 Perf
   * Monitor overlay. This is called on the inspector thread.
   */
  virtual void unstable_onPerfIssueAdded(const PerfIssuePayload & /*issue*/) {}

  /**
   * Called by NetworkIOAgent on handling a `Network.loadNetworkResource` CDP
   * request. Platform implementations should override this to perform a
   * network request of the given URL, and use listener's callbacks on receipt
   * of headers, data chunks, and errors.
   */
  void loadNetworkResource(
      const LoadNetworkResourceRequest & /*params*/,
      ScopedExecutor<NetworkRequestListener> /*executor*/) override
  {
    throw NotImplementedException(
        "LoadNetworkResourceDelegate.loadNetworkResource is not implemented by this host target delegate.");
  }

  /**
   * Called when the debugger requests a screenshot of the current page via
   * @cdp Page.captureScreenshot. The delegate should capture the current
   * view, encode it to the requested format, and return base64-encoded
   * image data. Return std::nullopt on failure.
   */
  virtual std::optional<std::string> captureScreenshot(const PageCaptureScreenshotRequest & /*request*/)
  {
    return std::nullopt;
  }

  /**
   * Called when the debugger requests an emulated media override via
   * @cdp Emulation.setEmulatedMedia. Currently only supports the
   * prefers-color-scheme media feature.
   *
   * \returns true if the override was applied successfully.
   */
  virtual bool onSetEmulatedMedia(const SetEmulatedMediaRequest & /*request*/)
  {
    return false;
  }

  /**
   * An optional delegate that will be used by HostTarget to notify about tracing-related events.
   */
  virtual HostTargetTracingDelegate *getTracingDelegate()
  {
    return nullptr;
  }
};

/**
 * The limited interface that HostTarget exposes to its associated
 * sessions/agents.
 */
class HostTargetController final {
 public:
  explicit HostTargetController(HostTarget &target);

  HostTargetDelegate &getDelegate();

  bool hasInstance() const;

  /**
   * Increments the target's pause overlay counter. The counter represents the
   * exact number of Agents that have (concurrently) requested the pause
   * overlay to be shown. It's the caller's responsibility to only call this
   * when the pause overlay's requested state transitions from hidden to
   * visible.
   */
  void incrementPauseOverlayCounter();

  /**
   * Decrements the target's pause overlay counter. The counter represents the
   * exact number of Agents that have (concurrently) requested the pause
   * overlay to be shown. It's the caller's responsibility to only call this
   * when the pause overlay's requested state transitions from hidden to
   * visible.
   * \returns false if the counter has reached 0, otherwise true.
   */
  bool decrementPauseOverlayCounter();

  /**
   * Starts trace recording for this HostTarget.
   *
   * \param mode In which mode to start the trace recording.
   * \param enabledCategories The set of categories to enable.
   *
   * \return false if already tracing, true otherwise.
   */
  bool startTracing(tracing::Mode mode, std::set<tracing::Category> enabledCategories);

  /**
   * Stops previously started trace recording.
   */
  tracing::HostTracingProfile stopTracing();

  /**
   * If there is a stashed background trace, emit it to all eligible sessions.
   * \return true if an eligible session is found (even if there was no stashed background trace).
   */
  bool maybeEmitStashedBackgroundTrace();

 private:
  HostTarget &target_;
  size_t pauseOverlayCounter_{0};
};

/**
 * The top-level Target in a React Native app. This is equivalent to the
 * "Host" in React Native's architecture - the entity that manages the
 * lifecycle of a React Instance.
 */
class JSINSPECTOR_EXPORT HostTarget : public EnableExecutorFromThis<HostTarget> {
 public:
  /**
   * Constructs a new HostTarget.
   *
   * \param delegate The HostTargetDelegate that will
   * receive events from this HostTarget. The caller is responsible for ensuring
   * that the HostTargetDelegate outlives this object.
   *
   * \param executor An executor that may be used to call methods on this
   * HostTarget while it exists. \c create additionally guarantees that the
   * executor will not be called after the HostTarget is destroyed.
   *
   * \note Copies of the provided executor may be destroyed on arbitrary
   * threads, including after the HostTarget is destroyed. Callers must ensure
   * that such destructor calls are safe - e.g. if using a lambda as the
   * executor, all captured values must be safe to destroy from any thread.
   */
  static std::shared_ptr<HostTarget> create(HostTargetDelegate &delegate, VoidExecutor executor);

  HostTarget(const HostTarget &) = delete;
  HostTarget(HostTarget &&) = delete;
  HostTarget &operator=(const HostTarget &) = delete;
  HostTarget &operator=(HostTarget &&) = delete;
  ~HostTarget();

  /**
   * Creates a new Session connected to this HostTarget, wrapped in an
   * interface which is compatible with \c IInspector::addPage.
   * The caller is responsible for destroying the connection before HostTarget
   * is destroyed, on the same thread where HostTarget's constructor and
   * destructor execute.
   */
  std::unique_ptr<ILocalConnection> connect(std::unique_ptr<IRemoteConnection> connectionToFrontend);

  /**
   * Registers an instance with this HostTarget.
   * \param delegate The InstanceTargetDelegate that will receive events from
   * this InstanceTarget. The caller is responsible for ensuring that the
   * InstanceTargetDelegate outlives this object.
   * \return An InstanceTarget reference representing the newly created
   * instance. This reference is only valid until unregisterInstance is called
   * (or the HostTarget is destroyed). \pre There isn't currently an instance
   * registered with this HostTarget.
   */
  InstanceTarget &registerInstance(InstanceTargetDelegate &delegate);

  /**
   * Unregisters an instance from this HostTarget.
   * \param instance The InstanceTarget reference previously returned by
   * registerInstance.
   */
  void unregisterInstance(InstanceTarget &instance);

  /**
   * Sends an imperative command to the HostTarget. May be called from any
   * thread.
   */
  void sendCommand(HostCommand command);

#pragma region Tracing
  /**
   * Creates a new HostTracingAgent.
   * This Agent is not owned by the HostTarget. The Agent will be destroyed at
   * the end of the tracing session.
   *
   * \param state A reference to the state of the active trace recording.
   */
  std::shared_ptr<HostTracingAgent> createTracingAgent(tracing::TraceRecordingState &state);

  /**
   * Starts trace recording for this HostTarget.
   *
   * \param mode In which mode to start the trace recording.
   * \param enabledCategories The set of categories to enable.
   *
   * \return false if already tracing, true otherwise.
   */
  bool startTracing(tracing::Mode mode, std::set<tracing::Category> enabledCategories);

  /**
   * Stops previously started trace recording.
   */
  tracing::HostTracingProfile stopTracing();

  /**
   * Stops previously started trace recording and:
   *  - If there is an active CDP session with ReactNativeApplication domain
   *    enabled, emits the trace and returns true.
   *  - Otherwise, stashes the captured trace, that will be emitted when a CDP
   *    session enables ReactNativeApplication. Returns false.
   */
  bool stopAndMaybeEmitBackgroundTrace();

  /**
   * An endpoint for the Host to report frame timings that will be recorded if and only if there is currently an active
   * tracing session.
   */
  void recordFrameTimings(tracing::FrameTimingSequence frameTimingSequence);
#pragma endregion

 private:
  /**
   * Constructs a new HostTarget.
   * The caller must call setExecutor immediately afterwards.
   *
   * \param delegate The HostTargetDelegate that will
   * receive events from this HostTarget. The caller is responsible for ensuring
   * that the HostTargetDelegate outlives this object.
   */
  HostTarget(HostTargetDelegate &delegate);

  HostTargetDelegate &delegate_;
  WeakList<HostTargetSession> sessions_;
  HostTargetController controller_{*this};
  // executionContextManager_ is a shared_ptr to guarantee its validity while
  // the InstanceTarget is alive (just in case the InstanceTarget ends up
  // briefly outliving the HostTarget, which it generally shouldn't).
  std::shared_ptr<ExecutionContextManager> executionContextManager_;
  std::shared_ptr<InstanceTarget> currentInstance_{nullptr};
  std::unique_ptr<HostCommandSender> commandSender_;
  std::unique_ptr<PerfMonitorUpdateHandler> perfMonitorUpdateHandler_;
  std::unique_ptr<HostRuntimeBinding> perfMetricsBinding_;

#pragma region Tracing
  /**
   * Current pending trace recording, which encapsulates the configuration of
   * the tracing session and the state.
   *
   * Should only be allocated when there is an active tracing session.
   */
  std::unique_ptr<HostTargetTraceRecording> traceRecording_{nullptr};
  /**
   * Previously recorded HostTracingProfile that will be emitted when CDP session is created
   * and enables ReactNativeApplication. Once emitted, the value will be cleared.
   */
  std::optional<tracing::HostTracingProfile> stashedTracingProfile_;
  /**
   * Protects the state inside traceRecording_.
   *
   * Calls to tracing subsystem could happen from different threads, depending on the mode (Background or CDP) and
   * the method: the Host could report frame timings from any arbitrary thread.
   */
  std::mutex tracingMutex_;
#pragma endregion

  inline HostTargetDelegate &getDelegate()
  {
    return delegate_;
  }

  inline bool hasInstance() const
  {
    return currentInstance_ != nullptr;
  }

  /**
   * [Experimental] Install a runtime binding subscribing to new Peformance
   * Issues, which we broadcast to the V2 Perf Monitor overlay via
   * \ref HostTargetDelegate::unstable_onPerfMonitorUpdate.
   */
  void installPerfIssuesBinding();

  /**
   * If there is a stashed background trace, emit it to the first eligible session.
   * \return true if an eligible session is found (even if there was no stashed background trace).
   */
  bool maybeEmitStashedBackgroundTrace();

  // Necessary to allow HostAgent to access HostTarget's internals in a
  // controlled way (i.e. only HostTargetController gets friend access, while
  // HostAgent itself doesn't).
  friend class HostTargetController;
};

folly::dynamic createHostMetadataPayload(const HostTargetMetadata &metadata);

} // namespace facebook::react::jsinspector_modern
