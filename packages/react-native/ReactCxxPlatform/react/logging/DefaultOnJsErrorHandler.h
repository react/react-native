/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <jserrorhandler/JsErrorHandler.h>

namespace facebook::react {

static inline JsErrorHandler::OnJsError getDefaultOnJsErrorFunc() {
  return [](jsi::Runtime& /*runtime*/,
            const JsErrorHandler::ProcessedError& error) {
    LOG(ERROR) << "[onJsError called]: " << error << std::endl;
  };
}

} // namespace facebook::react
