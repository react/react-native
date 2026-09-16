/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <map>
#include <optional>
#include <string>

// Defines generic input object types for NetworkReporter.

namespace facebook::react {

/**
 * A collection of parsed HTTP headers.
 */
using Headers = std::map<std::string, std::string>;

/**
 * Request info from the request caller.
 */
struct RequestInfo {
  std::string url;
  std::string httpMethod;
  std::optional<Headers> headers;
  std::optional<std::string> httpBody;
};

/**
 * Response info from the request caller.
 */
struct ResponseInfo {
  std::string url;
  uint16_t statusCode;
  std::optional<Headers> headers;
};

} // namespace facebook::react
