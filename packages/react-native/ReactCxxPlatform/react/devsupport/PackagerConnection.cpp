/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "PackagerConnection.h"

#include <glog/logging.h>
#include <nlohmann/json.hpp>

namespace facebook::react {

PackagerConnection::PackagerConnection(
    WebSocketClientFactory webSocketClientFactory,
    std::string packagerConnectionUrl,
    LiveReloadCallback&& liveReloadCallback,
    ShowDevMenuCallback&& showDevMenuCallback)
    : webSocketClientFactory_(std::move(webSocketClientFactory)),
      packagerConnectionUrl_(std::move(packagerConnectionUrl)),
      liveReloadCallback_(std::move(liveReloadCallback)),
      showDevMenuCallback_(std::move(showDevMenuCallback)) {
  attemptConnection();
}

PackagerConnection::~PackagerConnection() noexcept {
  reconnectThread_.quit();
  if (websocket_) {
    websocket_->setOnClosedCallback(nullptr);
    websocket_->setOnMessageCallback(nullptr);
    websocket_->close("PackagerConnection destroyed");
  }
}

void PackagerConnection::attemptConnection() {
  if (websocket_) {
    websocket_->setOnClosedCallback(nullptr);
    websocket_->close("reconnecting");
  }
  websocket_ = webSocketClientFactory_();
  websocket_->setOnMessageCallback([this](const std::string& message) {
    LOG(INFO) << "Received message from packager: " << message;
    auto json = nlohmann::json::parse(message, nullptr, false);
    if (json.is_discarded() || json.is_null() || json["version"] != 2) {
      return;
    }
    auto method = json["method"];
    if (method == "reload") {
      liveReloadCallback_();
    } else if (method == "showDevMenu") {
      showDevMenuCallback_();
    }
  });
  websocket_->setOnClosedCallback([this](const std::string& reason) {
    LOG(INFO) << "PackagerConnection closed: " << reason;
    scheduleReconnect();
  });
  websocket_->connect(
      packagerConnectionUrl_,
      [this](bool success, const std::string& /*error*/) {
        if (success) {
          if (!isInitialConnection_) {
            LOG(INFO)
                << "PackagerConnection connected to Metro - triggering live reload";
            liveReloadCallback_();
          } else {
            LOG(INFO) << "PackagerConnection connected to Metro";
          }
        } else {
          scheduleReconnect();
        }
        isInitialConnection_ = false;
      });
}

void PackagerConnection::scheduleReconnect() {
  if (reconnectPending_.exchange(true)) {
    return;
  }
  reconnectThread_.runAsync(
      [this]() {
        reconnectPending_ = false;
        attemptConnection();
      },
      std::chrono::milliseconds(5000));
}

} // namespace facebook::react
