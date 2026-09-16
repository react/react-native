/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "JReactExceptionManager.h"
#include <fbjni/fbjni.h>
#include <glog/logging.h>
#include <jni.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/jni/ReadableNativeMap.h>

namespace facebook::react {

namespace {
class ProcessedError : public facebook::jni::JavaClass<ProcessedError> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ProcessedError;";
};

class ProcessedErrorStackFrameImpl
    : public facebook::jni::JavaClass<ProcessedErrorStackFrameImpl> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ProcessedErrorStackFrameImpl;";

  static facebook::jni::local_ref<ProcessedErrorStackFrameImpl> create(
      const JsErrorHandler::ProcessedError::StackFrame& frame) {
    return newInstance(
        frame.file ? jni::make_jstring(*frame.file) : nullptr,
        frame.methodName,
        frame.lineNumber ? jni::JInteger::valueOf(*frame.lineNumber) : nullptr,
        frame.column ? jni::JInteger::valueOf(*frame.column) : nullptr);
  }
};

class ProcessedErrorImpl
    : public facebook::jni::JavaClass<ProcessedErrorImpl, ProcessedError> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler$ProcessedErrorImpl;";

  static facebook::jni::local_ref<ProcessedErrorImpl> create(
      jsi::Runtime& runtime,
      const JsErrorHandler::ProcessedError& error) {
    auto stack =
        facebook::jni::JArrayList<ProcessedErrorStackFrameImpl>::create();
    for (const auto& frame : error.stack) {
      stack->add(ProcessedErrorStackFrameImpl::create(frame));
    }

    // Marshalling `extraData` out of the runtime can throw (e.g. a
    // jsi::JSIException when the runtime is in a bad state during a fatal
    // error). This runs inside the `noexcept` onJsError callback, so an
    // escaping exception aborts the whole process; contain it and report the
    // error without its extra data instead. `extraData` may end up null (here,
    // or when the JS value is null/undefined); the Java field is nullable.
    jni::local_ref<ReadableNativeMap::jhybridobject> extraData;

    auto reportWithoutExtraData = [&](const char* reason) {
      LOG(ERROR)
          << "JReactExceptionManager: failed to marshal JS error extraData; reporting the error without it: "
          << reason;
      try {
        extraData = ReadableNativeMap::createWithContents(
            folly::dynamic::object("extraDataMarshallingError", reason));
      } catch (...) {
        // The fallback allocation can itself throw; leave extraData null.
        extraData = nullptr;
      }
    };

    try {
      auto extraDataDynamic =
          jsi::dynamicFromValue(runtime, jsi::Value(runtime, error.extraData));
      extraData =
          ReadableNativeMap::createWithContents(std::move(extraDataDynamic));
    } catch (const std::exception& e) {
      reportWithoutExtraData(e.what());
    } catch (...) {
      reportWithoutExtraData("unknown exception");
    }

    return newInstance(
        error.message,
        error.originalMessage ? jni::make_jstring(*error.originalMessage)
                              : nullptr,
        error.name ? jni::make_jstring(*error.name) : nullptr,
        error.componentStack ? jni::make_jstring(*error.componentStack)
                             : nullptr,
        stack,
        error.id,
        error.isFatal,
        extraData);
  }
};
} // namespace

void JReactExceptionManager::reportJsException(
    jsi::Runtime& runtime,
    const JsErrorHandler::ProcessedError& error) {
  static const auto method =
      javaClassStatic()->getMethod<void(jni::alias_ref<ProcessedError>)>(
          "reportJsException");
  if (self() != nullptr) {
    method(self(), ProcessedErrorImpl::create(runtime, error));
  }
}

} // namespace facebook::react
