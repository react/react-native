/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/http/IHttpClient.h>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

template <>
struct Bridging<http::FormDataField> {
  static http::FormDataField fromJs(
      jsi::Runtime& rt,
      const jsi::Object& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    auto fieldName = bridging::fromJs<std::string>(
        rt, value.getProperty(rt, "fieldName"), jsInvoker);
    auto headers = bridging::fromJs<http::Headers>(
        rt, value.getProperty(rt, "headers"), jsInvoker);
    auto string = bridging::fromJs<std::optional<std::string>>(
        rt, value.getProperty(rt, "string"), jsInvoker);
    auto uri = bridging::fromJs<std::optional<std::string>>(
        rt, value.getProperty(rt, "uri"), jsInvoker);
    return http::FormDataField{
        .fieldName = fieldName,
        .headers = headers,
        .string = string,
        .uri = uri};
  }
};

template <>
struct Bridging<http::Body> {
  static http::Body fromJs(
      jsi::Runtime& rt,
      const jsi::Object& value,
      const std::shared_ptr<CallInvoker>& jsInvoker) {
    return http::Body{
        .string = bridging::fromJs<std::optional<std::string>>(
            rt, value.getProperty(rt, "string"), jsInvoker),
        .blob = bridging::fromJs<std::optional<std::string>>(
            rt, value.getProperty(rt, "blob"), jsInvoker),
        .formData = bridging::fromJs<std::optional<http::FormData>>(
            rt, value.getProperty(rt, "formData"), jsInvoker),
        .base64 = bridging::fromJs<std::optional<std::string>>(
            rt, value.getProperty(rt, "base64"), jsInvoker),

    };
  }
};

class Requests {
 public:
  Requests() noexcept = default;
  ~Requests();
  Requests(Requests& other) = delete;
  Requests& operator=(Requests& other) = delete;
  Requests(Requests&& other) = delete;
  Requests& operator=(Requests&& other) = delete;

  bool reserve(uint32_t id);
  void store(uint32_t id, std::unique_ptr<http::IRequestToken> token);
  bool erase(uint32_t id);
  void cancel(uint32_t id);
  void stop();
  bool isStopped();

 private:
  std::mutex tokensMutex_;
  std::unordered_map<uint32_t, std::unique_ptr<http::IRequestToken>> tokens_;
  std::atomic<bool> stopped_{false};
};

// Implementation of "Networking" TurboModule
class NetworkingModule
    : public NativeNetworkingAndroidCxxSpec<NetworkingModule>,
      public std::enable_shared_from_this<NetworkingModule> {
 public:
  NetworkingModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      const HttpClientFactory& httpClientFactory);

  ~NetworkingModule() override;

  void sendRequest(
      jsi::Runtime& rt,
      const std::string& method,
      const std::string& url,
      uint32_t requestId,
      const http::Headers& headers,
      const http::Body& body,
      const std::string& responseType,
      bool useIncrementalUpdates,
      uint32_t timeout,
      bool withCredentials);

  void abortRequest(jsi::Runtime& rt, uint32_t requestId);

  void clearCookies(jsi::Runtime& rt, const AsyncCallback<bool>& callback);

  // RCTEventEmitter
  void addListener(jsi::Runtime& rt, const std::string& eventName);
  void removeListeners(jsi::Runtime& rt, uint32_t count);

 private:
  void didSendNetworkData(uint32_t requestId, int64_t progress, int64_t total);

  void didReceiveNetworkResponse(
      uint32_t requestId,
      uint32_t statusCode,
      const http::Headers& headers,
      const std::string& responseUrl) noexcept;

  void didReceiveNetworkData(
      uint32_t requestId,
      const std::string& responseType,
      std::unique_ptr<folly::IOBuf> buf);

  int64_t didReceiveNetworkIncrementalData(
      uint32_t requestId,
      std::unique_ptr<folly::IOBuf> buf,
      int64_t progress,
      int64_t total);

  void didReceiveNetworkDataProgress(
      uint32_t requestId,
      int64_t bytesRead,
      int64_t total);

  void didCompleteNetworkResponse(
      uint32_t requestId,
      const std::string& error,
      bool timeoutError);

  std::unique_ptr<IHttpClient> httpClient_;
  Requests requests_;
};

} // namespace facebook::react
