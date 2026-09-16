/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "CdpNetwork.h"

#include "HttpUtils.h"

namespace facebook::react::jsinspector_modern::cdp::network {

namespace {

folly::dynamic headersToDynamic(const Headers& headers) {
  folly::dynamic result = folly::dynamic::object;

  for (const auto& [key, value] : headers) {
    result[key] = value;
  }

  return result;
}

} // namespace

folly::dynamic Request::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["url"] = url;
  result["method"] = method;
  result["headers"] = headersToDynamic(headers);
  result["postData"] = postData.value_or("");

  return result;
}

/* static */ Response Response::fromInputParams(
    const std::string& url,
    uint16_t status,
    const Headers& headers,
    int encodedDataLength) {
  return {
      .url = url,
      .status = status,
      .statusText = httpReasonPhrase(status),
      .headers = headers,
      .mimeType = mimeTypeFromHeaders(headers),
      .encodedDataLength = encodedDataLength,
  };
}

folly::dynamic Response::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["url"] = url;
  result["status"] = status;
  result["statusText"] = statusText;
  result["headers"] = headersToDynamic(headers);
  result["mimeType"] = mimeType;
  result["encodedDataLength"] = encodedDataLength;

  return result;
}

folly::dynamic RequestWillBeSentParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["loaderId"] = loaderId;
  params["documentURL"] = documentURL;
  params["request"] = request.toDynamic();
  params["timestamp"] = timestamp;
  params["wallTime"] = wallTime;
  params["initiator"] = initiator;
  params["redirectHasExtraInfo"] = redirectResponse.has_value();

  if (redirectResponse.has_value()) {
    params["redirectResponse"] = redirectResponse->toDynamic();
  }

  return params;
}

folly::dynamic RequestWillBeSentExtraInfoParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["associatedCookies"] = folly::dynamic::array;
  params["headers"] = headersToDynamic(headers);
  params["connectTiming"] =
      folly::dynamic::object("requestTime", connectTiming.requestTime);

  return params;
}

folly::dynamic ResponseReceivedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["loaderId"] = loaderId;
  params["timestamp"] = timestamp;
  params["type"] = type;
  params["response"] = response.toDynamic();
  params["hasExtraInfo"] = hasExtraInfo;

  return params;
}

folly::dynamic DataReceivedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["dataLength"] = dataLength;
  params["encodedDataLength"] = encodedDataLength;

  return params;
}

folly::dynamic LoadingFailedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["type"] = type;
  params["errorText"] = errorText;
  params["canceled"] = canceled;

  return params;
}

folly::dynamic LoadingFinishedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["encodedDataLength"] = encodedDataLength;

  return params;
}

/* static */ WebSocketResponse WebSocketResponse::fromInputParams(
    uint16_t status,
    const Headers& headers) {
  return {
      .status = status,
      .statusText = httpReasonPhrase(status),
      .headers = headers,
  };
}

folly::dynamic WebSocketResponse::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["status"] = status;
  result["statusText"] = statusText;
  result["headers"] = headersToDynamic(headers);

  return result;
}

folly::dynamic WebSocketFrame::toDynamic() const {
  folly::dynamic result = folly::dynamic::object;

  result["opcode"] = opcode;
  result["mask"] = mask;
  result["payloadData"] = payloadData;

  return result;
}

folly::dynamic WebSocketCreatedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["url"] = url;
  params["initiator"] = initiator;

  return params;
}

folly::dynamic WebSocketWillSendHandshakeRequestParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["wallTime"] = wallTime;
  params["request"] =
      folly::dynamic::object("headers", headersToDynamic(headers));

  return params;
}

folly::dynamic WebSocketHandshakeResponseReceivedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["response"] = response.toDynamic();

  return params;
}

folly::dynamic WebSocketFrameParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;
  params["response"] = response.toDynamic();

  return params;
}

folly::dynamic WebSocketClosedParams::toDynamic() const {
  folly::dynamic params = folly::dynamic::object;

  params["requestId"] = requestId;
  params["timestamp"] = timestamp;

  return params;
}

std::string resourceTypeFromMimeType(const std::string& mimeType) {
  if (mimeType.find("image/") == 0) {
    return "Image";
  }

  if (mimeType.find("video/") == 0 || mimeType.find("audio/") == 0) {
    return "Media";
  }

  if (mimeType == "application/javascript" || mimeType == "text/javascript" ||
      mimeType == "application/x-javascript") {
    return "Script";
  }

  if (mimeType == "application/json" || mimeType.find("application/xml") == 0 ||
      mimeType == "text/xml") {
    // Assume XHR for JSON/XML types
    return "XHR";
  }

  return "Other";
}

} // namespace facebook::react::jsinspector_modern::cdp::network
