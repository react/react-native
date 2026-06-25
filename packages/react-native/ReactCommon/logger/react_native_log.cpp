/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "react_native_log.h"
#include <glog/logging.h>

static reactnativelogfunctype _reactnativelogfunc = nullptr;

void set_react_native_logfunc(reactnativelogfunctype newlogfunc) {
  _reactnativelogfunc = newlogfunc;
}
void react_native_log_info(const char* message) {
  _react_native_log(ReactNativeLogLevelInfo, message);
}
void react_native_log_warn(const char* message) {
  _react_native_log(ReactNativeLogLevelWarning, message);
}
void react_native_log_error(const char* message) {
  _react_native_log(ReactNativeLogLevelError, message);
}
void react_native_log_fatal(const char* message) {
  _react_native_log(ReactNativeLogLevelFatal, message);
}

void _react_native_log(ReactNativeLogLevel level, const char* message) {
  if (_reactnativelogfunc == nullptr) {
    _react_native_log_default(level, message);
  } else {
    _reactnativelogfunc(level, message);
  }
}

void _react_native_log_default(ReactNativeLogLevel level, const char* message) {
  switch (level) {
    case ReactNativeLogLevelInfo:
      LOG(INFO) << message;
      break;
    case ReactNativeLogLevelWarning:
      LOG(WARNING) << message;
      break;
    case ReactNativeLogLevelError:
      LOG(ERROR) << message;
      break;
    case ReactNativeLogLevelFatal:
      LOG(FATAL) << message;
  }
}
