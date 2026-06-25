/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RedBoxErrorParser.h"

#include <regex> // NOLINT(facebook-hte-BadInclude-regex)
#include <unordered_set>

// @lint-ignore-every CLANGTIDY facebook-hte-StdRegexIsAwful
namespace facebook::react::unstable_redbox {

namespace {

const std::regex& metroErrorRegex() {
  static const std::regex re(
      R"(^(?:InternalError Metro has encountered an error:) (.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+))");
  return re;
}

const std::regex& babelTransformErrorRegex() {
  static const std::regex re(
      R"(^(?:TransformError )?(?:SyntaxError: |ReferenceError: )(.*): (.*) \((\d+):(\d+)\)\n\n([\s\S]+))");
  return re;
}

const std::regex& bundleLoadErrorRegex() {
  static const std::regex re(R"(^(\w+) in (\S+): (.+) \((\d+):(\d+)\))");
  return re;
}

const std::regex& babelCodeFrameErrorRegex() {
  static const std::regex re(
      R"(^(?:TransformError )?(?:.*):? (?:.*?)(\/.*): ([\s\S]+?)\n([ >]{2}[\d\s]+ \|[\s\S]+|\x1b[\s\S]+))");
  return re;
}

bool startsWithTransformError(const std::string& msg) {
  return msg.rfind("TransformError ", 0) == 0;
}

const std::unordered_set<std::string>& knownBundleLoadErrorTypes() {
  static const std::unordered_set<std::string> types{
      "SyntaxError", "ReferenceError", "TypeError", "UnableToResolveError"};
  return types;
}

} // namespace

ParsedError parseErrorMessage(
    const std::string& message,
    const std::string& name,
    const std::string& componentStack,
    bool isFatal) {
  std::smatch match;

  if (message.empty()) {
    return ParsedError{
        .title = isFatal ? "Uncaught Error" : "Error",
        .message = "",
        .codeFrame = std::nullopt,
        .isCompileError = false,
    };
  }

  // 1. Metro internal error
  if (std::regex_search(message, match, metroErrorRegex())) {
    return ParsedError{
        .title = match[1].str().empty() ? "Metro Error" : match[1].str(),
        .message = match[2].str(),
        .codeFrame =
            CodeFrame{
                .content = match[5].str(),
                .fileName = "",
                .row = std::stoi(match[3].str()),
                .column = std::stoi(match[4].str()),
            },
        .isCompileError = true,
    };
  }

  // 2. Babel transform error
  if (std::regex_search(message, match, babelTransformErrorRegex())) {
    return ParsedError{
        .title = "Syntax Error",
        .message = match[2].str(),
        .codeFrame =
            CodeFrame{
                .content = match[5].str(),
                .fileName = match[1].str(),
                .row = std::stoi(match[3].str()),
                .column = std::stoi(match[4].str()),
            },
        .isCompileError = true,
    };
  }

  // 3. Bundle loading error: "ErrorType in /path: message (line:col)"
  if (std::regex_search(message, match, bundleLoadErrorRegex())) {
    const auto& errorType = match[1].str();
    if (knownBundleLoadErrorTypes().count(errorType) > 0) {
      std::string title = errorType == "UnableToResolveError"
          ? "Module Not Found"
          : "Syntax Error";
      std::optional<std::string> codeFrameContent;
      auto newlinePos = message.find('\n');
      if (newlinePos != std::string::npos) {
        codeFrameContent = message.substr(newlinePos + 1);
      }
      return ParsedError{
          .title = title,
          .message = match[3].str(),
          .codeFrame =
              CodeFrame{
                  .content = codeFrameContent.value_or(""),
                  .fileName = match[2].str(),
                  .row = std::stoi(match[4].str()),
                  .column = std::stoi(match[5].str()),
              },
          .isCompileError = true,
      };
    }
  }

  // 4. Babel code frame error
  if (std::regex_search(message, match, babelCodeFrameErrorRegex())) {
    return ParsedError{
        .title = "Syntax Error",
        .message = match[2].str(),
        .codeFrame =
            CodeFrame{
                .content = match[3].str(),
                .fileName = match[1].str(),
            },
        .isCompileError = true,
    };
  }

  // 5. Generic transform error (no code frame)
  if (startsWithTransformError(message)) {
    return ParsedError{
        .title = "Syntax Error",
        .message = message,
        .codeFrame = std::nullopt,
        .isCompileError = true,
    };
  }

  // 6. Determine title from context (matching LogBoxInspectorHeader title map)
  std::string title;
  if (!name.empty()) {
    title = name;
  } else if (!componentStack.empty()) {
    title = "Render Error";
  } else if (isFatal) {
    title = "Uncaught Error";
  } else {
    title = "Error";
  }
  return ParsedError{
      .title = title,
      .message = message,
      .codeFrame = std::nullopt,
      .isCompileError = false,
  };
}

} // namespace facebook::react::unstable_redbox
