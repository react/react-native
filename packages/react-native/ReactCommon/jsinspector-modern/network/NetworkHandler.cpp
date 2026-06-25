/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkHandler.h"

#include <jsinspector-modern/cdp/CdpJson.h>

#include <glog/logging.h>
#include <chrono>

namespace facebook::react::jsinspector_modern {

namespace {

/**
 * Get the current Unix timestamp in seconds (µs precision, CDP format).
 */
double getCurrentUnixTimestampSeconds() {
  auto now = std::chrono::system_clock::now().time_since_epoch();
  auto seconds = std::chrono::duration_cast<std::chrono::seconds>(now).count();
  auto micros =
      std::chrono::duration_cast<std::chrono::microseconds>(now).count() %
      1000000;

  return static_cast<double>(seconds) +
      (static_cast<double>(micros) / 1000000.0);
}

} // namespace

NetworkHandler& NetworkHandler::getInstance() {
  static NetworkHandler instance;
  return instance;
}

size_t NetworkHandler::enableAgent(FrontendChannel frontendChannel) {
  std::lock_guard<std::mutex> lock(agentsMutex_);
  size_t id = nextAgentId_++;
  agents_.push_back({id, std::move(frontendChannel)});
  enabled_.store(true, std::memory_order_release);
  return id;
}

void NetworkHandler::disableAgent(size_t agentId) {
  std::lock_guard<std::mutex> lock(agentsMutex_);
  agents_.remove_if(
      [agentId](const AgentRecord& r) { return r.id == agentId; });
  if (agents_.empty()) {
    enabled_.store(false, std::memory_order_release);

    std::lock_guard<std::mutex> lock2(requestBodyMutex_);
    responseBodyBuffer_.clear();
  }
}

void NetworkHandler::sendToAllAgents(std::string_view message) {
  std::lock_guard<std::mutex> lock(agentsMutex_);
  for (auto& agent : agents_) {
    agent.channel(message);
  }
}

void NetworkHandler::onRequestWillBeSent(
    const std::string& requestId,
    const cdp::network::Request& request,
    const std::optional<cdp::network::Response>& redirectResponse) {
  if (!isEnabledNoSync()) {
    return;
  }

  double timestamp = getCurrentUnixTimestampSeconds();
  std::optional<folly::dynamic> initiator;
  initiator = consumeStoredRequestInitiator(requestId);
  auto params = cdp::network::RequestWillBeSentParams{
      .requestId = requestId,
      .loaderId = "",
      .documentURL = "mobile",
      .request = request,
      // NOTE: Both timestamp and wallTime use the same unit, however wallTime
      // is relative to an "arbitrary epoch". In our implementation, use the
      // Unix epoch for both.
      .timestamp = timestamp,
      .wallTime = timestamp,
      .initiator = initiator.has_value()
          ? std::move(initiator.value())
          : folly::dynamic::object("type", "script"),
      .redirectHasExtraInfo = redirectResponse.has_value(),
      .redirectResponse = redirectResponse,
  };

  sendToAllAgents(
      cdp::jsonNotification("Network.requestWillBeSent", params.toDynamic()));
}

void NetworkHandler::onRequestWillBeSentExtraInfo(
    const std::string& requestId,
    const Headers& headers) {
  if (!isEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::RequestWillBeSentExtraInfoParams{
      .requestId = requestId,
      .headers = headers,
      .connectTiming = {.requestTime = getCurrentUnixTimestampSeconds()},
  };

  sendToAllAgents(
      cdp::jsonNotification(
          "Network.requestWillBeSentExtraInfo", params.toDynamic()));
}

void NetworkHandler::onResponseReceived(
    const std::string& requestId,
    const cdp::network::Response& response) {
  if (!isEnabledNoSync()) {
    return;
  }

  auto resourceType = cdp::network::resourceTypeFromMimeType(response.mimeType);
  {
    std::lock_guard<std::mutex> lock(requestMetadataMutex_);
    resourceTypeMap_.emplace(requestId, resourceType);
  }

  auto params = cdp::network::ResponseReceivedParams{
      .requestId = requestId,
      .loaderId = "",
      .timestamp = getCurrentUnixTimestampSeconds(),
      .type = resourceType,
      .response = response,
      .hasExtraInfo = false,
  };

  sendToAllAgents(
      cdp::jsonNotification("Network.responseReceived", params.toDynamic()));
}

void NetworkHandler::onDataReceived(
    const std::string& requestId,
    int dataLength,
    int encodedDataLength) {
  if (!isEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::DataReceivedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .dataLength = dataLength,
      .encodedDataLength = encodedDataLength,
  };

  sendToAllAgents(
      cdp::jsonNotification("Network.dataReceived", params.toDynamic()));
}

void NetworkHandler::onLoadingFinished(
    const std::string& requestId,
    int encodedDataLength) {
  if (!isEnabledNoSync()) {
    return;
  }

  auto params = cdp::network::LoadingFinishedParams{
      .requestId = requestId,
      .timestamp = getCurrentUnixTimestampSeconds(),
      .encodedDataLength = encodedDataLength,
  };

  sendToAllAgents(
      cdp::jsonNotification("Network.loadingFinished", params.toDynamic()));
}

void NetworkHandler::onLoadingFailed(
    const std::string& requestId,
    bool cancelled) {
  if (!isEnabledNoSync()) {
    return;
  }

  {
    std::lock_guard<std::mutex> lock(requestMetadataMutex_);
    auto params = cdp::network::LoadingFailedParams{
        .requestId = requestId,
        .timestamp = getCurrentUnixTimestampSeconds(),
        .type = resourceTypeMap_.find(requestId) != resourceTypeMap_.end()
            ? resourceTypeMap_.at(requestId)
            : "Other",
        .errorText = cancelled ? "net::ERR_ABORTED" : "net::ERR_FAILED",
        .canceled = cancelled,
    };

    sendToAllAgents(
        cdp::jsonNotification("Network.loadingFailed", params.toDynamic()));
  }
}

void NetworkHandler::storeResponseBody(
    const std::string& requestId,
    std::string_view body,
    bool base64Encoded) {
  std::lock_guard<std::mutex> lock(requestBodyMutex_);
  responseBodyBuffer_.put(requestId, body, base64Encoded);
}

std::optional<std::tuple<std::string, bool>> NetworkHandler::getResponseBody(
    const std::string& requestId) {
  std::lock_guard<std::mutex> lock(requestBodyMutex_);
  auto responseBody = responseBodyBuffer_.get(requestId);

  if (responseBody == nullptr) {
    return std::nullopt;
  }

  return std::make_optional<std::tuple<std::string, bool>>(
      responseBody->data, responseBody->base64Encoded);
}

void NetworkHandler::recordRequestInitiatorStack(
    const std::string& requestId,
    folly::dynamic stackTrace) {
  if (!isEnabledNoSync()) {
    return;
  }

  std::lock_guard<std::mutex> lock(requestMetadataMutex_);
  requestInitiatorById_.emplace(
      requestId,
      folly::dynamic::object("type", "script")("stack", std::move(stackTrace)));
}

std::optional<folly::dynamic> NetworkHandler::consumeStoredRequestInitiator(
    const std::string& requestId) {
  std::lock_guard<std::mutex> lock(requestMetadataMutex_);
  auto it = requestInitiatorById_.find(requestId);
  if (it == requestInitiatorById_.end()) {
    return std::nullopt;
  }
  // Remove and return
  auto result = std::move(it->second);
  requestInitiatorById_.erase(it);
  return result;
}

} // namespace facebook::react::jsinspector_modern
