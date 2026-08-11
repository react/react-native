/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <ReactCommon/CallInvoker.h>
#include <ReactCommon/TurboModule.h>
#include <functional>
#include <memory>
#include <string>

namespace facebook::react {

std::unordered_map<
    std::string,
    std::function<
        std::shared_ptr<TurboModule>(std::shared_ptr<CallInvoker> jsInvoker)>>&
globalExportedCxxTurboModuleMap();

/**
 * Registers the given C++ TurboModule initializer function
 * in the global module map.
 * This needs to be called before the TurboModule is requested from JS,
 * for example in a `+ load`, your AppDelegate's start, or from Java init.
 */
void registerCxxModuleToGlobalModuleMap(
    std::string name,
    std::function<std::shared_ptr<TurboModule>(
        std::shared_ptr<CallInvoker> jsInvoker)> moduleProviderFunc);

} // namespace facebook::react
