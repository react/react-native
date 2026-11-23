/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevToolsRuntimeSettingsModule.h"
#if RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
ReactDevToolsRuntimeSettingsModuleProvider(
    [[maybe_unused]] std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
#ifdef REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY
  return std::make_shared<facebook::react::DevToolsRuntimeSettingsModule>(
      std::move(jsInvoker));
#else
  return nullptr;
#endif
}

#ifdef REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY

namespace facebook::react {

DevToolsRuntimeSettingsModule::DevToolsRuntimeSettingsModule(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeReactDevToolsRuntimeSettingsModuleCxxSpec(std::move(jsInvoker)) {}

void DevToolsRuntimeSettingsModule::setReloadAndProfileConfig(
    jsi::Runtime& /*rt*/,
    NativePartialReloadAndProfileConfig config) {
  DevToolsRuntimeSettings::getInstance().setReloadAndProfileConfig(config);
};

NativeReloadAndProfileConfig
DevToolsRuntimeSettingsModule::getReloadAndProfileConfig(jsi::Runtime& /*rt*/) {
  return DevToolsRuntimeSettings::getInstance().getReloadAndProfileConfig();
};

} // namespace facebook::react

#endif // REACT_NATIVE_DEBUGGER_ENABLED_DEVONLY
