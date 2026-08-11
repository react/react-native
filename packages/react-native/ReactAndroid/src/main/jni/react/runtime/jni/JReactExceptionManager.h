/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <jni.h>
#include <jserrorhandler/JsErrorHandler.h>

namespace facebook::react {

class JReactExceptionManager
    : public facebook::jni::JavaClass<JReactExceptionManager> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/interfaces/exceptionmanager/ReactJsExceptionHandler;";

  void reportJsException(
      jsi::Runtime& runtime,
      const JsErrorHandler::ProcessedError& error);
};

} // namespace facebook::react
