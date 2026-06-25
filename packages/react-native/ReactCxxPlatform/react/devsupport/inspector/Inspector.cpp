/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "Inspector.h"
#include "InspectorPackagerConnectionDelegate.h"

#include <glog/logging.h>
#include <utility>

namespace facebook::react {

namespace {

constexpr std::string_view INTEGRATION_NAME = "RNHOST";

class InspectorHostTargetDelegate
    : public jsinspector_modern::HostTargetDelegate,
      public std::enable_shared_from_this<InspectorHostTargetDelegate> {
 public:
  InspectorHostTargetDelegate(
      std::string appName,
      std::string deviceName,
      const HttpClientFactory& httpClientFactory,
      LiveReloadCallbackFn&& liveReloadCallbackFn,
      ToggleDebuggerOverlayFn&& toggleDebuggerOverlayFn) noexcept
      : appName_(std::move(appName)),
        deviceName_(std::move(deviceName)),
        httpClient_(httpClientFactory()),
        liveReloadCallbackFn_(std::move(liveReloadCallbackFn)),
        toggleDebuggerOverlayFn_(std::move(toggleDebuggerOverlayFn)) {}

  jsinspector_modern::HostTargetMetadata getMetadata() override {
    return {
        .appIdentifier = appName_,
        .deviceName = deviceName_,
        .integrationName = std::string(INTEGRATION_NAME),
    };
  }

  void onReload(
      const jsinspector_modern::HostTargetDelegate::PageReloadRequest&
      /*request*/) override {
    if (liveReloadCallbackFn_ != nullptr) {
      liveReloadCallbackFn_();
    }
  }

  void onSetPausedInDebuggerMessage(
      const jsinspector_modern::HostTargetDelegate::
          OverlaySetPausedInDebuggerMessageRequest& request) override {
    if (toggleDebuggerOverlayFn_ != nullptr) {
      toggleDebuggerOverlayFn_(
          request.message.has_value(), [target = target_]() {
            if (auto strongTarget = target.lock()) {
              strongTarget->sendCommand(
                  jsinspector_modern::HostCommand::DebuggerResume);
            }
          });
    }
  }

  void loadNetworkResource(
      const jsinspector_modern::LoadNetworkResourceRequest& params,
      jsinspector_modern::ScopedExecutor<
          jsinspector_modern::NetworkRequestListener> executor) override {
    http::NetworkCallbacks callbacks{
        .onResponse =
            [executor](uint32_t responseCode, const http::Headers& headers) {
              executor([responseCode, headers](
                           jsinspector_modern::NetworkRequestListener&
                               listener) {
                facebook::react::jsinspector_modern::Headers responseHeaders;
                for (const auto& [key, value] : headers) {
                  responseHeaders[key] = value;
                }
                listener.onHeaders(responseCode, responseHeaders);
              });
            },
        .onBody =
            [executor](std::unique_ptr<folly::IOBuf> ioBuf) {
              executor(
                  [response = ioBuf->moveToFbString().toStdString()](
                      jsinspector_modern::NetworkRequestListener& listener) {
                    listener.onData(response);
                  });
            },
        .onResponseComplete =
            [executor, url = params.url](
                const std::string& error, bool timeout) {
              if (error.empty() && !timeout) {
                executor(
                    [](jsinspector_modern::NetworkRequestListener& listener) {
                      listener.onCompletion();
                    });
              } else {
                executor(
                    [errorMessage =
                         "Failed to download JS bundle from Url: " + url +
                         ". Error: " + (error.empty() ? "Timeout" : error)](
                        jsinspector_modern::NetworkRequestListener& listener) {
                      listener.onError(errorMessage);
                    });
              }
            }};
    httpClient_->sendRequest(std::move(callbacks), "GET", params.url);
  }

  void setTarget(std::weak_ptr<jsinspector_modern::HostTarget> target) {
    target_ = std::move(target);
  }

 private:
  std::string appName_;
  std::string deviceName_;
  std::unique_ptr<IHttpClient> httpClient_;
  LiveReloadCallbackFn liveReloadCallbackFn_;
  ToggleDebuggerOverlayFn toggleDebuggerOverlayFn_;
  std::weak_ptr<jsinspector_modern::HostTarget> target_;
};

} // namespace

Inspector::Inspector(
    std::string appName,
    std::string deviceName,
    WebSocketClientFactory webSocketClientFactory,
    HttpClientFactory httpClientFactory) noexcept
    : appName_(std::move(appName)),
      deviceName_(std::move(deviceName)),
      webSocketClientFactory_(std::move(webSocketClientFactory)),
      httpClientFactory_(std::move(httpClientFactory)) {}

Inspector::~Inspector() noexcept {
  if (pageId_) {
    jsinspector_modern::getInspectorInstance().removePage(*pageId_);
    taskDispatchThread_.runSync([weakThis = weak_from_this()]() {
      if (auto strongThis = weakThis.lock()) {
        strongThis->pageId_.reset();
        strongThis->target_.reset();
      }
    });
  }
  taskDispatchThread_.quit();
}

void Inspector::connectDebugger(const std::string& inspectorUrl) noexcept {
  invokeElsePost([weakThis = weak_from_this(), inspectorUrl]() {
    auto self = weakThis.lock();
    if (!self) {
      return;
    }
    if (!self->packagerConnection_) {
      self->packagerConnection_ =
          std::make_unique<jsinspector_modern::InspectorPackagerConnection>(
              inspectorUrl,
              self->deviceName_,
              self->appName_,
              std::make_unique<InspectorPackagerConnectionDelegate>(
                  weakThis, self->webSocketClientFactory_));
    }
    if (!self->packagerConnection_->isConnected()) {
      self->packagerConnection_->connect();
    }
  });
}

void Inspector::ensureHostTarget(
    LiveReloadCallbackFn&& liveReloadCallbackFn,
    ToggleDebuggerOverlayFn&& toggleDebuggerOverlayFn) noexcept {
  hostDelegate_ = std::make_shared<InspectorHostTargetDelegate>(
      appName_,
      deviceName_,
      httpClientFactory_,
      std::move(liveReloadCallbackFn),
      std::move(toggleDebuggerOverlayFn));
  target_ = jsinspector_modern::HostTarget::create(
      *hostDelegate_,
      [weakThis = weak_from_this()](std::function<void()>&& callback) {
        if (auto strongThis = weakThis.lock()) {
          strongThis->invokeElsePost(std::move(callback));
        }
      });
  static_cast<InspectorHostTargetDelegate&>(*hostDelegate_).setTarget(target_);
  jsinspector_modern::InspectorTargetCapabilities capabilities{
      .nativePageReloads = true};
  pageId_ = jsinspector_modern::getInspectorInstance().addPage(
      std::string(INTEGRATION_NAME),
      "", /*vm*/
      [weakInspectorTarget = std::weak_ptr(target_)](
          std::unique_ptr<jsinspector_modern::IRemoteConnection> remote)
          -> std::unique_ptr<jsinspector_modern::ILocalConnection> {
        if (auto inspectorTarget = weakInspectorTarget.lock()) {
          return inspectorTarget->connect(std::move(remote));
        }
        // Reject the connection on destruction
        return nullptr;
      },
      capabilities);
}

void Inspector::invokeElsePost(
    TaskDispatchThread::TaskFn&& callback,
    std::chrono::milliseconds delayMs) {
  if (taskDispatchThread_.isOnThread() &&
      delayMs == std::chrono::milliseconds::zero()) {
    callback();
  } else {
    taskDispatchThread_.runAsync(std::move(callback), delayMs);
  }
}

std::shared_ptr<jsinspector_modern::HostTarget> Inspector::inspectorTarget()
    const {
  return target_;
}

} // namespace facebook::react
