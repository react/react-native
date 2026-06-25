/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/ByteBuffer.h>
#include <fbjni/fbjni.h>

#include <jsinspector-modern/HostTarget.h>
#include <react/jni/InspectorNetworkRequestListener.h>
#include <react/jni/JExecutor.h>

#include <mutex>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

struct JTracingState : public jni::JavaClass<JTracingState> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/TracingState;";
};

namespace {

enum class TracingState {
  Disabled,
  EnabledInBackgroundMode,
  EnabledInCDPMode,
};

jni::local_ref<JTracingState::javaobject> convertCPPTracingStateToJava(TracingState tracingState)
{
  auto tracingStateClass = jni::findClassLocal("com/facebook/react/devsupport/inspector/TracingState");
  auto valueOfMethod = tracingStateClass->getStaticMethod<JTracingState(jstring)>("valueOf");

  switch (tracingState) {
    case TracingState::Disabled:
      return valueOfMethod(tracingStateClass, jni::make_jstring("DISABLED").get());

    case TracingState::EnabledInBackgroundMode:
      return valueOfMethod(tracingStateClass, jni::make_jstring("ENABLED_IN_BACKGROUND_MODE").get());

    case TracingState::EnabledInCDPMode:
      return valueOfMethod(tracingStateClass, jni::make_jstring("ENABLED_IN_CDP_MODE").get());

    default:
      jni::throwNewJavaException("java/lang/IllegalStateException", "Unexpected new TracingState.");
  }
}

} // namespace

struct JTaskInterface : public jni::JavaClass<JTaskInterface> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/interfaces/TaskInterface;";
};

struct JTracingStateListener : public jni::JavaClass<JTracingStateListener> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/TracingStateListener;";

  void onStateChanged(TracingState tracingState, bool screenshotsEnabled) const
  {
    static auto method =
        javaClassStatic()->getMethod<void(jni::local_ref<JTracingState::javaobject>, jboolean)>("onStateChanged");
    return method(self(), convertCPPTracingStateToJava(tracingState), static_cast<jboolean>(screenshotsEnabled));
  }
};

struct JFrameTimingSequence : public jni::JavaClass<JFrameTimingSequence> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/devsupport/inspector/FrameTimingSequence;";

  uint64_t getId() const
  {
    auto field = javaClassStatic()->getField<jint>("id");
    return static_cast<uint64_t>(getFieldValue(field));
  }

  uint64_t getThreadId() const
  {
    auto field = javaClassStatic()->getField<jint>("threadId");
    return static_cast<uint64_t>(getFieldValue(field));
  }

  HighResTimeStamp getBeginTimestamp() const
  {
    auto field = javaClassStatic()->getField<jlong>("beginTimestamp");
    return HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(std::chrono::nanoseconds(getFieldValue(field))));
  }

  HighResTimeStamp getEndTimestamp() const
  {
    auto field = javaClassStatic()->getField<jlong>("endTimestamp");
    return HighResTimeStamp::fromChronoSteadyClockTimePoint(
        std::chrono::steady_clock::time_point(std::chrono::nanoseconds(getFieldValue(field))));
  }

  std::optional<std::vector<uint8_t>> getScreenshot() const
  {
    auto field = javaClassStatic()->getField<jbyteArray>("screenshot");
    auto javaScreenshot = getFieldValue(field);
    if (javaScreenshot) {
      auto size = static_cast<size_t>(javaScreenshot->size());
      if (size > 0) {
        std::vector<uint8_t> result(size);
        javaScreenshot->getRegion(0, javaScreenshot->size(), reinterpret_cast<jbyte *>(result.data()));
        return result;
      }
    }
    return std::nullopt;
  }
};

struct JReactHostImpl : public jni::JavaClass<JReactHostImpl> {
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/runtime/ReactHostImpl;";

  jni::local_ref<JTaskInterface::javaobject> reload(const std::string &reason)
  {
    static auto method = javaClassStatic()->getMethod<JTaskInterface::javaobject(std::string)>("reload");
    return method(self(), reason);
  }

  void setPausedInDebuggerMessage(std::optional<std::string> message)
  {
    static auto method = javaClassStatic()->getMethod<void(jni::local_ref<jni::JString>)>("setPausedInDebuggerMessage");
    method(self(), message ? jni::make_jstring(*message) : nullptr);
  }

  jni::local_ref<jni::JMap<jstring, jstring>> getHostMetadata() const
  {
    static auto method = javaClassStatic()->getMethod<jni::local_ref<jni::JMap<jstring, jstring>>()>("getHostMetadata");
    return method(self());
  }

  void loadNetworkResource(const std::string &url, jni::local_ref<InspectorNetworkRequestListener::javaobject> listener)
      const
  {
    auto method = javaClassStatic()
                      ->getMethod<void(
                          jni::local_ref<jni::JString>, jni::local_ref<InspectorNetworkRequestListener::javaobject>)>(
                          "loadNetworkResource");
    return method(self(), jni::make_jstring(url), listener);
  }

  jni::local_ref<jni::JString> captureScreenshot(const std::string &format, int quality) const
  {
    auto method = javaClassStatic()->getMethod<jni::local_ref<jni::JString>(jni::local_ref<jni::JString>, jint)>(
        "captureScreenshot");
    return method(self(), jni::make_jstring(format), static_cast<jint>(quality));
  }

  void setEmulatedMedia(const std::string &colorScheme)
  {
    static auto method = javaClassStatic()->getMethod<void(jni::local_ref<jni::JString>)>("setEmulatedMedia");
    method(self(), jni::make_jstring(colorScheme));
  }
};

/**
 * A callback that will be invoked when tracing state has changed.
 */
using TracingStateListener = std::function<void(TracingState state, bool screenshotsCategoryEnabled)>;

class TracingDelegate : public jsinspector_modern::HostTargetTracingDelegate {
 public:
  void onTracingStarted(jsinspector_modern::tracing::Mode tracingMode, bool screenshotsCategoryEnabled) override;
  void onTracingStopped() override;

  /**
   * A synchronous way to get the current tracing state.
   * Could be called from any thread.
   */
  TracingState getTracingState();
  /**
   * Register a listener that will be notified when the tracing state changes.
   * Could be called from any thread.
   */
  size_t registerTracingStateListener(TracingStateListener listener);
  /**
   * Unregister previously registered listener with the id returned from
   * TracingDelegate::registerTracingStateListener().
   */
  void unregisterTracingStateListener(size_t subscriptionId);

 private:
  /**
   * Covers read / write operations on tracingState_ and subscriptions_.
   */
  std::mutex mutex_;
  /**
   * Since HostInspectorTarget creates HostTarget, the default value is Disabled.
   * However, the TracingDelegate is subscribed at the construction of HostTarget, so it will be notified as early as
   * possible.
   */
  TracingState tracingState_ = TracingState::Disabled;
  /**
   * Map of subscription ID to listener.
   */
  std::unordered_map<size_t, TracingStateListener> subscriptions_;
  /**
   * A counter for generating unique subscription IDs.
   */
  uint64_t nextSubscriptionId_ = 0;
  /**
   * Returns a collection of listeners that are subscribed at the time of the call.
   * Expected to be only called with mutex_ locked.
   */
  std::vector<TracingStateListener> copySubscribedListeners();
  /**
   * Notifies specified listeners about the state change.
   */
  void notifyListeners(
      const std::vector<TracingStateListener> &listeners,
      TracingState state,
      bool screenshotsCategoryEnabled);
};

class JReactHostInspectorTarget : public jni::HybridClass<JReactHostInspectorTarget>,
                                  public jsinspector_modern::HostTargetDelegate {
 public:
  static constexpr auto kJavaDescriptor = "Lcom/facebook/react/runtime/ReactHostInspectorTarget;";

  ~JReactHostInspectorTarget() override;

  static jni::local_ref<JReactHostInspectorTarget::jhybriddata> initHybrid(
      jni::alias_ref<JReactHostInspectorTarget::jhybridobject> jobj,
      jni::alias_ref<JReactHostImpl> reactHost,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);

  static void registerNatives();
  void sendDebuggerResumeCommand();

  /**
   * Starts a background trace recording for this HostTarget.
   *
   * \return false if already tracing, true otherwise.
   */
  bool startBackgroundTrace();
  /**
   * Stops previously started trace recording and:
   *  - If there is an active CDP session with Fusebox client enabled, emits the
   * trace and returns true.
   *  - Otherwise, stashes the captured trace, that will be emitted when the CDP
   * session is initialized. Returns false.
   */
  jboolean stopAndMaybeEmitBackgroundTrace();
  /**
   * Stops previously started trace recording and discards the captured trace.
   */
  void stopTracing();

  jsinspector_modern::HostTarget *getInspectorTarget();

  /**
   * Get the current tracing state. Could be called from any thread.
   */
  jni::local_ref<JTracingState::javaobject> getTracingState();

  /**
   * Register a listener that will be notified when the tracing state changes.
   * Could be called from any thread.
   *
   * \return A unique subscription ID to use for unregistering the listener.
   */
  jlong registerTracingStateListener(jni::alias_ref<JTracingStateListener::javaobject> listener);

  /**
   * Unregister a previously registered tracing state listener.
   *
   * \param subscriptionId The subscription ID returned from JReactHostInspectorTarget::registerTracingStateListener.
   */
  void unregisterTracingStateListener(jlong subscriptionId);

  /**
   * Propagate frame timings information to the Inspector's Tracing subsystem.
   */
  void recordFrameTimings(jni::alias_ref<JFrameTimingSequence::javaobject> frameTimingSequence);

  // HostTargetDelegate methods
  jsinspector_modern::HostTargetMetadata getMetadata() override;
  void onReload(const PageReloadRequest &request) override;
  void onSetPausedInDebuggerMessage(const OverlaySetPausedInDebuggerMessageRequest &request) override;
  void unstable_onPerfIssueAdded(const jsinspector_modern::PerfIssuePayload &issue) override;
  void loadNetworkResource(
      const jsinspector_modern::LoadNetworkResourceRequest &params,
      jsinspector_modern::ScopedExecutor<jsinspector_modern::NetworkRequestListener> executor) override;
  std::optional<std::string> captureScreenshot(
      const jsinspector_modern::HostTargetDelegate::PageCaptureScreenshotRequest &request) override;
  bool onSetEmulatedMedia(const jsinspector_modern::HostTargetDelegate::SetEmulatedMediaRequest &request) override;
  jsinspector_modern::HostTargetTracingDelegate *getTracingDelegate() override;

 private:
  JReactHostInspectorTarget(
      jni::alias_ref<JReactHostInspectorTarget::javaobject> jobj,
      jni::alias_ref<JReactHostImpl> reactHostImpl,
      jni::alias_ref<JExecutor::javaobject> javaExecutor);

  /**
   * Returns a reference to the HostTarget, throwing a Java IllegalStateException
   * if the Fusebox backend is not enabled (i.e., inspectorTarget_ is null).
   */
  jsinspector_modern::HostTarget &inspectorTarget();

  jni::global_ref<JReactHostInspectorTarget::javaobject> jobj_;
  // This weak reference breaks the cycle between the C++ HostTarget and the
  // Java ReactHostImpl, preventing memory leaks in apps that create multiple
  // ReactHostImpls over time.
  jni::global_ref<jni::JWeakReference<JReactHostImpl>> javaReactHostImpl_;
  jsinspector_modern::VoidExecutor inspectorExecutor_;

  std::shared_ptr<jsinspector_modern::HostTarget> inspectorTarget_;
  std::optional<int> inspectorPageId_;

  /**
   * Encapsulates the logic around tracing for this HostInspectorTarget.
   */
  std::unique_ptr<TracingDelegate> tracingDelegate_;

  friend HybridBase;
};
} // namespace facebook::react
