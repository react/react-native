/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/io/IOBuf.h>
#include <functional>
#include <memory>
#include <optional>
#include <string>
#include <utility>
#include <vector>

namespace facebook::react {

namespace http {

using Headers = std::vector<std::pair<std::string, std::string>>;

struct FormDataField {
  std::string fieldName;
  Headers headers;
  std::optional<std::string> string;
  std::optional<std::string> uri;
};

using FormData = std::vector<FormDataField>;

struct Body {
  std::optional<std::string> string;
  std::optional<std::string> blob;
  std::optional<FormData> formData;
  std::optional<std::string> base64;
};

using OnUploadProgress = std::function<void(int64_t progress, int64_t size)>;
using OnResponse = std::function<void(uint16_t responseCode, Headers headers)>;
using OnBody = std::function<void(std::unique_ptr<folly::IOBuf> body)>;
using OnBodyIncremental = std::function<int64_t(
    int64_t progress,
    int64_t total,
    std::unique_ptr<folly::IOBuf> body)>;
using OnBodyProgress = std::function<void(int64_t loaded, int64_t total)>;
using OnResponseComplete =
    std::function<void(std::string error, bool timeoutError)>;

struct NetworkCallbacks {
  OnUploadProgress onUploadProgress{nullptr};
  OnResponse onResponse{nullptr};
  OnBody onBody{nullptr};
  OnBodyIncremental onBodyIncremental{nullptr};
  OnBodyProgress onBodyProgress{nullptr};
  OnResponseComplete onResponseComplete{nullptr};
  bool sendIncrementalUpdates{false};
  bool sendProgressUpdates{false};
};

struct IRequestToken {
  virtual ~IRequestToken() = default;

  virtual void cancel() noexcept = 0;
};

} // namespace http

struct IHttpClient {
  virtual ~IHttpClient() = default;

  virtual std::unique_ptr<http::IRequestToken> sendRequest(
      http::NetworkCallbacks&& callback,
      const std::string& method,
      const std::string& url,
      const http::Headers& headers = {},
      const http::Body& body = {},
      uint32_t timeout = 0,
      std::optional<std::string> loggingId = std::nullopt) = 0;
};

extern const char HttpClientFactoryKey[];

extern const char DevToolsHttpClientFactoryKey[];

using HttpClientFactory = std::function<std::unique_ptr<IHttpClient>()>;

HttpClientFactory getHttpClientFactory();

} // namespace facebook::react
