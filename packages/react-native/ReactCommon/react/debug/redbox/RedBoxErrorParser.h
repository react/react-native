/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>

namespace facebook::react::unstable_redbox {

struct CodeFrame {
  std::string content;
  std::string fileName;
  int row = 0;
  int column = 0;
};

struct ParsedError {
  std::string title;
  std::string message;
  std::optional<CodeFrame> codeFrame;
  bool isCompileError = false;
  bool isRetryable = true;
};

/**
 * Parse a raw error message into structured components.
 * C++ port of parseLogBoxException from parseLogBoxLog.js.
 */
ParsedError parseErrorMessage(
    const std::string &message,
    const std::string &name = "",
    const std::string &componentStack = "",
    bool isFatal = true);

} // namespace facebook::react::unstable_redbox
