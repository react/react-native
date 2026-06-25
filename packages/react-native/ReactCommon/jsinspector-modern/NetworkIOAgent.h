/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "InspectorInterfaces.h"
#include "ScopedExecutor.h"

#include <folly/dynamic.h>
#include <jsinspector-modern/cdp/CdpJson.h>

#include <string>
#include <unordered_map>
#include <utility>

namespace facebook::react::jsinspector_modern {

using StreamID = const std::string;
using Headers = std::map<std::string, std::string>;
using IOReadError = const std::string;

namespace {
class Stream; // Defined in NetworkIOAgent.cpp
using StreamsMap = std::unordered_map<std::string, std::shared_ptr<Stream>>;
} // namespace

struct LoadNetworkResourceRequest {
  std::string url;
};

struct ReadStreamParams {
  StreamID handle;
  std::optional<unsigned long> size;
  std::optional<unsigned long> offset;
};

struct NetworkResource {
  bool success{};
  std::optional<std::string> stream{};
  std::optional<uint32_t> httpStatusCode{};
  std::optional<std::string> netErrorName{};
  std::optional<Headers> headers{};
  folly::dynamic toDynamic() const
  {
    auto dynamicResource = folly::dynamic::object("success", success);

    if (success) { // stream IFF successful
      assert(stream);
      dynamicResource("stream", *stream);
    }

    if (netErrorName) { // Only if unsuccessful
      assert(!success);
      dynamicResource("netErrorName", *netErrorName);
    }

    if (httpStatusCode) { // Guaranteed if successful
      dynamicResource("httpStatusCode", *httpStatusCode);
    } else {
      assert(!success);
    }

    if (headers) { // Guaranteed if successful
      auto dynamicHeaders = folly::dynamic::object();
      for (const auto &pair : *headers) {
        dynamicHeaders(pair.first, pair.second);
      }
      dynamicResource("headers", std::move(dynamicHeaders));
    } else {
      assert(!success);
    }
    return dynamicResource;
  }
};

struct IOReadResult {
  std::string data;
  bool eof;
  bool base64Encoded;
  folly::dynamic toDynamic() const
  {
    auto obj = folly::dynamic::object("data", data);
    obj("eof", eof);
    obj("base64Encoded", base64Encoded);
    return obj;
  }
};

struct GetResponseBodyResult {
  std::string body;
  bool base64Encoded;
  folly::dynamic toDynamic() const
  {
    folly::dynamic params = folly::dynamic::object;
    params["body"] = body;
    params["base64Encoded"] = base64Encoded;
    return params;
  }
};

/**
 * Passed to `loadNetworkResource`, provides callbacks for processing incoming
 * data and other events.
 */
class NetworkRequestListener {
 public:
  NetworkRequestListener() = default;
  NetworkRequestListener(const NetworkRequestListener &) = delete;
  NetworkRequestListener &operator=(const NetworkRequestListener &) = delete;
  NetworkRequestListener(NetworkRequestListener &&) noexcept = default;
  NetworkRequestListener &operator=(NetworkRequestListener &&) noexcept = default;
  virtual ~NetworkRequestListener() = default;

  /**
   * To be called by the delegate on receipt of response headers, including
   * on "unsuccessful" status codes.
   *
   * \param httpStatusCode The HTTP status code received.
   * \param headers Response headers as an unordered_map.
   */
  virtual void onHeaders(uint32_t httpStatusCode, const Headers &headers) = 0;

  /**
   * To be called by the delegate on receipt of data chunks.
   * \param data The data received.
   */
  virtual void onData(std::string_view data) = 0;

  /**
   * To be called by the delegate on any error with the request, either before
   * headers are received or for a subsequent interrupion.
   *
   * \param message A short, human-readable message, which may be forwarded to
   * the CDP client either in the `loadNetworkResource` response (if headers
   * were not yet received), or as a CDP error in response to a subsequent
   * `IO.read`.
   */
  virtual void onError(const std::string &message) = 0;

  /**
   * To be called by the delegate on successful completion of the request.
   * Delegates must call *either* onCompletion() or onError() exactly once.
   */
  virtual void onCompletion() = 0;

  /**
   * Optionally (preferably) used to give NetworkIOAgent
    a way to cancel an
   * in-progress download.
   *
   * \param cancelFunction A function that can be called to cancel a download,
   * may be called before or after the download is complete.
   */
  virtual void setCancelFunction(std::function<void()> cancelFunction) = 0;
};

/**
 * Implemented by the HostTargetDelegate per-platform to perform network
 * requests.
 */
class LoadNetworkResourceDelegate {
 public:
  LoadNetworkResourceDelegate() = default;
  LoadNetworkResourceDelegate(const LoadNetworkResourceDelegate &) = delete;
  LoadNetworkResourceDelegate &operator=(const LoadNetworkResourceDelegate &) = delete;
  LoadNetworkResourceDelegate(LoadNetworkResourceDelegate &&) noexcept = delete;
  LoadNetworkResourceDelegate &operator=(LoadNetworkResourceDelegate &&) noexcept = delete;
  virtual ~LoadNetworkResourceDelegate() = default;

  /**
   * Called by NetworkIOAgent on handling a
   * `Network.loadNetworkResource` CDP request. Platform implementations should
   * override this to perform a network request of the given URL, and use
   * listener's callbacks (via the executor) on receipt of headers, data chunks,
   * and errors.
   *
   * \param params A LoadNetworkResourceRequest, including the url.
   * \param executor A listener-scoped executor used by the delegate to execute
   * listener callbacks on headers, data chunks, and errors. Implementations
   * *should* call listener->setCancelFunction() to provide a lambda that can be
   * called to abort any in-flight network operation that is no longer needed.
   */
  virtual void loadNetworkResource(
      [[maybe_unused]] const LoadNetworkResourceRequest &params,
      [[maybe_unused]] ScopedExecutor<NetworkRequestListener> executor) = 0;
};

/**
 * Provides an agent for handling CDP's Network.loadNetworkResource, IO.read and
 * IO.close.
 *
 * Owns state of all in-progress and completed HTTP requests - ensure
 * IO.close is used to free resources once consumed.
 *
 * Public methods must be called the same thread as the given executor.
 */
class NetworkIOAgent {
 public:
  /**
   * \param frontendChannel A channel used to send responses to the
   * frontend.
   * \param executor An executor used for any callbacks provided, and for
   * processing incoming data or other events from network operations.
   */
  NetworkIOAgent(FrontendChannel frontendChannel, VoidExecutor executor)
      : frontendChannel_(frontendChannel), executor_(executor), streams_(std::make_shared<StreamsMap>())
  {
  }

  ~NetworkIOAgent();

  NetworkIOAgent(const NetworkIOAgent &) = delete;
  NetworkIOAgent &operator=(const NetworkIOAgent &) = delete;
  NetworkIOAgent(NetworkIOAgent &&) = delete;
  NetworkIOAgent &operator=(NetworkIOAgent &&) = delete;

  /**
   * Handle a CDP request. The response will be sent over the provided
   * \c FrontendChannel synchronously or asynchronously.
   * \param req The parsed request.
   */
  bool handleRequest(const cdp::PreparsedRequest &req, LoadNetworkResourceDelegate &delegate);

 private:
  /**
   * A channel used to send responses and events to the frontend.
   */
  FrontendChannel frontendChannel_;

  /**
   * An executor used to create NetworkRequestListener-scoped executors for the
   * delegate.
   */
  VoidExecutor executor_;

  /**
   * Map of stream objects, which contain data received, accept read requests
   * and listen for delegate events. Delegates have a scoped executor for Stream
   * instances, but Streams will not live beyond the destruction of this
   * NetworkIOAgent instance + executor scope.
   *
   * This is a shared_ptr so that we may capture a weak_ptr in our
   * Stream::create callback without creating a cycle.
   */
  std::shared_ptr<StreamsMap> streams_;

  /**
   * Stream IDs are strings of an incrementing integer, unique within each
   * NewtworkIOAgent instance. This stores the next one to use.
   */
  unsigned long nextStreamId_{0};

  /**
   * If non-nullopt, indicates that this agent has enabled the Network domain
   * via NetworkHandler, storing the agent ID for cleanup.
   */
  std::optional<size_t> networkAgentId_;

  /**
   * Begin loading an HTTP resource, delegating platform-specific
   * implementation, responding to the frontend on headers received or on error.
   * Does not catch exceptions thrown by the delegate (such as
   * NotImplementedException).
   */
  void handleLoadNetworkResource(const cdp::PreparsedRequest &req, LoadNetworkResourceDelegate &delegate);

  /**
   * Handle an IO.read CDP request. Emit a chunk of data from the stream, once
   * enough has been downloaded, or report an error.
   */
  void handleIoRead(const cdp::PreparsedRequest &req);

  /**
   * Handle an IO.close CDP request. Safely aborts any in-flight request.
   * Reports CDP ok if the stream is found, or a CDP error if not.
   */
  void handleIoClose(const cdp::PreparsedRequest &req);

  /**
   * Handle a Network.getResponseBody CDP request.
   */
  void handleGetResponseBody(const cdp::PreparsedRequest &req);
};

} // namespace facebook::react::jsinspector_modern
