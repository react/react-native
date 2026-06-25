/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JsErrorHandler.h"
#include <cxxreact/ErrorUtils.h>
#include <glog/logging.h>
#include <react/bridging/Bridging.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <ostream>
#include <string>
#include "StackTraceParser.h"

using namespace facebook;

namespace {
std::string quote(const std::string& view) {
  return "\"" + view + "\"";
}

int nextExceptionId() {
  static int exceptionId = 0;
  return exceptionId++;
}

bool isLooselyNull(const jsi::Value& value) {
  return value.isNull() || value.isUndefined();
}

bool isEqualTo(
    jsi::Runtime& runtime,
    const jsi::Value& value,
    const std::string& str) {
  return jsi::Value::strictEquals(
      runtime, value, jsi::String::createFromUtf8(runtime, str));
}

std::string stringifyToCpp(jsi::Runtime& runtime, const jsi::Value& value) {
  return value.toString(runtime).utf8(runtime);
}

bool isTruthy(jsi::Runtime& runtime, const jsi::Value& value) {
  auto Boolean = runtime.global().getPropertyAsFunction(runtime, "Boolean");
  return Boolean.call(runtime, value).getBool();
}

void objectAssign(
    jsi::Runtime& runtime,
    jsi::Object& target,
    const jsi::Object& value) {
  auto Object = runtime.global().getPropertyAsObject(runtime, "Object");
  auto assign = Object.getPropertyAsFunction(runtime, "assign");
  assign.callWithThis(runtime, Object, target, value);
}

jsi::Object wrapInErrorIfNecessary(
    jsi::Runtime& runtime,
    const jsi::Value& value) {
  auto Error = runtime.global().getPropertyAsFunction(runtime, "Error");
  auto isError =
      value.isObject() && value.asObject(runtime).instanceOf(runtime, Error);
  auto error = isError
      ? value.getObject(runtime)
      : Error.callAsConstructor(runtime, value).getObject(runtime);
  return error;
}

class SetFalseOnDestruct {
  std::shared_ptr<bool> _value;

 public:
  SetFalseOnDestruct(const SetFalseOnDestruct&) = delete;
  SetFalseOnDestruct& operator=(const SetFalseOnDestruct&) = delete;
  SetFalseOnDestruct(SetFalseOnDestruct&&) = delete;
  SetFalseOnDestruct& operator=(SetFalseOnDestruct&&) = delete;
  explicit SetFalseOnDestruct(std::shared_ptr<bool> value)
      : _value(std::move(value)) {}
  ~SetFalseOnDestruct() {
    *_value = false;
  }
};

void logErrorWhileReporting(
    std::string message,
    jsi::JSError& error,
    jsi::JSError& originalError) {
  LOG(ERROR) << "JsErrorHandler::" << message << std::endl
             << "Js error message: " << error.getMessage() << std::endl
             << "Original js error message: " << originalError.getMessage()
             << std::endl;
}

jsi::Value getBundleMetadata(jsi::Runtime& runtime, jsi::JSError& error) {
  auto jsGetBundleMetadataValue =
      runtime.global().getProperty(runtime, "__getBundleMetadata");

  if (!jsGetBundleMetadataValue.isObject() ||
      !jsGetBundleMetadataValue.asObject(runtime).isFunction(runtime)) {
    return jsi::Value::null();
  }

  auto jsGetBundleMetadataValueFn =
      jsGetBundleMetadataValue.asObject(runtime).asFunction(runtime);

  try {
    auto bundleMetadataValue = jsGetBundleMetadataValueFn.call(runtime);
    if (bundleMetadataValue.isObject()) {
      return bundleMetadataValue;
    }
    return bundleMetadataValue;
  } catch (jsi::JSError& ex) {
    logErrorWhileReporting(
        "getBundleMetadata(): Error raised while calling __getBundleMetadata(). Returning null.",
        ex,
        error);
  }

  return jsi::Value::null();
}
} // namespace

namespace facebook::react {

template <>
struct Bridging<JsErrorHandler::ProcessedError::StackFrame> {
  static jsi::Object toJs(
      jsi::Runtime& runtime,
      const JsErrorHandler::ProcessedError::StackFrame& frame) {
    auto stackFrame = jsi::Object(runtime);
    auto file = bridging::toJs(runtime, frame.file, nullptr);
    auto lineNumber = bridging::toJs(runtime, frame.lineNumber, nullptr);
    auto column = bridging::toJs(runtime, frame.column, nullptr);

    stackFrame.setProperty(runtime, "file", file);
    stackFrame.setProperty(runtime, "methodName", frame.methodName);
    stackFrame.setProperty(runtime, "lineNumber", lineNumber);
    stackFrame.setProperty(runtime, "column", column);
    return stackFrame;
  }
};

template <>
struct Bridging<JsErrorHandler::ProcessedError> {
  static jsi::Object toJs(
      jsi::Runtime& runtime,
      const JsErrorHandler::ProcessedError& error) {
    auto data = jsi::Object(runtime);
    data.setProperty(runtime, "message", error.message);
    data.setProperty(
        runtime,
        "originalMessage",
        bridging::toJs(runtime, error.originalMessage, nullptr));
    data.setProperty(
        runtime, "name", bridging::toJs(runtime, error.name, nullptr));
    data.setProperty(
        runtime,
        "componentStack",
        bridging::toJs(runtime, error.componentStack, nullptr));

    auto stack = jsi::Array(runtime, error.stack.size());
    for (size_t i = 0; i < error.stack.size(); i++) {
      auto& frame = error.stack[i];
      stack.setValueAtIndex(runtime, i, bridging::toJs(runtime, frame));
    }

    data.setProperty(runtime, "stack", stack);
    data.setProperty(runtime, "id", error.id);
    data.setProperty(runtime, "isFatal", error.isFatal);
    data.setProperty(runtime, "extraData", error.extraData);
    return data;
  }
};

std::ostream& operator<<(
    std::ostream& os,
    const JsErrorHandler::ProcessedError::StackFrame& frame) {
  auto file = frame.file ? quote(*frame.file) : "nil";
  auto methodName = quote(frame.methodName);
  auto lineNumber =
      frame.lineNumber ? std::to_string(*frame.lineNumber) : "nil";
  auto column = frame.column ? std::to_string(*frame.column) : "nil";

  os << "StackFrame { .file = " << file << ", .methodName = " << methodName
     << ", .lineNumber = " << lineNumber << ", .column = " << column << " }";
  return os;
}
std::ostream& operator<<(
    std::ostream& os,
    const JsErrorHandler::ProcessedError& error) {
  auto message = quote(error.message);
  auto originalMessage =
      error.originalMessage ? quote(*error.originalMessage) : "nil";
  auto name = error.name ? quote(*error.name) : "nil";
  auto componentStack =
      error.componentStack ? quote(*error.componentStack) : "nil";
  auto id = std::to_string(error.id);
  auto isFatal = std::to_string(static_cast<int>(error.isFatal));
  auto extraData = "jsi::Object{ <omitted> } ";

  os << "ProcessedError {\n"
     << "  .message = " << message << "\n"
     << "  .originalMessage = " << originalMessage << "\n"
     << "  .name = " << name << "\n"
     << "  .componentStack = " << componentStack << "\n"
     << "  .stack = [\n";

  for (const auto& frame : error.stack) {
    os << "    " << frame << ", \n";
  }
  os << "  ]\n"
     << "  .id = " << id << "\n"
     << "  .isFatal " << isFatal << "\n"
     << "  .extraData = " << extraData << "\n"
     << "}";
  return os;
}

JsErrorHandler::JsErrorHandler(JsErrorHandler::OnJsError onJsError)
    : _onJsError(std::move(onJsError)),
      _inErrorHandler(std::make_shared<bool>(false)) {

      };

JsErrorHandler::~JsErrorHandler() {}

void JsErrorHandler::handleError(
    jsi::Runtime& runtime,
    jsi::JSError& error,
    bool isFatal,
    bool logToConsole) {
  // TODO: Current error parsing works and is stable. Can investigate using
  // REGEX_HERMES to get additional Hermes data, though it requires JS setup

  if (!ReactNativeFeatureFlags::useAlwaysAvailableJSErrorHandling() &&
      _isRuntimeReady) {
    try {
      handleJSError(runtime, error, isFatal);
      return;
    } catch (jsi::JSError& ex) {
      logErrorWhileReporting(
          "handleError(): Error raised while reporting using js pipeline. Using c++ pipeline instead.",
          ex,
          error);

      // Re-try reporting using the c++ pipeline
      _hasHandledFatalError = false;
    }
  }

  handleErrorWithCppPipeline(runtime, error, isFatal, logToConsole);
}

void JsErrorHandler::handleErrorWithCppPipeline(
    jsi::Runtime& runtime,
    jsi::JSError& error,
    bool isFatal,
    bool logToConsole) {
  *_inErrorHandler = true;
  SetFalseOnDestruct temp{_inErrorHandler};

  auto message = error.getMessage();
  auto errorObj = wrapInErrorIfNecessary(runtime, error.value());
  auto componentStackValue = errorObj.getProperty(runtime, "componentStack");
  if (!isLooselyNull(componentStackValue)) {
    message += "\n" + stringifyToCpp(runtime, componentStackValue);
  }

  auto nameValue = errorObj.getProperty(runtime, "name");
  auto name = (isLooselyNull(nameValue) || isEqualTo(runtime, nameValue, ""))
      ? std::nullopt
      : std::optional(stringifyToCpp(runtime, nameValue));

  if (name && !message.starts_with(*name + ": ")) {
    message = *name + ": " + message;
  }

  auto extraDataKey = jsi::PropNameID::forUtf8(runtime, "RN$ErrorExtraDataKey");
  auto extraDataValue = errorObj.getProperty(runtime, extraDataKey);

  auto extraData = jsi::Object(runtime);
  if (extraDataValue.isObject()) {
    objectAssign(runtime, extraData, extraDataValue.asObject(runtime));
  }

  auto jsEngineValue = errorObj.getProperty(runtime, "jsEngine");
  auto isDEV =
      isTruthy(runtime, runtime.global().getProperty(runtime, "__DEV__"));

  extraData.setProperty(runtime, "jsEngine", jsEngineValue);
  extraData.setProperty(runtime, "rawStack", error.getStack());
  extraData.setProperty(runtime, "__DEV__", isDEV);
  extraData.setProperty(
      runtime, "bundleMetadata", getBundleMetadata(runtime, error));

  auto cause = errorObj.getProperty(runtime, "cause");
  if (cause.isObject()) {
    auto causeObj = cause.asObject(runtime);
    // TODO: Consider just forwarding all properties. For now, just forward the
    // stack properties to maintain symmetry with js pipeline
    auto stackSymbols = causeObj.getProperty(runtime, "stackSymbols");
    extraData.setProperty(runtime, "stackSymbols", stackSymbols);

    auto stackReturnAddresses =
        causeObj.getProperty(runtime, "stackReturnAddresses");
    extraData.setProperty(
        runtime, "stackReturnAddresses", stackReturnAddresses);

    auto stackElements = causeObj.getProperty(runtime, "stackElements");
    extraData.setProperty(runtime, "stackElements", stackElements);
  }

  auto originalMessage = message == error.getMessage()
      ? std::nullopt
      : std::optional(error.getMessage());

  auto componentStack = !componentStackValue.isString()
      ? std::nullopt
      : std::optional(componentStackValue.asString(runtime).utf8(runtime));

  auto isHermes = runtime.global().hasProperty(runtime, "HermesInternal");
  auto stackFrames = StackTraceParser::parse(isHermes, error.getStack());

  auto id = nextExceptionId();

  ProcessedError processedError = {
      .message =
          _isRuntimeReady ? message : ("[runtime not ready]: " + message),
      .originalMessage = originalMessage,
      .name = name,
      .componentStack = componentStack,
      .stack = stackFrames,
      .id = id,
      .isFatal = isFatal,
      .extraData = std::move(extraData),
  };

  auto data = bridging::toJs(runtime, processedError);

  auto isComponentError =
      isTruthy(runtime, errorObj.getProperty(runtime, "isComponentError"));
  data.setProperty(runtime, "isComponentError", isComponentError);

  if (logToConsole) {
    try {
      auto console = runtime.global().getPropertyAsObject(runtime, "console");
      auto errorFn = console.getPropertyAsFunction(runtime, "error");
      auto finalMessage =
          jsi::String::createFromUtf8(runtime, processedError.message);
      errorFn.callWithThis(runtime, console, finalMessage);
    } catch (jsi::JSError& ex) {
      logErrorWhileReporting(
          "handleErrorWithCppPipeline(): Error while logToConsole: ",
          ex,
          error);
    }
  }

  std::shared_ptr<bool> shouldPreventDefault = std::make_shared<bool>(false);
  auto preventDefault = jsi::Function::createFromHostFunction(
      runtime,
      jsi::PropNameID::forAscii(runtime, "preventDefault"),
      0,
      [shouldPreventDefault](
          jsi::Runtime& /*rt*/,
          const jsi::Value& /*thisVal*/,
          const jsi::Value* /*args*/,
          size_t /*count*/) {
        *shouldPreventDefault = true;
        return jsi::Value::undefined();
      });

  data.setProperty(runtime, "preventDefault", preventDefault);

  for (auto& errorListener : _errorListeners) {
    try {
      errorListener(runtime, jsi::Value(runtime, data));
    } catch (jsi::JSError& ex) {
      logErrorWhileReporting(
          "handleErrorWithCppPipeline(): Error raised inside an error listener. Executing next listener.",
          ex,
          error);
    }
  }

  if (*shouldPreventDefault) {
    return;
  }

  auto errorType = errorObj.getProperty(runtime, "type");
  auto isWarn = isEqualTo(runtime, errorType, "warn");

  if (isFatal || !isWarn) {
    if (isFatal) {
      if (_hasHandledFatalError) {
        return;
      }
      _hasHandledFatalError = true;
    }

    _onJsError(runtime, processedError);
  }
}

void JsErrorHandler::registerErrorListener(
    const std::function<void(jsi::Runtime&, jsi::Value)>& errorListener) {
  _errorListeners.push_back(errorListener);
}

bool JsErrorHandler::hasHandledFatalError() {
  return _hasHandledFatalError;
}

void JsErrorHandler::setRuntimeReady() {
  _isRuntimeReady = true;
}

bool JsErrorHandler::isRuntimeReady() {
  return _isRuntimeReady;
}

void JsErrorHandler::notifyOfFatalError() {
  _hasHandledFatalError = true;
}

bool JsErrorHandler::inErrorHandler() {
  return *_inErrorHandler;
}

} // namespace facebook::react
