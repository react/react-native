/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/devsupport/DevServerHelper.h>
#include <memory>
#include <string>

namespace facebook::react {

class DevSettingsModule : public NativeDevSettingsCxxSpec<DevSettingsModule> {
  using LiveReloadCallback = std::function<void()>;

 public:
  DevSettingsModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::weak_ptr<DevServerHelper> devServerHelper,
      LiveReloadCallback liveReloadCallback)
      : NativeDevSettingsCxxSpec(jsInvoker),
        devServerHelper_(std::move(devServerHelper)),
        liveReloadCallback_(std::move(liveReloadCallback))
  {
  }

  void reload(jsi::Runtime &rt);

  void reloadWithReason(jsi::Runtime &rt, const std::string &reason);

  void onFastRefresh(jsi::Runtime &rt);

  void setHotLoadingEnabled(jsi::Runtime &rt, bool isHotLoadingEnabled);

  void setIsDebuggingRemotely(jsi::Runtime &rt, bool isDebuggingRemotelyEnabled);

  void setProfilingEnabled(jsi::Runtime &rt, bool isProfilingEnabled);

  void toggleElementInspector(jsi::Runtime &rt);

  void addMenuItem(jsi::Runtime &rt, const std::string &title);

  void setIsShakeToShowDevMenuEnabled(jsi::Runtime &rt, bool enabled);

  void openDebugger(jsi::Runtime &rt);

  void addListener(jsi::Runtime &rt, const std::string &eventName);

  void removeListeners(jsi::Runtime &rt, double count);

 private:
  std::weak_ptr<DevServerHelper> devServerHelper_;
  LiveReloadCallback liveReloadCallback_;
};

} // namespace facebook::react
