/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NetworkingModule.h"

#include <react/debug/react_native_assert.h>
#include <react/utils/Base64.h>

namespace facebook::react {

// The requests abstraction is here to deal with a family of race conditions
// which can happen due to the async nature of this code:
//
// * store token vs callback
// * callback vs cancel
// * stop vs everything
//
// All of the access to the Requests data is protected by a mutex, so it is
// effectively serialized. The code takes care to handle execution in any
// order, so long as reserve for an id precedes any other operation on that id;
// the tests verify that behavior is correct for all use cases.

Requests::~Requests() {
  react_native_assert(isStopped() && "Requests::stop() was not called");
}

bool Requests::reserve(uint32_t id) {
  if (stopped_) {
    return false;
  }
  std::lock_guard<std::mutex> lock(tokensMutex_);
  tokens_.emplace(id, nullptr);
  return true;
}

void Requests::store(uint32_t id, std::unique_ptr<http::IRequestToken> token) {
  // Three possibilities here:

  // 1. HttpClient is shutting down. Cancel the token, don't save it.
  // 2. The entry in tokens_ has been erased, which means the callbacks have
  // run. We cancel, which should be harmless, just in case. Nothing to save.
  // 3. HttpClient and the request are still running. Save the token.

  {
    if (stopped_) {
      // option 1: fall past the lock and cancel
    } else {
      std::lock_guard<std::mutex> lock(tokensMutex_);
      if (auto iter = tokens_.find(id); iter == tokens_.end()) {
        // option 2: fall past the lock and cancel
      } else {
        // option 3: save the token
        iter->second = std::move(token);
        return;
      }
    }
  }

  if (token) {
    token->cancel();
  }
}

bool Requests::erase(uint32_t id) {
  if (stopped_) {
    return false;
  }
  std::lock_guard<std::mutex> lock(tokensMutex_);
  tokens_.erase(id);
  return true;
}

void Requests::cancel(uint32_t id) {
  std::lock_guard<std::mutex> lock(tokensMutex_);
  if (auto iter = tokens_.find(id); iter != tokens_.end()) {
    if (iter->second) {
      iter->second->cancel();
    }
    tokens_.erase(iter);
  }
}

void Requests::stop() {
  stopped_ = true;
  decltype(tokens_) tokensCopy;
  {
    std::lock_guard<std::mutex> lock(tokensMutex_);
    tokensCopy.swap(tokens_);
  }

  for (const auto& token : tokensCopy) {
    if (token.second) {
      token.second->cancel();
    }
  }
}

bool Requests::isStopped() {
  if (stopped_) {
    std::lock_guard<std::mutex> lock(tokensMutex_);
    assert(tokens_.empty());
  }
  return stopped_;
}

NetworkingModule::NetworkingModule(
    std::shared_ptr<CallInvoker> jsInvoker,
    const HttpClientFactory& httpClientFactory)
    : NativeNetworkingAndroidCxxSpec(jsInvoker) {
  httpClient_ = httpClientFactory();
}

NetworkingModule::~NetworkingModule() {
  requests_.stop();
}

void NetworkingModule::sendRequest(
    jsi::Runtime& /*rt*/,
    const std::string& method,
    const std::string& url,
    uint32_t requestId,
    const http::Headers& headers,
    const http::Body& body,
    const std::string& responseType,
    bool useIncrementalUpdates,
    uint32_t timeout,
    bool /*withCredentials*/) {
  if (!requests_.reserve(requestId)) {
    // If the NetworkingModule is shutting down, don't invoke the callback.
    return;
  }

  bool sendIncrementalUpdates = responseType == "text" && useIncrementalUpdates;
  bool sendProgressUpdates = responseType != "text" && useIncrementalUpdates;

  http::NetworkCallbacks callbacks{
      .onUploadProgress =
          [weakThis = weak_from_this(), requestId](
              int64_t progress, int64_t total) {
            if (auto strongThis = weakThis.lock()) {
              strongThis->didSendNetworkData(requestId, progress, total);
            }
          },
      .onResponse =
          [weakThis = weak_from_this(), requestId, url](
              uint32_t responseCode, const http::Headers& headers) {
            if (auto strongThis = weakThis.lock()) {
              strongThis->didReceiveNetworkResponse(
                  requestId, responseCode, headers, url);
            }
          },
      .onBody =
          [weakThis = weak_from_this(), requestId, responseType](
              std::unique_ptr<folly::IOBuf> data) {
            if (auto strongThis = weakThis.lock()) {
              try {
                strongThis->didReceiveNetworkData(
                    requestId, responseType, std::move(data));
              } catch (const std::exception& e) {
                LOG(ERROR) << "Failed to parse network response body: "
                           << e.what();
              } catch (...) {
                LOG(ERROR) << "Failed to parse network response body.";
              }
            }
          },
      .onBodyIncremental =
          [weakThis = weak_from_this(), requestId](
              int64_t progress,
              int64_t total,
              std::unique_ptr<folly::IOBuf> body) {
            int64_t bytesRead = 0;
            if (auto strongThis = weakThis.lock()) {
              bytesRead = strongThis->didReceiveNetworkIncrementalData(
                  requestId, std::move(body), progress, total);
            }
            return bytesRead;
          },
      .onBodyProgress =
          [weakThis = weak_from_this(), requestId](
              int64_t loaded, int64_t total) {
            if (auto strongThis = weakThis.lock()) {
              strongThis->didReceiveNetworkDataProgress(
                  requestId, loaded, total);
            }
          },
      .onResponseComplete =
          [weakThis = weak_from_this(), requestId](
              const std::string& error, bool timeout) {
            if (auto strongThis = weakThis.lock()) {
              strongThis->didCompleteNetworkResponse(requestId, error, timeout);
            }
          },
      .sendIncrementalUpdates = sendIncrementalUpdates,
      .sendProgressUpdates = sendProgressUpdates};

  auto token = httpClient_->sendRequest(
      std::move(callbacks),
      method,
      url,
      headers,
      body,
      timeout,
      std::to_string(requestId));
  if (token) {
    requests_.store(requestId, std::move(token));
  }
}

void NetworkingModule::didSendNetworkData(
    uint32_t requestId,
    int64_t progress,
    int64_t total) {
  if (requests_.isStopped()) {
    return;
  }
  emitDeviceEvent(
      "didSendNetworkData",
      [requestId, progress, total, jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        auto result = std::make_tuple(
            requestId,
            static_cast<double>(progress),
            static_cast<double>(total));
        args.emplace_back(bridging::toJs(rt, result, jsInvoker));
      });
}

void NetworkingModule::didReceiveNetworkResponse(
    uint32_t requestId,
    uint32_t statusCode,
    const http::Headers& headers,
    const std::string& responseUrl) noexcept {
  if (requests_.isStopped()) {
    return;
  }
  emitDeviceEvent(
      "didReceiveNetworkResponse",
      [requestId, statusCode, headers, responseUrl, jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        auto result =
            std::make_tuple(requestId, statusCode, headers, responseUrl);
        args.emplace_back(bridging::toJs(rt, result, jsInvoker));
      });
}

int64_t NetworkingModule::didReceiveNetworkIncrementalData(
    uint32_t requestId,
    std::unique_ptr<folly::IOBuf> buf,
    int64_t progress,
    int64_t total) {
  auto data = buf->moveToFbString().toStdString();
  auto bytesRead = data.size();
  emitDeviceEvent(
      "didReceiveNetworkIncrementalData",
      [requestId, data, progress, total, jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(
            rt,
            jsi::Array::createWithElements(
                rt,
                static_cast<double>(requestId),
                data,
                static_cast<double>(progress),
                static_cast<double>(total)));
      });
  return bytesRead;
};

namespace {
// Encodes a response body for delivery to JS according to responseType.
//
// The JS XMLHttpRequest layer base64-decodes the delivered string for
// 'base64'-type responses (responseType 'arraybuffer'), so binary bodies must
// be base64-encoded here, matching the Android and iOS NetworkingModule
// implementations. Without this, base64.toByteArray() on the JS side
// mis-decodes the raw payload and corrupts the response (e.g. JSON.parse
// failures on arraybuffer fetches). All other response types are delivered
// unchanged.
std::string encodeResponseBody(
    const std::string& responseType,
    std::string body) {
  if (responseType == "base64") {
    return base64Encode(body);
  }
  return body;
}
} // namespace

void NetworkingModule::didReceiveNetworkData(
    uint32_t requestId,
    const std::string& responseType,
    std::unique_ptr<folly::IOBuf> buf) {
  if (requests_.isStopped()) {
    return;
  }

  auto responseData = encodeResponseBody(responseType, buf->toString());
  emitDeviceEvent(
      "didReceiveNetworkData",
      [requestId,
       responseData = std::move(responseData),
       jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(
            rt,
            jsi::Array::createWithElements(
                rt, static_cast<double>(requestId), responseData));
      });
}

void NetworkingModule::didReceiveNetworkDataProgress(
    uint32_t requestId,
    int64_t bytesRead,
    int64_t total) {
  emitDeviceEvent(
      "didReceiveNetworkDataProgress",
      [requestId, bytesRead, total, jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        args.emplace_back(
            rt,
            jsi::Array::createWithElements(
                rt,
                static_cast<double>(requestId),
                static_cast<double>(bytesRead),
                static_cast<double>(total)));
      });
}

void NetworkingModule::didCompleteNetworkResponse(
    uint32_t requestId,
    const std::string& error,
    bool timeoutError) {
  if (requests_.isStopped() || !requests_.erase(requestId)) {
    // If the HttpClient is shutting down, don't invoke the callback.
    return;
  }
  emitDeviceEvent(
      "didCompleteNetworkResponse",
      [requestId, error, timeoutError, jsInvoker = jsInvoker_](
          jsi::Runtime& rt, std::vector<jsi::Value>& args) {
        if (error.empty()) {
          auto result = std::make_tuple(static_cast<double>(requestId));
          args.emplace_back(bridging::toJs(rt, result, jsInvoker));
        } else {
          auto result = std::make_tuple(
              static_cast<double>(requestId), error, timeoutError);
          args.emplace_back(bridging::toJs(rt, result, jsInvoker));
        }
      });
}

void NetworkingModule::abortRequest(jsi::Runtime& /*rt*/, uint32_t requestId) {
  requests_.cancel(requestId);
}

void NetworkingModule::clearCookies(
    jsi::Runtime& /*rt*/,
    const AsyncCallback<bool>& /*callback*/) {
  LOG(INFO) << "NetworkingModule::clearCookies";
}

void NetworkingModule::addListener(
    jsi::Runtime& /*rt*/,
    const std::string& /*eventName*/) {}

void NetworkingModule::removeListeners(
    jsi::Runtime& /*rt*/,
    uint32_t /*count*/) {}

} // namespace facebook::react
