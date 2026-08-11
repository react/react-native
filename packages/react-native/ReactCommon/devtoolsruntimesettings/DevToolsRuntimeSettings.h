/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>

namespace facebook::react {

using NativePartialReloadAndProfileConfig =
    NativeReactDevToolsRuntimeSettingsModulePartialReloadAndProfileConfig<
        std::optional<bool>,
        std::optional<bool>>;

template <>
struct Bridging<NativePartialReloadAndProfileConfig>
    : NativeReactDevToolsRuntimeSettingsModulePartialReloadAndProfileConfigBridging<
          NativePartialReloadAndProfileConfig> {};

using NativeReloadAndProfileConfig =
    NativeReactDevToolsRuntimeSettingsModuleReloadAndProfileConfig<bool, bool>;

template <>
struct Bridging<NativeReloadAndProfileConfig>
    : NativeReactDevToolsRuntimeSettingsModuleReloadAndProfileConfigBridging<
          NativeReloadAndProfileConfig> {};

class DevToolsRuntimeSettings {
 public:
  // static to persist across Turbo Module reloads
  static DevToolsRuntimeSettings& getInstance() {
    static DevToolsRuntimeSettings instance;
    return instance;
  }

 private:
  NativeReloadAndProfileConfig _config;

  DevToolsRuntimeSettings() : _config() {}

 public:
  ~DevToolsRuntimeSettings() = default;
  DevToolsRuntimeSettings(const DevToolsRuntimeSettings&) = delete;
  DevToolsRuntimeSettings(DevToolsRuntimeSettings&&) = delete;
  void operator=(const DevToolsRuntimeSettings&) = delete;
  void operator=(DevToolsRuntimeSettings&&) = delete;

  void setReloadAndProfileConfig(NativePartialReloadAndProfileConfig config);
  NativeReloadAndProfileConfig getReloadAndProfileConfig() const;
};

} // namespace facebook::react
