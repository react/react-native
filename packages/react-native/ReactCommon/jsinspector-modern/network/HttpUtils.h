/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <map>
#include <string>

namespace facebook::react::jsinspector_modern {

using Headers = std::map<std::string, std::string>;

/**
 * Get the HTTP reason phrase for a given status code (RFC 9110).
 */
std::string httpReasonPhrase(uint16_t status);

/**
 * Get the MIME type for a response based on the 'Content-Type' header. If
 * the header is not present, returns 'application/octet-stream'.
 */
std::string mimeTypeFromHeaders(const Headers& headers);

} // namespace facebook::react::jsinspector_modern
