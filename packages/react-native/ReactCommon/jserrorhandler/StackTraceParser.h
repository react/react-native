/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <jserrorhandler/JsErrorHandler.h>
#include <string>
#include <vector>

namespace facebook::react {

class StackTraceParser {
 public:
  static std::vector<JsErrorHandler::ProcessedError::StackFrame> parse(bool isHermes, const std::string &stackString);
};

} // namespace facebook::react
