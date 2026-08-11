/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <devtoolsruntimesettings/DevToolsRuntimeSettings.h>

namespace facebook::react {

class DevToolsRuntimeSettingsModule
    : public NativeReactDevToolsRuntimeSettingsModuleCxxSpec<
          DevToolsRuntimeSettingsModule> {
 public:
  DevToolsRuntimeSettingsModule(std::shared_ptr<CallInvoker> jsInvoker);

  void setReloadAndProfileConfig(
      jsi::Runtime& rt,
      NativePartialReloadAndProfileConfig config);

  NativeReloadAndProfileConfig getReloadAndProfileConfig(jsi::Runtime& rt);
};

} // namespace facebook::react
