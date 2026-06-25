/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "BoundedRequestBuffer.h"
#include "CdpNetwork.h"

#include <folly/dynamic.h>

#include <atomic>
#include <list>
#include <mutex>
#include <string>
#include <tuple>

namespace facebook::react::jsinspector_modern {

/**
 * A callback that can be used to send debugger messages (method responses and
 * events) to the frontend. The message must be a JSON-encoded string.
 * The callback may be called from any thread.
 */
using FrontendChannel = std::function<void(std::string_view messageJson)>;

using Headers = std::map<std::string, std::string>;

/**
 * [Experimental] Handler for reporting network events via CDP.
 */
class NetworkHandler {
 public:
  static NetworkHandler &getInstance();

  /**
   * Register a frontend channel for receiving Network domain events.
   * Implicitly enables the domain if this is the first agent.
   * \returns An agent ID to be passed to disableAgent() on cleanup.
   */
  size_t enableAgent(FrontendChannel frontendChannel);

  /**
   * Unregister a frontend channel by its ID.
   * Implicitly disables the domain if this was the last agent.
   */
  void disableAgent(size_t agentId);

  /**
   * Returns whether network debugging is currently enabled.
   */
  inline bool isEnabled() const
  {
    return enabled_.load(std::memory_order_acquire);
  }

  /**
   * @cdp Network.requestWillBeSent
   */
  void onRequestWillBeSent(
      const std::string &requestId,
      const cdp::network::Request &request,
      const std::optional<cdp::network::Response> &redirectResponse);

  /**
   * @cdp Network.requestWillBeSentExtraInfo
   */
  void onRequestWillBeSentExtraInfo(const std::string &requestId, const Headers &headers);

  /**
   * @cdp Network.responseReceived
   */
  void onResponseReceived(const std::string &requestId, const cdp::network::Response &response);

  /**
   * @cdp Network.dataReceived
   */
  void onDataReceived(const std::string &requestId, int dataLength, int encodedDataLength);

  /**
   * @cdp Network.loadingFinished
   */
  void onLoadingFinished(const std::string &requestId, int encodedDataLength);

  /**
   * @cdp Network.loadingFailed
   */
  void onLoadingFailed(const std::string &requestId, bool cancelled);

  /**
   * Store the fetched response body for a text or image network response.
   *
   * Reponse bodies are stored in a bounded buffer with a fixed maximum memory
   * size, where oldest responses will be evicted if the buffer is exceeded.
   *
   * Should be called after checking \ref NetworkHandler::isEnabled.
   */
  void storeResponseBody(const std::string &requestId, std::string_view body, bool base64Encoded);

  /**
   * Retrieve a stored response body for a given request ID.
   *
   * \returns An optional tuple of [responseBody, base64Encoded]. Returns
   * nullopt if no entry is found in the buffer.
   */
  std::optional<std::tuple<std::string, bool>> getResponseBody(const std::string &requestId);

  /**
   * Associate the given stack trace with the given request ID.
   */
  void recordRequestInitiatorStack(const std::string &requestId, folly::dynamic stackTrace);

 private:
  NetworkHandler() = default;
  NetworkHandler(const NetworkHandler &) = delete;
  NetworkHandler &operator=(const NetworkHandler &) = delete;
  ~NetworkHandler() = default;

  std::atomic<bool> enabled_{false};

  inline bool isEnabledNoSync() const
  {
    return enabled_.load(std::memory_order_relaxed);
  }

  std::optional<folly::dynamic> consumeStoredRequestInitiator(const std::string &requestId);

  /**
   * Send a message to all registered frontend channels.
   */
  void sendToAllAgents(std::string_view message);

  struct AgentRecord {
    size_t id;
    FrontendChannel channel;
  };

  std::list<AgentRecord> agents_;
  size_t nextAgentId_{0};
  std::mutex agentsMutex_;

  std::map<std::string, std::string> resourceTypeMap_{};
  std::map<std::string, folly::dynamic> requestInitiatorById_{};
  std::mutex requestMetadataMutex_{};

  BoundedRequestBuffer responseBodyBuffer_{};
  std::mutex requestBodyMutex_;
};

} // namespace facebook::react::jsinspector_modern
