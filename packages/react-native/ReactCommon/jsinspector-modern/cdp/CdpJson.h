/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <folly/json.h>
#include <string>
#include <string_view>

namespace facebook::react::jsinspector_modern::cdp {

using RequestId = long long;

/**
 * Error codes to be used in CDP responses.
 * https://www.jsonrpc.org/specification#error_object
 */
enum class ErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603
  /* -32000 to -32099: Implementation-defined server errors. */
};

/**
 * An incoming CDP request that has been parsed into a more usable form.
 */
struct PreparsedRequest {
 public:
  /**
   * The ID of the request.
   */
  RequestId id{};

  /**
   * The name of the method being invoked.
   */
  std::string method;

  /**
   * The parameters passed to the method, if any.
   */
  folly::dynamic params;

  /**
   * Equality operator, useful for unit tests
   */
  inline bool operator==(const PreparsedRequest& rhs) const {
    return id == rhs.id && method == rhs.method && params == rhs.params;
  }

  std::string toJson() const;
};

/**
 * Parse a JSON-encoded CDP request into its constituent parts.
 * \throws ParseError If the input cannot be parsed.
 * \throws TypeError If the input does not conform to the expected format.
 */
PreparsedRequest preparse(std::string_view message);

/**
 * A type error that may be thrown while preparsing a request, or while
 * accessing dynamic params on a request.
 */
using TypeError = folly::TypeError;

/**
 * A parse error that may be thrown while preparsing a request.
 */
using ParseError = folly::json::parse_error;

/**
 * Helper functions for creating CDP (loosely JSON-RPC) messages of various
 * types, returning a JSON string ready for sending over the wire.
 */

/**
 * Returns a JSON-formatted string representing an error.
 *
 * {"id": <id>, "error": { "code": <cdp error code>, "message": <message> }}
 *
 * \param id Request ID. Mandatory, null only if the request omitted it or
 *           could not be parsed.
 * \param code Integer code from cdp::ErrorCode.
 * \param message Optional, brief human-readable error message.
 */
std::string jsonError(
    std::optional<RequestId> id,
    ErrorCode code,
    std::optional<std::string> message = std::nullopt);

/**
 * Returns a JSON-formatted string representing a successful response.
 *
 * {"id": <id>, "result": <result>}
 *
 * \param id The id of the request that this response corresponds to.
 * \param result Result payload, defaulting to {}.
 */
std::string jsonResult(
    RequestId id,
    const folly::dynamic& result = folly::dynamic::object());

/**
 * Returns a JSON-formatted string representing a unilateral notification.
 *
 * {"method": <method>, "params": <params>}
 *
 * \param method Notification (aka "event") method.
 * \param params Optional payload object.
 */
std::string jsonNotification(
    const std::string& method,
    std::optional<folly::dynamic> params = std::nullopt);

/**
 * Returns a JSON-formatted string representing a request.
 *
 * {"id": <id>, "method": <method>, "params": <params>}
 *
 * \param id Request ID.
 * \param method Requested method.
 * \param params Optional payload object.
 */
std::string jsonRequest(
    RequestId id,
    const std::string& method,
    std::optional<folly::dynamic> params = std::nullopt);

} // namespace facebook::react::jsinspector_modern::cdp
