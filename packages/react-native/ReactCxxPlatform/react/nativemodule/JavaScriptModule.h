/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <functional>
#include <string>

namespace facebook::react {

using JavaScriptModuleCallback = std::function<void(
    const std::string& moduleName,
    const std::string& methodName,
    folly::dynamic&& args)>;

} // namespace facebook::react
