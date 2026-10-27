/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LogOnce.h"

#include <glog/logging.h>

#include <unordered_set>

namespace facebook::react {

LogOnceWrapper::~LogOnceWrapper() {
  std::string message = str();

  static std::unordered_set<std::string> loggedMessages;
  if (loggedMessages.find(message) != loggedMessages.end()) {
    return;
  }

  switch (severity_) {
    case Severity::Info:
      LOG(INFO) << message;
      break;
    case Severity::Warning:
      LOG(WARNING) << message;
      break;
    case Severity::Error:
      LOG(ERROR) << message;
      break;
    case Severity::Fatal:
    default:
      LOG(FATAL) << message;
  }

  loggedMessages.insert(message);
}

} // namespace facebook::react
