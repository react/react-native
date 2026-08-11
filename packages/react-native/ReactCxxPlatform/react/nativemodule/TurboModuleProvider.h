/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>
#include <string>
#include <vector>

namespace facebook::react {

class CallInvoker;
class TurboModule;

using TurboModuleProvider = std::function<std::shared_ptr<TurboModule>(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker)>;

using TurboModuleProviders = std::vector<TurboModuleProvider>;

} // namespace facebook::react
