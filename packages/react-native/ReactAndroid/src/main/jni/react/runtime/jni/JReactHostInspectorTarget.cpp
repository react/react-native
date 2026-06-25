/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactHostInspectorTarget.h"

#include <fbjni/NativeRunnable.h>
#include <jsinspector-modern/InspectorFlags.h>
#include <react/jni/JWeakRefUtils.h>
#include <react/jni/SafeReleaseJniRef.h>

using namespace facebook::jni;
using namespace facebook::react::jsinspector_modern;

namespace facebook::react {

JReactHostInspectorTarget::JReactHostInspectorTarget(
    alias_ref<JReactHostInspectorTarget::javaobject> jobj,
    alias_ref<JReactHostImpl> reactHostImpl,
    alias_ref<JExecutor::javaobject> executor)
    : jobj_(make_global(jobj)),
      javaReactHostImpl_(make_global(makeJWeakReference(reactHostImpl))),
      inspectorExecutor_([javaExecutor =
                              // Use a SafeReleaseJniRef because this lambda may
                              // be copied to arbitrary threads.
                          SafeReleaseJniRef(make_global(executor))](
                             std::function<void()>&& callback) mutable {
        auto jrunnable = JNativeRunnable::newObjectCxxArgs(std::move(callback));
        javaExecutor->execute(jrunnable);
      }),
      tracingDelegate_(std::make_unique<TracingDelegate>()) {
  auto& inspectorFlags = InspectorFlags::getInstance();
  if (inspectorFlags.getFuseboxEnabled()) {
    inspectorTarget_ = HostTarget::create(*this, inspectorExecutor_);

    inspectorPageId_ = getInspectorInstance().addPage(
        "React Native Bridgeless",
        /* vm */ "",
        [inspectorTargetWeak = std::weak_ptr(inspectorTarget_)](
            std::unique_ptr<IRemoteConnection> remote)
            -> std::unique_ptr<ILocalConnection> {
          if (auto inspectorTarget = inspectorTargetWeak.lock()) {
            return inspectorTarget->connect(std::move(remote));
          }
          // Reject the connection.
          return nullptr;
        },
        {.nativePageReloads = true});
  }
}

JReactHostInspectorTarget::~JReactHostInspectorTarget() {
  if (inspectorPageId_.has_value()) {
    // Remove the page (terminating all sessions) and destroy the target, both
    // on the inspector queue.
    inspectorExecutor_([inspectorPageId = *inspectorPageId_,
                        inspectorTarget = std::move(inspectorTarget_)]() {
      getInspectorInstance().removePage(inspectorPageId);
      (void)inspectorTarget;
    });
  }
}

local_ref<JReactHostInspectorTarget::jhybriddata>
JReactHostInspectorTarget::initHybrid(
    alias_ref<JReactHostInspectorTarget::jhybridobject> jobj,
    jni::alias_ref<JReactHostImpl> reactHostImpl,
    jni::alias_ref<JExecutor::javaobject> javaExecutor) {
  return makeCxxInstance(jobj, reactHostImpl, javaExecutor);
}

void JReactHostInspectorTarget::sendDebuggerResumeCommand() {
  inspectorTarget().sendCommand(HostCommand::DebuggerResume);
}

jsinspector_modern::HostTarget& JReactHostInspectorTarget::inspectorTarget() {
  if (inspectorTarget_) {
    return *inspectorTarget_;
  }
  jni::throwNewJavaException(
      "java/lang/IllegalStateException",
      "Inspector method called while the Fusebox backend is not enabled.");
}

jsinspector_modern::HostTargetMetadata
JReactHostInspectorTarget::getMetadata() {
  jsinspector_modern::HostTargetMetadata metadata = {
      .integrationName = "Android Bridgeless (ReactHostImpl)",
  };

  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    auto javaMetadata = javaReactHostImplStrong->getHostMetadata();
    auto getMethod = jni::JMap<jstring, jstring>::javaClassLocal()
                         ->getMethod<jobject(jobject)>("get");

    auto getStringOptional = [&](const std::string& key) {
      auto result = getMethod(javaMetadata, make_jstring(key).get());
      return result ? std::optional<std::string>(result->toString())
                    : std::nullopt;
    };

    metadata.appDisplayName = getStringOptional("appDisplayName");
    metadata.appIdentifier = getStringOptional("appIdentifier");
    metadata.deviceName = getStringOptional("deviceName");
    metadata.platform = getStringOptional("platform");
    metadata.reactNativeVersion = getStringOptional("reactNativeVersion");
  }

  return metadata;
}

void JReactHostInspectorTarget::onReload(const PageReloadRequest& /*request*/) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->reload("CDP Page.reload");
  }
}

void JReactHostInspectorTarget::onSetPausedInDebuggerMessage(
    const OverlaySetPausedInDebuggerMessageRequest& request) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->setPausedInDebuggerMessage(request.message);
  }
}

void JReactHostInspectorTarget::unstable_onPerfIssueAdded(
    const PerfIssuePayload& issue) {
  static auto method = javaClassStatic()->getMethod<void(local_ref<jstring>)>(
      "handleNativePerfIssueAdded");
  method(jobj_, make_jstring(issue.name));
}

void JReactHostInspectorTarget::loadNetworkResource(
    const jsinspector_modern::LoadNetworkResourceRequest& params,
    jsinspector_modern::ScopedExecutor<
        jsinspector_modern::NetworkRequestListener> executor) {
  // Construct InspectorNetworkRequestListener (hybrid class) from the C++ side
  // (holding the ScopedExecutor), pass to the delegate.
  auto listener = InspectorNetworkRequestListener::newObjectCxxArgs(executor);

  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->loadNetworkResource(params.url, listener);
  }
}

std::optional<std::string> JReactHostInspectorTarget::captureScreenshot(
    const jsinspector_modern::HostTargetDelegate::PageCaptureScreenshotRequest&
        request) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    std::string format = request.format.value_or("png");
    int quality = request.quality.value_or(-1);
    auto result = javaReactHostImplStrong->captureScreenshot(format, quality);
    if (result) {
      return result->toStdString();
    }
  }
  return std::nullopt;
}

bool JReactHostInspectorTarget::onSetEmulatedMedia(
    const jsinspector_modern::HostTargetDelegate::SetEmulatedMediaRequest&
        request) {
  if (auto javaReactHostImplStrong = javaReactHostImpl_->get()) {
    javaReactHostImplStrong->setEmulatedMedia(request.colorScheme);
    return true;
  }
  return false;
}

HostTarget* JReactHostInspectorTarget::getInspectorTarget() {
  return inspectorTarget_ ? inspectorTarget_.get() : nullptr;
}

bool JReactHostInspectorTarget::startBackgroundTrace() {
  return inspectorTarget().startTracing(
      tracing::Mode::Background,
      {
          tracing::Category::HiddenTimeline,
          tracing::Category::RuntimeExecution,
          tracing::Category::Timeline,
          tracing::Category::UserTiming,
      });
}

void JReactHostInspectorTarget::stopTracing() {
  inspectorTarget().stopTracing();
}

jboolean JReactHostInspectorTarget::stopAndMaybeEmitBackgroundTrace() {
  return jboolean(inspectorTarget().stopAndMaybeEmitBackgroundTrace());
}

void JReactHostInspectorTarget::registerNatives() {
  registerHybrid({
      makeNativeMethod("initHybrid", JReactHostInspectorTarget::initHybrid),
      makeNativeMethod(
          "sendDebuggerResumeCommand",
          JReactHostInspectorTarget::sendDebuggerResumeCommand),
      makeNativeMethod(
          "startBackgroundTrace",
          JReactHostInspectorTarget::startBackgroundTrace),
      makeNativeMethod(
          "stopAndMaybeEmitBackgroundTrace",
          JReactHostInspectorTarget::stopAndMaybeEmitBackgroundTrace),
      makeNativeMethod("stopTracing", JReactHostInspectorTarget::stopTracing),
      makeNativeMethod(
          "getTracingState", JReactHostInspectorTarget::getTracingState),
      makeNativeMethod(
          "registerTracingStateListener",
          JReactHostInspectorTarget::registerTracingStateListener),
      makeNativeMethod(
          "unregisterTracingStateListener",
          JReactHostInspectorTarget::unregisterTracingStateListener),
      makeNativeMethod(
          "recordFrameTimings", JReactHostInspectorTarget::recordFrameTimings),
  });
}

jni::local_ref<JTracingState::javaobject>
JReactHostInspectorTarget::getTracingState() {
  return convertCPPTracingStateToJava(tracingDelegate_->getTracingState());
}

jlong JReactHostInspectorTarget::registerTracingStateListener(
    jni::alias_ref<JTracingStateListener::javaobject> listener) {
  auto cppListener = [globalRef = make_global(listener)](
                         TracingState tracingState, bool screenshotsEnabled) {
    globalRef->onStateChanged(tracingState, screenshotsEnabled);
  };

  return static_cast<jlong>(
      tracingDelegate_->registerTracingStateListener(std::move(cppListener)));
}

void JReactHostInspectorTarget::unregisterTracingStateListener(
    jlong subscriptionId) {
  tracingDelegate_->unregisterTracingStateListener(subscriptionId);
}

HostTargetTracingDelegate* JReactHostInspectorTarget::getTracingDelegate() {
  return tracingDelegate_.get();
}

void JReactHostInspectorTarget::recordFrameTimings(
    jni::alias_ref<JFrameTimingSequence::javaobject> frameTimingSequence) {
  inspectorTarget().recordFrameTimings({
      frameTimingSequence->getId(),
      frameTimingSequence->getThreadId(),
      frameTimingSequence->getBeginTimestamp(),
      frameTimingSequence->getEndTimestamp(),
      frameTimingSequence->getScreenshot(),
  });
}

void TracingDelegate::onTracingStarted(
    tracing::Mode tracingMode,
    bool screenshotsCategoryEnabled) {
  TracingState nextState = TracingState::Disabled;
  switch (tracingMode) {
    case tracing::Mode::CDP:
      nextState = TracingState::EnabledInCDPMode;
      break;
    case tracing::Mode::Background:
      nextState = TracingState::EnabledInBackgroundMode;
      break;
    default:
      throw std::logic_error("Unexpected new Tracing Mode");
  }

  std::vector<TracingStateListener> listeners;
  {
    std::lock_guard<std::mutex> lock(mutex_);

    tracingState_ = nextState;
    listeners = copySubscribedListeners();
  }

  notifyListeners(listeners, nextState, screenshotsCategoryEnabled);
}

void TracingDelegate::onTracingStopped() {
  std::vector<TracingStateListener> listeners;
  {
    std::lock_guard<std::mutex> lock(mutex_);

    tracingState_ = TracingState::Disabled;
    listeners = copySubscribedListeners();
  }

  notifyListeners(listeners, TracingState::Disabled, false);
}

TracingState TracingDelegate::getTracingState() {
  std::lock_guard<std::mutex> lock(mutex_);

  return tracingState_;
}

size_t TracingDelegate::registerTracingStateListener(
    TracingStateListener listener) {
  std::lock_guard<std::mutex> lock(mutex_);

  auto id = nextSubscriptionId_++;
  subscriptions_[id] = std::move(listener);
  return id;
}

void TracingDelegate::unregisterTracingStateListener(size_t subscriptionId) {
  std::lock_guard<std::mutex> lock(mutex_);

  subscriptions_.erase(subscriptionId);
}

std::vector<TracingStateListener> TracingDelegate::copySubscribedListeners() {
  std::vector<TracingStateListener> listeners;
  listeners.reserve(subscriptions_.size());

  for (auto& [_, listener] : subscriptions_) {
    listeners.push_back(listener);
  }

  return listeners;
}

void TracingDelegate::notifyListeners(
    const std::vector<TracingStateListener>& listeners,
    TracingState state,
    bool screenshotsCategoryEnabled) {
  for (const auto& listener : listeners) {
    listener(state, screenshotsCategoryEnabled);
  }
}

} // namespace facebook::react
