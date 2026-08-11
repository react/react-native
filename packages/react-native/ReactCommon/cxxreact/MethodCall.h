/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <map>
#include <string>
#include <vector>

#include <folly/dynamic.h>

namespace facebook::react {

struct [[deprecated(
    "This API will be removed along with the legacy architecture.")]] MethodCall {
  int moduleId;
  int methodId;
  folly::dynamic arguments;
  int callId;

  MethodCall(int mod, int meth, folly::dynamic&& args, int cid)
      : moduleId(mod),
        methodId(meth),
        arguments(std::move(args)),
        callId(cid) {}
};

/// \throws std::invalid_argument
[[deprecated(
    "This API will be removed along with the legacy architecture.")]] std::
    vector<MethodCall>
    parseMethodCalls(folly::dynamic&& jsonData);

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
