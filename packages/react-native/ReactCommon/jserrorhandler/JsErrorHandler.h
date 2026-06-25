/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>
#include <iosfwd>
#include <optional>

namespace facebook::react {

class JsErrorHandler {
 public:
  struct ProcessedError {
    struct StackFrame {
      std::optional<std::string> file;
      std::string methodName;
      std::optional<int> lineNumber;
      std::optional<int> column;
      friend std::ostream &operator<<(std::ostream &os, const StackFrame &frame);
    };

    std::string message;
    std::optional<std::string> originalMessage;
    std::optional<std::string> name;
    std::optional<std::string> componentStack;
    std::vector<StackFrame> stack;
    int id;
    bool isFatal;
    jsi::Object extraData;
    friend std::ostream &operator<<(std::ostream &os, const ProcessedError &error);
  };

  using OnJsError = std::function<void(jsi::Runtime &runtime, const ProcessedError &error)>;

  explicit JsErrorHandler(OnJsError onJsError);
  ~JsErrorHandler();

  void handleError(jsi::Runtime &runtime, jsi::JSError &error, bool isFatal, bool logToConsole = true);
  bool hasHandledFatalError();
  void registerErrorListener(const std::function<void(jsi::Runtime &, jsi::Value)> &listener);
  void setRuntimeReady();
  bool isRuntimeReady();
  void notifyOfFatalError();
  bool inErrorHandler();

 private:
  /**
   * This callback:
   * 1. Shouldn't retain the ReactInstance. So that we don't get retain cycles.
   * 2. Should be implemented by something that can outlive the react instance
   *    (both before init and after teardown). So that errors during init and
   *    teardown get reported properly.
   **/
  OnJsError _onJsError;
  bool _hasHandledFatalError{};
  bool _isRuntimeReady{};
  std::shared_ptr<bool> _inErrorHandler;
  std::vector<std::function<void(jsi::Runtime &, jsi::Value)>> _errorListeners;

  void handleErrorWithCppPipeline(jsi::Runtime &runtime, jsi::JSError &error, bool isFatal, bool logToConsole);
};

} // namespace facebook::react
