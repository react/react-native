/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkIOAgent.h"
#include "InspectorFlags.h"

#include "Utf8.h"

#include <jsinspector-modern/network/NetworkHandler.h>
#include <react/utils/Base64.h>

#include <sstream>
#include <tuple>
#include <utility>
#include <variant>

namespace facebook::react::jsinspector_modern {

static constexpr long DEFAULT_BYTES_PER_READ =
    1048576; // 1MB (Chrome v112 default)
static constexpr unsigned long MAX_BYTES_PER_READ = 10485760; // 10MB

// https://github.com/chromium/chromium/blob/128.0.6593.1/content/browser/devtools/devtools_io_context.cc#L71-L73
static constexpr std::array kTextMIMETypePrefixes{
    "text/",
    "application/x-javascript",
    "application/json",
    "application/xml",
    "application/javascript" // Not in Chromium but emitted by Metro
};

namespace {

struct InitStreamResult {
  uint32_t httpStatusCode;
  Headers headers;
  std::shared_ptr<Stream> stream;
};
using InitStreamError = const std::string;

using StreamInitCallback =
    std::function<void(std::variant<InitStreamError, InitStreamResult>)>;
using IOReadCallback =
    std::function<void(std::variant<IOReadError, IOReadResult>)>;

/**
 * Private class owning state and implementing the listener for a particular
 * request
 *
 * NetworkRequestListener overrides are thread safe, all other methods must be
 * called from the same thread.
 */
class Stream : public NetworkRequestListener,
               public EnableExecutorFromThis<Stream> {
 public:
  Stream(const Stream& other) = delete;
  Stream& operator=(const Stream& other) = delete;
  Stream(Stream&& other) = default;
  Stream& operator=(Stream&& other) noexcept = default;

  /**
   * Factory method to create a Stream with a callback for the initial result
   * of a network request.
   * \param executor An executor on which all processing of callbacks from
   * the platform will be performed, and on which the passed callback will be
   * called.
   * \param initCb Will be called once either on receipt of HTTP headers or
   * any prior error, using the given executor.
   */
  static std::shared_ptr<Stream> create(
      VoidExecutor executor,
      const StreamInitCallback& initCb) {
    std::shared_ptr<Stream> stream{new Stream(initCb)};
    stream->setExecutor(std::move(executor));
    return stream;
  }

  /**
   * Agent-facing API. Enqueue a read request for up to maxBytesToRead
   * bytes, starting from the end of the previous read.
   * \param maxBytesToRead The maximum number of bytes to read from the
   * source stream.
   * \param callback Will be called using the executor passed to create()
   * with the result of the read, or an error string.
   */
  void read(long maxBytesToRead, const IOReadCallback& callback) {
    pendingReadRequests_.emplace_back(maxBytesToRead, callback);
    processPending();
  }

  /**
   * Agent-facing API. Call the platform-provided cancelFunction, if any,
   * call the error callbacks of any in-flight read requests, and the initial
   * error callback if it has not already fulfilled with success or error.
   */
  void cancel() {
    if (cancelFunction_) {
      (*cancelFunction_)();
    }
    error_ = "Cancelled";
    if (initCb_) {
      auto cb = std::move(initCb_);
      (*cb)(InitStreamError{"Cancelled"});
    }
    // Respond to any in-flight read requests with an error.
    processPending();
  }

  /**
   * Begin implementation of NetworkRequestListener, to be called by platform
   * HostTargetDelegate. Any of these methods may be called from any thread.
   */

  void onData(std::string_view data) override {
    data_ << data;
    bytesReceived_ += data.length();
    processPending();
  }

  void onHeaders(uint32_t httpStatusCode, const Headers& headers) override {
    // Find content-type through case-insensitive search of headers.
    for (const auto& [name, value] : headers) {
      std::string lowerName = name;
      std::transform(
          lowerName.begin(), lowerName.end(), lowerName.begin(), ::tolower);
      if (lowerName == "content-type") {
        isText_ = isTextMimeType(value);
        break;
      };
    }

    // If we've already seen an error, the initial callback as already been
    // called with it.
    if (initCb_) {
      auto cb = std::move(initCb_);
      (*cb)(InitStreamResult{
          .httpStatusCode = httpStatusCode,
          .headers = headers,
          .stream = this->shared_from_this()});
    }
  }

  void onError(const std::string& message) override {
    // Only call the error callback once.
    if (!error_) {
      error_ = message;
      if (initCb_) {
        auto cb = std::move(initCb_);
        (*cb)(InitStreamError{message});
      }
    }
    processPending();
  }

  void onCompletion() override {
    completed_ = true;
    processPending();
  }

  void setCancelFunction(std::function<void()> cancelFunction) override {
    cancelFunction_ = std::move(cancelFunction);
  }

  ~Stream() override {
    // Cancel any incoming request, if the platform has provided a cancel
    // callback.
    if (cancelFunction_) {
      (*cancelFunction_)();
    }
  }

  /* End NetworkRequestListener */

 private:
  /**
   * Private constructor. The caller must call setExecutor immediately
   * afterwards.
   */
  explicit Stream(const StreamInitCallback& initCb)
      : initCb_(std::make_unique<StreamInitCallback>(initCb)) {}

  void processPending() {
    // Go through each pending request in insertion order - execute the
    // callback and remove it from pending if it can be satisfied.
    for (auto it = pendingReadRequests_.begin();
         it != pendingReadRequests_.end();) {
      auto maxBytesToRead = std::get<0>(*it);
      auto callback = std::get<1>(*it);

      if (error_) {
        callback(IOReadError{*error_});
      } else if (
          completed_ || (bytesReceived_ - data_.tellg() >= maxBytesToRead)) {
        try {
          callback(respond(maxBytesToRead));
        } catch (const std::runtime_error& error) {
          callback(IOReadError{error.what()});
        }
      } else {
        // Not yet received enough data
        ++it;
        continue;
      }
      it = pendingReadRequests_.erase(it);
    }
  }

  IOReadResult respond(long maxBytesToRead) {
    std::vector<char> buffer(maxBytesToRead);
    data_.read(buffer.data(), maxBytesToRead);
    auto bytesRead = data_.gcount();
    std::string output;

    buffer.resize(bytesRead);
    if (isText_) {
      auto originalSize = buffer.size();
      // Maybe resize to drop the last 1-3 bytes so that buffer is valid.
      truncateToValidUTF8(buffer);
      if (buffer.size() < originalSize) {
        // Rewind the stream so that the next read starts from the start of
        // the code point we're removing from this chunk.
        data_.seekg(buffer.size() - originalSize, std::ios_base::cur);
      }
      output = std::string(buffer.begin(), buffer.begin() + buffer.size());
    } else {
      // Encode the slice as a base64 string.
      output = base64Encode(std::string_view(buffer.data(), buffer.size()));
    }

    return IOReadResult{
        .data = output,
        .eof = output.length() == 0 && completed_,
        .base64Encoded = !isText_};
  }

  // https://github.com/chromium/chromium/blob/128.0.6593.1/content/browser/devtools/devtools_io_context.cc#L70-L80
  static bool isTextMimeType(const std::string& mimeType) {
    for (auto& kTextMIMETypePrefix : kTextMIMETypePrefixes) {
      if (mimeType.starts_with(kTextMIMETypePrefix)) {
        return true;
      }
    }
    return false;
  }

  bool completed_{false};
  bool isText_{false};
  std::optional<std::string> error_;
  std::stringstream data_;
  long bytesReceived_{0};
  std::optional<std::function<void()>> cancelFunction_{std::nullopt};
  std::unique_ptr<StreamInitCallback> initCb_;
  std::vector<std::tuple<long /* bytesToRead */, IOReadCallback>>
      pendingReadRequests_;
};
} // namespace

NetworkIOAgent::~NetworkIOAgent() {
  if (networkAgentId_) {
    NetworkHandler::getInstance().disableAgent(*networkAgentId_);
    networkAgentId_ = std::nullopt;
  }
}

bool NetworkIOAgent::handleRequest(
    const cdp::PreparsedRequest& req,
    LoadNetworkResourceDelegate& delegate) {
  if (req.method == "Network.loadNetworkResource") {
    handleLoadNetworkResource(req, delegate);
    return true;
  } else if (req.method == "IO.read") {
    handleIoRead(req);
    return true;
  } else if (req.method == "IO.close") {
    handleIoClose(req);
    return true;
  }

  if (InspectorFlags::getInstance().getNetworkInspectionEnabled()) {
    auto& networkHandler = NetworkHandler::getInstance();

    // @cdp Network.enable support is experimental.
    if (req.method == "Network.enable") {
      networkAgentId_ = networkHandler.enableAgent(frontendChannel_);
      // NOTE: Domain enable/disable responses are sent by HostAgent.
      return false;
    }

    // @cdp Network.disable support is experimental.
    if (req.method == "Network.disable") {
      if (networkAgentId_) {
        networkHandler.disableAgent(*networkAgentId_);
        networkAgentId_ = std::nullopt;
      }
      // NOTE: Domain enable/disable responses are sent by HostAgent.
      return false;
    }

    // @cdp Network.getResponseBody support is experimental.
    if (req.method == "Network.getResponseBody") {
      handleGetResponseBody(req);
      return true;
    }
  }

  return false;
}

void NetworkIOAgent::handleLoadNetworkResource(
    const cdp::PreparsedRequest& req,
    LoadNetworkResourceDelegate& delegate) {
  long long requestId = req.id;

  LoadNetworkResourceRequest params;

  if (!req.params.isObject()) {
    frontendChannel_(
        cdp::jsonError(
            req.id,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("url") == 0u) || !req.params.at("url").isString()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: url is missing or not a string."));
    return;
  } else {
    params.url = req.params.at("url").asString();
  }

  // This is an opaque identifier, but an incrementing integer in a string is
  // consistent with Chrome.
  StreamID streamId = std::to_string(nextStreamId_++);

  auto stream = Stream::create(
      executor_,
      [streamId,
       requestId,
       frontendChannel = frontendChannel_,
       streamsWeak = std::weak_ptr(streams_)](auto resultOrError) {
        NetworkResource resource;
        std::string cdpError;
        if (auto* error = std::get_if<InitStreamError>(&resultOrError)) {
          resource = NetworkResource{.success = false, .netErrorName = *error};
        } else if (
            auto* result = std::get_if<InitStreamResult>(&resultOrError)) {
          if (result->httpStatusCode >= 200 && result->httpStatusCode < 300) {
            resource = NetworkResource{
                .success = true,
                .stream = streamId,
                .httpStatusCode = result->httpStatusCode,
                .headers = result->headers};
          } else if (result->httpStatusCode >= 400) {
            resource = NetworkResource{
                .success = false,
                .httpStatusCode = result->httpStatusCode,
                .headers = result->headers};
          } else {
            // We can't deal with <200 or 3xx reponses here (though they may be
            // transparently handled by the delegate). Return a CDP error (not
            // an unsuccesful resource) to the frontend so that it falls back to
            // a direct fetch.
            cdpError = "Handling of status " +
                std::to_string(result->httpStatusCode) + " not implemented.";
          }
        } else {
          assert(false && "Unhandled IO init result type");
        }
        if (cdpError.length() > 0 || !resource.success) {
          // Release and destroy the stream after the calling executor returns.
          // ~Stream will handle cancelling any download in progress.
          if (auto streams = streamsWeak.lock()) {
            streams->erase(streamId);
          }
        }
        frontendChannel(
            cdpError.length()
                ? cdp::jsonError(
                      requestId, cdp::ErrorCode::InternalError, cdpError)
                : cdp::jsonResult(
                      requestId,
                      folly::dynamic::object(
                          "resource", resource.toDynamic())));
      });

  // Begin the network request on the platform, passing an executor scoped to
  // a Stream (a NetworkRequestListener), which the implementation will call
  // back into.
  delegate.loadNetworkResource(params, stream->executorFromThis());

  // Retain the stream only if delegate.loadNetworkResource does not throw.
  streams_->emplace(streamId, stream);
}

void NetworkIOAgent::handleIoRead(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  if (!req.params.isObject()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("handle") == 0u) ||
      !req.params.at("handle").isString()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: handle is missing or not a string."));
    return;
  }
  std::optional<int64_t> size = std::nullopt;
  if ((req.params.count("size") != 0u) && req.params.at("size").isInt()) {
    size = req.params.at("size").asInt();

    if (size > MAX_BYTES_PER_READ) {
      frontendChannel_(
          cdp::jsonError(
              requestId,
              cdp::ErrorCode::InvalidParams,
              "Invalid params: size cannot be greater than 10MB."));
      return;
    }
  }

  auto streamId = req.params.at("handle").asString();
  auto it = streams_->find(streamId);
  if (it == streams_->end()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InternalError,
            "Stream not found with handle " + streamId));
    return;
  } else {
    it->second->read(
        size ? *size : DEFAULT_BYTES_PER_READ,
        [requestId,
         frontendChannel = frontendChannel_,
         streamId,
         streamsWeak = std::weak_ptr(streams_)](auto resultOrError) {
          if (auto* error = std::get_if<IOReadError>(&resultOrError)) {
            // NB: Chrome DevTools calls IO.close after a read error, so any
            // continuing download or retained data is cleaned up at that point.
            frontendChannel(
                cdp::jsonError(
                    requestId, cdp::ErrorCode::InternalError, *error));
          } else if (auto* result = std::get_if<IOReadResult>(&resultOrError)) {
            frontendChannel(cdp::jsonResult(requestId, result->toDynamic()));
          } else {
            assert(false && "Unhandled IO read result type");
          }
        });
    return;
  }
}

void NetworkIOAgent::handleIoClose(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  if (!req.params.isObject()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("handle") == 0u) ||
      !req.params.at("handle").isString()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: handle is missing or not a string."));
    return;
  }
  auto streamId = req.params.at("handle").asString();

  auto it = streams_->find(streamId);
  if (it == streams_->end()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InternalError,
            "Stream not found: " + streamId));
  } else {
    it->second->cancel();
    streams_->erase(it->first);
    frontendChannel_(cdp::jsonResult(requestId));
  }
}

void NetworkIOAgent::handleGetResponseBody(const cdp::PreparsedRequest& req) {
  long long requestId = req.id;
  if (!req.params.isObject()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: not an object."));
    return;
  }
  if ((req.params.count("requestId") == 0u) ||
      !req.params.at("requestId").isString()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidParams,
            "Invalid params: requestId is missing or not a string."));
    return;
  }

  auto& networkHandler = NetworkHandler::getInstance();

  if (!networkHandler.isEnabled()) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InvalidRequest,
            "Invalid request: The \"Network\" domain is not enabled."));
    return;
  }

  auto storedResponse =
      networkHandler.getResponseBody(req.params.at("requestId").asString());

  if (!storedResponse) {
    frontendChannel_(
        cdp::jsonError(
            requestId,
            cdp::ErrorCode::InternalError,
            "Internal error: Could not retrieve response body for the given requestId."));
    return;
  }

  std::string responseBody;
  bool base64Encoded = false;
  std::tie(responseBody, base64Encoded) = *storedResponse;

  auto result = GetResponseBodyResult{
      .body = responseBody,
      .base64Encoded = base64Encoded,
  };

  frontendChannel_(cdp::jsonResult(requestId, result.toDynamic()));
}

} // namespace facebook::react::jsinspector_modern
