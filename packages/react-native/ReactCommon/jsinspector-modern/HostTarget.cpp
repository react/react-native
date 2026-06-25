/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostTarget.h"
#include "HostAgent.h"
#include "HostTargetTraceRecording.h"
#include "HostTargetTracing.h"
#include "InspectorInterfaces.h"
#include "InspectorUtilities.h"
#include "InstanceTarget.h"
#include "SessionState.h"

#include <jsinspector-modern/InspectorFlags.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <folly/dynamic.h>
#include <folly/json.h>

#include <memory>
#include <utility>

namespace facebook::react::jsinspector_modern {

/**
 * A Session connected to a HostTarget, passing CDP messages to and from a
 * HostAgent which it owns.
 */
class HostTargetSession {
 public:
  explicit HostTargetSession(
      std::unique_ptr<IRemoteConnection> remote,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      VoidExecutor executor)
      : remote_(std::make_shared<RAIIRemoteConnection>(std::move(remote))),
        frontendChannel_(
            [remoteWeak = std::weak_ptr(remote_)](std::string_view message) {
              if (auto remote = remoteWeak.lock()) {
                remote->onMessage(std::string(message));
              }
            }),
        hostAgent_(
            frontendChannel_,
            targetController,
            std::move(hostMetadata),
            state_,
            std::move(executor)) {}

  /**
   * Called by CallbackLocalConnection to send a message to this Session's
   * Agent.
   */
  void operator()(const std::string& message) {
    cdp::PreparsedRequest request;
    // Messages may be invalid JSON, or have unexpected types.
    try {
      request = cdp::preparse(message);
    } catch (const cdp::ParseError& e) {
      frontendChannel_(
          cdp::jsonError(std::nullopt, cdp::ErrorCode::ParseError, e.what()));
      return;
    } catch (const cdp::TypeError& e) {
      frontendChannel_(
          cdp::jsonError(
              std::nullopt, cdp::ErrorCode::InvalidRequest, e.what()));
      return;
    }

    try {
      hostAgent_.handleRequest(request);
    }
    // Catch exceptions that may arise from accessing dynamic params during
    // request handling.
    catch (const cdp::TypeError& e) {
      frontendChannel_(
          cdp::jsonError(request.id, cdp::ErrorCode::InvalidRequest, e.what()));
      return;
    }
    // Catch exceptions for unrecognised or partially implemented CDP methods.
    catch (const NotImplementedException& e) {
      frontendChannel_(
          cdp::jsonError(request.id, cdp::ErrorCode::MethodNotFound, e.what()));
      return;
    }
  }

  /**
   * Replace the current instance agent inside hostAgent_ with a new one
   * connected to the new InstanceTarget.
   * \param instance The new instance target. May be nullptr to indicate
   * there's no current instance.
   */
  void setCurrentInstance(InstanceTarget* instance) {
    if (instance != nullptr) {
      hostAgent_.setCurrentInstanceAgent(
          instance->createAgent(frontendChannel_, state_));
    } else {
      hostAgent_.setCurrentInstanceAgent(nullptr);
    }
  }

  HostAgent& agent() {
    return hostAgent_;
  }

  FrontendChannel dangerouslyGetFrontendChannel() {
    return frontendChannel_;
  }

 private:
  // Owned by this instance, but shared (weakly) with the frontend channel
  std::shared_ptr<RAIIRemoteConnection> remote_;
  FrontendChannel frontendChannel_;
  SessionState state_;

  // NOTE: hostAgent_ has a raw reference to state_ so must be destroyed first.
  HostAgent hostAgent_;
};

/**
 * Converts HostCommands to CDP method calls and sends them over a private
 * connection to the HostTarget.
 */
class HostCommandSender {
 public:
  explicit HostCommandSender(HostTarget& target)
      : connection_(target.connect(std::make_unique<NullRemoteConnection>())) {}

  /**
   * Send a \c HostCommand to the HostTarget.
   */
  void sendCommand(HostCommand command) {
    cdp::RequestId id = makeRequestId();
    switch (command) {
      case HostCommand::DebuggerResume:
        connection_->sendMessage(cdp::jsonRequest(id, "Debugger.resume"));
        break;
      case HostCommand::DebuggerStepOver:
        connection_->sendMessage(cdp::jsonRequest(id, "Debugger.stepOver"));
        break;
      default:
        assert(false && "unknown HostCommand");
    }
  }

 private:
  cdp::RequestId makeRequestId() {
    return nextRequestId_++;
  }

  cdp::RequestId nextRequestId_{1};
  std::unique_ptr<ILocalConnection> connection_;
};

/**
 * Enables the caller to install and subscribe to a named CDP runtime binding
 * on the HostTarget via a callback. Note: Per CDP spec, this does not need to
 * check if the `Runtime` domain is enabled.
 */
class HostRuntimeBinding {
 public:
  explicit HostRuntimeBinding(
      HostTarget& target,
      std::string name,
      std::function<void(std::string)> callback)
      : connection_(target.connect(
            std::make_unique<CallbackRemoteConnection>(
                [callback = std::move(callback)](const std::string& message) {
                  auto parsedMessage = folly::parseJson(message);

                  // Ignore initial Runtime.addBinding response
                  if (parsedMessage["id"] == 0 &&
                      parsedMessage["result"].isObject() &&
                      parsedMessage["result"].empty()) {
                    return;
                  }

                  // Assert that we only intercept bindingCalled responses
                  assert(
                      parsedMessage["method"].asString() ==
                      "Runtime.bindingCalled");
                  callback(parsedMessage["params"]["payload"].asString());
                }))) {
    // Install runtime binding
    connection_->sendMessage(
        cdp::jsonRequest(
            0,
            "Runtime.addBinding",
            folly::dynamic::object("name", std::move(name))));
  }

 private:
  std::unique_ptr<ILocalConnection> connection_;
};

std::shared_ptr<HostTarget> HostTarget::create(
    HostTargetDelegate& delegate,
    VoidExecutor executor) {
  std::shared_ptr<HostTarget> hostTarget{new HostTarget(delegate)};
  hostTarget->setExecutor(std::move(executor));
  if (InspectorFlags::getInstance().getPerfIssuesEnabled()) {
    hostTarget->installPerfIssuesBinding();
  }
  return hostTarget;
}

HostTarget::HostTarget(HostTargetDelegate& delegate)
    : delegate_(delegate),
      executionContextManager_{std::make_shared<ExecutionContextManager>()} {}

std::unique_ptr<ILocalConnection> HostTarget::connect(
    std::unique_ptr<IRemoteConnection> connectionToFrontend) {
  auto session = std::make_shared<HostTargetSession>(
      std::move(connectionToFrontend),
      controller_,
      delegate_.getMetadata(),
      makeVoidExecutor(executorFromThis()));
  session->setCurrentInstance(currentInstance_.get());
  sessions_.insert(std::weak_ptr(session));
  return std::make_unique<CallbackLocalConnection>(
      [session](const std::string& message) { (*session)(message); });
}

HostTarget::~HostTarget() {
  // HostCommandSender owns a session, so we must release it for the assertion
  // below to be valid.
  commandSender_.reset();

  // HostRuntimeBinding owns a connection, so we must release it for the
  // assertion
  perfMetricsBinding_.reset();

  // Sessions are owned by InspectorPackagerConnection, not by HostTarget, but
  // they hold a HostTarget& that we must guarantee is valid.
  assert(
      sessions_.empty() &&
      "HostTargetSession objects must be destroyed before their HostTarget. Did you call getInspectorInstance().removePage()?");
  // Trace Recording object (traceRecording_) doesn't create an actual session,
  // so we don't need to reset it explicitly here.
}

HostTargetDelegate::~HostTargetDelegate() = default;

InstanceTarget& HostTarget::registerInstance(InstanceTargetDelegate& delegate) {
  assert(!currentInstance_ && "Only one instance allowed");
  currentInstance_ = InstanceTarget::create(
      executionContextManager_, delegate, makeVoidExecutor(executorFromThis()));
  sessions_.forEach(
      [currentInstance = &*currentInstance_](HostTargetSession& session) {
        session.setCurrentInstance(currentInstance);
      });

  if (traceRecording_) {
    // Registers the Instance for tracing, if a Trace is currently being
    // recorded.
    traceRecording_->setTracedInstance(currentInstance_.get());
  }

  return *currentInstance_;
}

void HostTarget::unregisterInstance(InstanceTarget& instance) {
  assert(
      currentInstance_ && currentInstance_.get() == &instance &&
      "Invalid unregistration");
  sessions_.forEach(
      [](HostTargetSession& session) { session.setCurrentInstance(nullptr); });

  if (traceRecording_) {
    // Unregisters the Instance for tracing, if a Trace is currently being
    // recorded.
    traceRecording_->setTracedInstance(nullptr);
  }

  currentInstance_.reset();
}

void HostTarget::sendCommand(HostCommand command) {
  executorFromThis()([command](HostTarget& self) {
    if (!self.commandSender_) {
      self.commandSender_ = std::make_unique<HostCommandSender>(self);
    }
    self.commandSender_->sendCommand(command);
  });
}

void HostTarget::installPerfIssuesBinding() {
  perfMonitorUpdateHandler_ =
      std::make_unique<PerfMonitorUpdateHandler>(delegate_);
  perfMetricsBinding_ = std::make_unique<HostRuntimeBinding>(
      *this, // Used immediately
      "__react_native_perf_issues_reporter",
      [this](const std::string& message) {
        perfMonitorUpdateHandler_->handlePerfIssueAdded(message);
      });
}

HostTargetController::HostTargetController(HostTarget& target)
    : target_(target) {}

HostTargetDelegate& HostTargetController::getDelegate() {
  return target_.getDelegate();
}

bool HostTargetController::hasInstance() const {
  return target_.hasInstance();
}

void HostTargetController::incrementPauseOverlayCounter() {
  ++pauseOverlayCounter_;
}

bool HostTargetController::decrementPauseOverlayCounter() {
  assert(pauseOverlayCounter_ > 0 && "Pause overlay counter underflow");
  return --pauseOverlayCounter_ != 0;
}

bool HostTargetController::maybeEmitStashedBackgroundTrace() {
  return target_.maybeEmitStashedBackgroundTrace();
}

namespace {

struct StaticHostTargetMetadata {
  std::optional<bool> isProfilingBuild;
  std::optional<bool> networkInspectionEnabled;
  std::optional<bool> frameRecordingEnabled;
};

StaticHostTargetMetadata getStaticHostMetadata() {
  auto& inspectorFlags = jsinspector_modern::InspectorFlags::getInstance();

  return {
      .isProfilingBuild = inspectorFlags.getIsProfilingBuild(),
      .networkInspectionEnabled = inspectorFlags.getNetworkInspectionEnabled(),
      .frameRecordingEnabled = inspectorFlags.getFrameRecordingEnabled()};
}

} // namespace

folly::dynamic createHostMetadataPayload(const HostTargetMetadata& metadata) {
  auto staticMetadata = getStaticHostMetadata();
  folly::dynamic result = folly::dynamic::object;

  if (metadata.appDisplayName) {
    result["appDisplayName"] = metadata.appDisplayName.value();
  }
  if (metadata.appIdentifier) {
    result["appIdentifier"] = metadata.appIdentifier.value();
  }
  if (metadata.deviceName) {
    result["deviceName"] = metadata.deviceName.value();
  }
  if (metadata.integrationName) {
    result["integrationName"] = metadata.integrationName.value();
  }
  if (metadata.platform) {
    result["platform"] = metadata.platform.value();
  }
  if (metadata.reactNativeVersion) {
    result["reactNativeVersion"] = metadata.reactNativeVersion.value();
  }
  if (staticMetadata.isProfilingBuild) {
    result["unstable_isProfilingBuild"] =
        staticMetadata.isProfilingBuild.value();
  }
  if (staticMetadata.networkInspectionEnabled) {
    result["unstable_networkInspectionEnabled"] =
        staticMetadata.networkInspectionEnabled.value();
  }
  if (staticMetadata.frameRecordingEnabled) {
    result["unstable_frameRecordingEnabled"] =
        staticMetadata.frameRecordingEnabled.value();
  }

  return result;
}

bool HostTarget::maybeEmitStashedBackgroundTrace() {
  std::vector<FrontendChannel> eligibleFrontendChannels;
  eligibleFrontendChannels.reserve(sessions_.size());
  sessions_.forEach([&eligibleFrontendChannels](auto& session) {
    if (session.agent().isEligibleForBackgroundTrace()) {
      eligibleFrontendChannels.push_back(
          session.dangerouslyGetFrontendChannel());
    }
  });

  if (eligibleFrontendChannels.empty()) {
    return false;
  }

  auto stashedTrace = std::exchange(stashedTracingProfile_, std::nullopt);
  if (stashedTrace) {
    emitNotificationsForTracingProfile(
        std::move(*stashedTrace),
        eligibleFrontendChannels,
        /* isBackgroundTrace */ true);
  }
  return true;
}

bool HostTarget::stopAndMaybeEmitBackgroundTrace() {
  stashedTracingProfile_ = stopTracing();
  return maybeEmitStashedBackgroundTrace();
}

} // namespace facebook::react::jsinspector_modern
