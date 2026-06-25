/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "HostAgent.h"
#include "InstanceAgent.h"

#ifdef REACT_NATIVE_DEBUGGER_ENABLED
#include "EmulationAgent.h"
#include "InspectorFlags.h"
#include "InspectorInterfaces.h"
#include "NetworkIOAgent.h"
#include "SessionState.h"
#include "TracingAgent.h"
#endif // REACT_NATIVE_DEBUGGER_ENABLED

#include <folly/dynamic.h>
#include <folly/json.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <algorithm>
#include <chrono>
#include <functional>
#include <string>
#include <string_view>

using namespace std::chrono;
using namespace std::literals::string_view_literals;

namespace facebook::react::jsinspector_modern {

#ifdef REACT_NATIVE_DEBUGGER_ENABLED

#define ANSI_WEIGHT_BOLD "\x1B[1m"
#define ANSI_WEIGHT_RESET "\x1B[22m"
#define ANSI_COLOR_BG_YELLOW "\x1B[48;2;253;247;231m\x1B[30m"

class HostAgent::Impl final {
 public:
  explicit Impl(
      HostAgent& /*hostAgent*/,
      const FrontendChannel& frontendChannel,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      SessionState& sessionState,
      VoidExecutor executor)
      : frontendChannel_(frontendChannel),
        targetController_(targetController),
        hostMetadata_(std::move(hostMetadata)),
        sessionState_(sessionState),
        networkIOAgent_(NetworkIOAgent(frontendChannel, std::move(executor))),
        tracingAgent_(
            TracingAgent(frontendChannel, sessionState, targetController)),
        emulationAgent_(EmulationAgent(frontendChannel, targetController)) {}

  ~Impl() {
    if (isPausedInDebuggerOverlayVisible_) {
      // In case of a non-graceful shutdown of the session, ensure we clean up
      // the "paused on debugger" overlay if we've previously asked the
      // integrator to display it.
      isPausedInDebuggerOverlayVisible_ = false;
      if (!targetController_.decrementPauseOverlayCounter()) {
        targetController_.getDelegate().onSetPausedInDebuggerMessage({
            .message = std::nullopt,
        });
      }
    }
  }

 private:
  struct RequestHandlingState {
    bool isFinishedHandlingRequest{false};
    bool shouldSendOKResponse{false};
  };

  RequestHandlingState tryHandleRequest(const cdp::PreparsedRequest& req) {
    // Domain enable/disable requests: write to state (because we're the
    // top-level Agent in the Session), trigger any side effects, and decide
    // whether we are finished handling the request (or need to delegate to the
    // InstanceAgent).
    if (req.method == "Log.enable") {
      sessionState_.isLogDomainEnabled = true;

      if (fuseboxClientType_ == FuseboxClientType::Fusebox) {
        sendFuseboxNotice();
      }

      // Send a log entry with the integration name.
      if (hostMetadata_.integrationName) {
        sendInfoLogEntry(
            ANSI_COLOR_BG_YELLOW "Debugger integration: " +
            *hostMetadata_.integrationName);
      }

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Log.disable") {
      sessionState_.isLogDomainEnabled = false;

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Runtime.enable") {
      sessionState_.isRuntimeDomainEnabled = true;

      if (fuseboxClientType_ == FuseboxClientType::Unknown) {
        // Since we know the Fusebox frontend sends
        // FuseboxClient.setClientMetadata before enabling the Runtime domain,
        // we can conclude that we're dealing with some other client.
        fuseboxClientType_ = FuseboxClientType::NonFusebox;
        sendNonFuseboxNotice();
      }

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Runtime.disable") {
      sessionState_.isRuntimeDomainEnabled = false;

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Debugger.enable") {
      sessionState_.isDebuggerDomainEnabled = true;

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Debugger.disable") {
      sessionState_.isDebuggerDomainEnabled = false;

      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (InspectorFlags::getInstance().getNetworkInspectionEnabled()) {
      if (req.method == "Network.enable") {
        auto& inspector = getInspectorInstance();
        if (inspector.getSystemState().registeredHostsCount > 1) {
          frontendChannel_(
              cdp::jsonError(
                  req.id,
                  cdp::ErrorCode::InternalError,
                  "The Network domain is unavailable when multiple React Native hosts are registered."));
          return {
              .isFinishedHandlingRequest = true,
              .shouldSendOKResponse = false,
          };
        }

        sessionState_.isNetworkDomainEnabled = true;

        return {
            .isFinishedHandlingRequest = false,
            .shouldSendOKResponse = true,
        };
      }
      if (req.method == "Network.disable") {
        sessionState_.isNetworkDomainEnabled = false;

        return {
            .isFinishedHandlingRequest = false,
            .shouldSendOKResponse = true,
        };
      }
    }

    // Methods other than domain enables/disables: handle anything we know how
    // to handle, and delegate to the InstanceAgent otherwise. (In some special
    // cases we may handle the request *and* delegate to the InstanceAgent for
    // some side effect.)
    if (req.method == "Page.reload") {
      targetController_.getDelegate().onReload({
          .ignoreCache =
              req.params.isObject() && (req.params.count("ignoreCache") != 0u)
              ? std::optional(req.params.at("ignoreCache").asBool())
              : std::nullopt,
          .scriptToEvaluateOnLoad = req.params.isObject() &&
                  (req.params.count("scriptToEvaluateOnLoad") != 0u)
              ? std::optional(
                    req.params.at("scriptToEvaluateOnLoad").asString())
              : std::nullopt,
      });

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }
    if (InspectorFlags::getInstance().getScreenshotCaptureEnabled()) {
      if (req.method == "Page.captureScreenshot") {
        std::optional<std::string> format;
        std::optional<int> quality;

        if (req.params.isObject()) {
          if (req.params.count("format") != 0u) {
            format = req.params.at("format").asString();
          }
          if (req.params.count("quality") != 0u) {
            quality = static_cast<int>(req.params.at("quality").asInt());
          }
        }

        auto base64Data = targetController_.getDelegate().captureScreenshot(
            {.format = format, .quality = quality});

        if (base64Data.has_value()) {
          frontendChannel_(
              cdp::jsonResult(
                  req.id,
                  folly::dynamic::object("data", std::move(*base64Data))));
        } else {
          frontendChannel_(
              cdp::jsonError(
                  req.id,
                  cdp::ErrorCode::InternalError,
                  "Failed to capture screenshot"));
        }

        return {
            .isFinishedHandlingRequest = true,
            .shouldSendOKResponse = false,
        };
      }
    }
    if (req.method == "Page.addScriptToEvaluateOnNewDocument") {
      // @cdp Page.addScriptToEvaluateOnNewDocument registers a script that
      // will be evaluated in every new JS runtime created for this Host
      // (e.g. after a reload), BEFORE the app's main bundle runs. We store
      // it as session state and let each new RuntimeAgent replay it onto its
      // runtime, mirroring the handling of @cdp Runtime.addBinding. Per CDP
      // semantics the script does NOT run in the runtime that is current
      // when it is registered; the client must reload to apply it.
      std::string source =
          req.params.isObject() && (req.params.count("source") != 0u)
          ? req.params.at("source").asString()
          : std::string();
      std::string identifier =
          std::to_string(sessionState_.nextScriptToEvaluateOnNewDocumentId++);
      sessionState_.scriptsToEvaluateOnNewDocument.push_back(
          {.identifier = identifier, .source = std::move(source)});

      frontendChannel_(
          cdp::jsonResult(
              req.id, folly::dynamic::object("identifier", identifier)));

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = false,
      };
    }
    if (req.method == "Page.removeScriptToEvaluateOnNewDocument") {
      std::string identifier =
          req.params.isObject() && (req.params.count("identifier") != 0u)
          ? req.params.at("identifier").asString()
          : std::string();
      auto& scripts = sessionState_.scriptsToEvaluateOnNewDocument;
      scripts.erase(
          std::remove_if(
              scripts.begin(),
              scripts.end(),
              [&identifier](
                  const SessionState::ScriptToEvaluateOnNewDocument& script) {
                return script.identifier == identifier;
              }),
          scripts.end());

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Overlay.setPausedInDebuggerMessage") {
      auto message =
          req.params.isObject() && (req.params.count("message") != 0u)
          ? std::optional(req.params.at("message").asString())
          : std::nullopt;
      if (!isPausedInDebuggerOverlayVisible_ && message.has_value()) {
        targetController_.incrementPauseOverlayCounter();
      } else if (isPausedInDebuggerOverlayVisible_ && !message.has_value()) {
        targetController_.decrementPauseOverlayCounter();
      }
      isPausedInDebuggerOverlayVisible_ = message.has_value();
      targetController_.getDelegate().onSetPausedInDebuggerMessage({
          .message = message,
      });

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "ReactNativeApplication.enable") {
      sessionState_.isReactNativeApplicationDomainEnabled = true;
      fuseboxClientType_ = FuseboxClientType::Fusebox;

      if (sessionState_.isLogDomainEnabled) {
        sendFuseboxNotice();
      }

      frontendChannel_(
          cdp::jsonNotification(
              "ReactNativeApplication.metadataUpdated",
              createHostMetadataPayload(hostMetadata_)));
      auto& inspector = getInspectorInstance();
      bool isSingleHost = inspector.getSystemState().registeredHostsCount <= 1;
      if (!isSingleHost) {
        emitSystemStateChanged(isSingleHost);
      }

      auto emitted = targetController_.maybeEmitStashedBackgroundTrace();
      assert(
          emitted &&
          "Expected to find at least one session eligible to receive a background trace after ReactNativeApplication.enable");
      (void)emitted;

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "ReactNativeApplication.disable") {
      sessionState_.isReactNativeApplicationDomainEnabled = false;

      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Runtime.addBinding") {
      // @cdp Runtime.addBinding and @cdp Runtime.removeBinding are explicitly
      // supported at any time during a session, even while the JS runtime
      // hasn't been created yet. For this reason they are handled by the
      // HostAgent.
      std::string bindingName = req.params["name"].getString();

      ExecutionContextSelector contextSelector =
          ExecutionContextSelector::all();

      if (req.params.count("executionContextId") != 0u) {
        auto executionContextId = req.params["executionContextId"].getInt();
        if (executionContextId < (int64_t)std::numeric_limits<int32_t>::min() ||
            executionContextId > (int64_t)std::numeric_limits<int32_t>::max()) {
          frontendChannel_(
              cdp::jsonError(
                  req.id,
                  cdp::ErrorCode::InvalidParams,
                  "Invalid execution context id"));
          return {
              .isFinishedHandlingRequest = true,
              .shouldSendOKResponse = false,
          };
        }
        contextSelector =
            ExecutionContextSelector::byId((int32_t)executionContextId);

        if (req.params.count("executionContextName") != 0u) {
          frontendChannel_(
              cdp::jsonError(
                  req.id,
                  cdp::ErrorCode::InvalidParams,
                  "executionContextName is mutually exclusive with executionContextId"));
          return {
              .isFinishedHandlingRequest = true,
              .shouldSendOKResponse = false,
          };
        }
      } else if (req.params.count("executionContextName") != 0u) {
        contextSelector = ExecutionContextSelector::byName(
            req.params["executionContextName"].getString());
      }

      sessionState_.subscribedBindings[bindingName].insert(contextSelector);

      // We need this request to percolate down to the RuntimeAgent via the
      // InstanceAgent. If there isn't a RuntimeAgent, it's OK: the next
      // RuntimeAgent will pick up the binding via session state.
      return {
          .isFinishedHandlingRequest = false,
          .shouldSendOKResponse = true,
      };
    }
    if (req.method == "Runtime.removeBinding") {
      // @cdp Runtime.removeBinding has no targeting by execution context. We
      // interpret it to mean "unsubscribe, and stop installing the binding on
      // all new contexts". This diverges slightly from V8, which continues
      // to install the binding on new contexts after it's "removed", but *only*
      // if the subscription is targeted by context name.
      sessionState_.subscribedBindings.erase(req.params["name"].getString());

      // Because of the above, we don't need to pass this request down to the
      // RuntimeAgent.
      return {
          .isFinishedHandlingRequest = true,
          .shouldSendOKResponse = true,
      };
    }

    return {
        .isFinishedHandlingRequest = false,
        .shouldSendOKResponse = false,
    };
  }

 public:
  void handleRequest(const cdp::PreparsedRequest& req) {
    const RequestHandlingState requestState = tryHandleRequest(req);

    if (!requestState.isFinishedHandlingRequest &&
        networkIOAgent_.handleRequest(req, targetController_.getDelegate())) {
      return;
    }

    if (!requestState.isFinishedHandlingRequest &&
        tracingAgent_.handleRequest(req)) {
      return;
    }

    if (!requestState.isFinishedHandlingRequest &&
        emulationAgent_.handleRequest(req)) {
      return;
    }

    if (!requestState.isFinishedHandlingRequest && instanceAgent_ &&
        instanceAgent_->handleRequest(req)) {
      return;
    }

    if (requestState.shouldSendOKResponse) {
      frontendChannel_(cdp::jsonResult(req.id));
      return;
    }

    if (requestState.isFinishedHandlingRequest) {
      // The handler already sent its own response via frontendChannel_.
      return;
    }

    throw NotImplementedException(req.method);
  }

  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> instanceAgent) {
    auto previousInstanceAgent = std::move(instanceAgent_);
    instanceAgent_ = std::move(instanceAgent);

    if (!sessionState_.isRuntimeDomainEnabled) {
      return;
    }
    if (previousInstanceAgent != nullptr) {
      // TODO: Send Runtime.executionContextDestroyed here - at the moment we
      // expect the runtime to do it for us.

      // Because we can only have a single instance, we can report all contexts
      // as cleared.
      frontendChannel_(
          cdp::jsonNotification("Runtime.executionContextsCleared"));
    }
    if (instanceAgent_) {
      // TODO: Send Runtime.executionContextCreated here - at the moment we
      // expect the runtime to do it for us.
    }
  }

  bool isEligibleForBackgroundTrace() const {
    return sessionState_.isReactNativeApplicationDomainEnabled;
  }

  void emitSystemStateChanged(bool isSingleHost) {
    frontendChannel_(
        cdp::jsonNotification(
            "ReactNativeApplication.systemStateChanged",
            folly::dynamic::object("isSingleHost", isSingleHost)));

    frontendChannel_(cdp::jsonNotification("Network.disable"));
  }

 private:
  enum class FuseboxClientType { Unknown, Fusebox, NonFusebox };

  /**
   * Send a simple Log.entryAdded notification with the given
   * \param text You must ensure that the frontend has enabled Log
   * notifications (using Log.enable) prior to calling this function. In Chrome
   * DevTools, the message will appear in the Console tab along with regular
   * console messages. The difference between Log.entryAdded and
   * Runtime.consoleAPICalled is that the latter requires an execution context
   * ID, which does not exist at the Host level.
   */
  void sendInfoLogEntry(
      std::string_view text,
      std::initializer_list<std::string_view> args = {}) {
    folly::dynamic argsArray = folly::dynamic::array();
    for (auto arg : args) {
      argsArray.push_back(arg);
    }
    frontendChannel_(
        cdp::jsonNotification(
            "Log.entryAdded",
            folly::dynamic::object(
                "entry",
                folly::dynamic::object(
                    "timestamp",
                    duration_cast<milliseconds>(
                        system_clock::now().time_since_epoch())
                        .count())("source", "other")("level", "info")(
                    "text", text)("args", std::move(argsArray)))));
  }

  void sendFuseboxNotice() {
    static constexpr auto kFuseboxNotice =
        ANSI_COLOR_BG_YELLOW "Welcome to " ANSI_WEIGHT_BOLD
                             "React Native DevTools" ANSI_WEIGHT_RESET ""sv;

    sendInfoLogEntry(kFuseboxNotice);
  }

  void sendNonFuseboxNotice() {
    static constexpr auto kNonFuseboxNotice =
        ANSI_COLOR_BG_YELLOW ANSI_WEIGHT_BOLD
        "NOTE: " ANSI_WEIGHT_RESET
        "You are using an unsupported debugging client. "
        "Use the Dev Menu in your app (or type `j` in the Metro terminal) to open React Native DevTools."sv;

    std::vector<std::string> args;
    args.emplace_back(kNonFuseboxNotice);
    sendConsoleMessage({ConsoleAPIType::kInfo, args});
  }

  /**
   * Send a console message to the frontend, or buffer it to be sent later.
   */
  void sendConsoleMessage(SimpleConsoleMessage message) {
    if (instanceAgent_) {
      instanceAgent_->sendConsoleMessage(std::move(message));
    } else {
      // Will be sent by the InstanceAgent eventually.
      sessionState_.pendingSimpleConsoleMessages.emplace_back(
          std::move(message));
    }
  }

  FrontendChannel frontendChannel_;
  HostTargetController& targetController_;
  const HostTargetMetadata hostMetadata_;
  std::shared_ptr<InstanceAgent> instanceAgent_;
  FuseboxClientType fuseboxClientType_{FuseboxClientType::Unknown};
  bool isPausedInDebuggerOverlayVisible_{false};

  /**
   * A shared reference to the session's state. This is only safe to access
   * during handleRequest and other method calls on the same thread.
   */
  SessionState& sessionState_;

  NetworkIOAgent networkIOAgent_;

  TracingAgent tracingAgent_;

  EmulationAgent emulationAgent_;
};

#else

/**
 * A stub for HostAgent when React Native is compiled without debugging
 * support.
 */
class HostAgent::Impl final {
 public:
  explicit Impl(
      HostAgent&,
      FrontendChannel frontendChannel,
      HostTargetController& targetController,
      HostTargetMetadata hostMetadata,
      SessionState& sessionState,
      VoidExecutor executor) {}

  void handleRequest(const cdp::PreparsedRequest& req) {}
  void setCurrentInstanceAgent(std::shared_ptr<InstanceAgent> agent) {}
  bool isEligibleForBackgroundTrace() const {
    return false;
  }
  void emitSystemStateChanged(bool isSingleHost) {}
};

#endif // REACT_NATIVE_DEBUGGER_ENABLED

HostAgent::HostAgent(
    const FrontendChannel& frontendChannel,
    HostTargetController& targetController,
    HostTargetMetadata hostMetadata,
    SessionState& sessionState,
    VoidExecutor executor)
    : impl_(
          std::make_unique<Impl>(
              *this,
              frontendChannel,
              targetController,
              std::move(hostMetadata),
              sessionState,
              std::move(executor))) {}

HostAgent::~HostAgent() = default;

void HostAgent::handleRequest(const cdp::PreparsedRequest& req) {
  impl_->handleRequest(req);
}

void HostAgent::setCurrentInstanceAgent(
    std::shared_ptr<InstanceAgent> instanceAgent) {
  impl_->setCurrentInstanceAgent(std::move(instanceAgent));
}

bool HostAgent::isEligibleForBackgroundTrace() const {
  return impl_->isEligibleForBackgroundTrace();
}

#pragma mark - Tracing

HostTracingAgent::HostTracingAgent(tracing::TraceRecordingState& state)
    : tracing::TargetTracingAgent(state) {}

void HostTracingAgent::setTracedInstance(InstanceTarget* instanceTarget) {
  if (instanceTarget != nullptr) {
    instanceTracingAgent_ = instanceTarget->createTracingAgent(state_);
  } else {
    instanceTracingAgent_ = nullptr;
  }
}

} // namespace facebook::react::jsinspector_modern
