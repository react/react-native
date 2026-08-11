/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "IDevUIDelegate.h"

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <jsi/jsi.h>
#include <optional>

namespace facebook::react {

class DevLoadingViewModule
    : public NativeDevLoadingViewCxxSpec<DevLoadingViewModule> {
 public:
  DevLoadingViewModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::weak_ptr<IDevUIDelegate> devUIDelegate);

  ~DevLoadingViewModule() override;

  void showMessage(
      jsi::Runtime& rt,
      const std::string& message,
      std::optional<int32_t> textColor,
      std::optional<int32_t> backgroundColor,
      std::optional<bool> dismissButton);
  void hide(jsi::Runtime& rt);

 private:
  std::weak_ptr<IDevUIDelegate> devUIDelegate_;
};

} // namespace facebook::react
