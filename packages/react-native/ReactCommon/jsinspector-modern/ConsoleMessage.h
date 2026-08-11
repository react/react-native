/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "StackTrace.h"

#include <vector>

#include <jsi/jsi.h>

namespace facebook::react::jsinspector_modern {

enum class ConsoleAPIType {
  kLog,
  kDebug,
  kInfo,
  kError,
  kWarning,
  kDir,
  kDirXML,
  kTable,
  kTrace,
  kStartGroup,
  kStartGroupCollapsed,
  kEndGroup,
  kClear,
  kAssert,
  kTimeEnd,
  kCount
};

/**
 * A simple, text-only console message that can be described without reference
 * to any JSI data.
 */
struct SimpleConsoleMessage {
  double timestamp;
  ConsoleAPIType type;
  std::vector<std::string> args;

  SimpleConsoleMessage(
      double timestamp,
      ConsoleAPIType type,
      std::vector<std::string> args);

  SimpleConsoleMessage(ConsoleAPIType type, std::vector<std::string> args);

  SimpleConsoleMessage(const SimpleConsoleMessage& other) = delete;
  SimpleConsoleMessage(SimpleConsoleMessage&& other) noexcept = default;
  SimpleConsoleMessage& operator=(const SimpleConsoleMessage& other) = delete;
  SimpleConsoleMessage& operator=(SimpleConsoleMessage&& other) noexcept =
      default;
  ~SimpleConsoleMessage() = default;
};

/**
 * A console message made of JSI values and a captured stack trace.
 */
struct ConsoleMessage {
  double timestamp;
  ConsoleAPIType type;
  std::vector<jsi::Value> args;
  std::unique_ptr<StackTrace> stackTrace;

  ConsoleMessage(
      double timestamp,
      ConsoleAPIType type,
      std::vector<jsi::Value> args,
      std::unique_ptr<StackTrace> stackTrace = StackTrace::empty())
      : timestamp(timestamp),
        type(type),
        args(std::move(args)),
        stackTrace(std::move(stackTrace)) {}

  ConsoleMessage(jsi::Runtime& runtime, SimpleConsoleMessage message);

  ConsoleMessage(const ConsoleMessage& other) = delete;
  ConsoleMessage(ConsoleMessage&& other) noexcept = default;
  ConsoleMessage& operator=(const ConsoleMessage& other) = delete;
  ConsoleMessage& operator=(ConsoleMessage&& other) noexcept = default;
  ~ConsoleMessage() = default;
};

} // namespace facebook::react::jsinspector_modern
