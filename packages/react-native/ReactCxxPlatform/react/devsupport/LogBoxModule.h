/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#include <react/renderer/scheduler/SurfaceDelegate.h>

namespace facebook::react {
class LogBoxModule : public NativeLogBoxCxxSpec<LogBoxModule> {
 public:
  LogBoxModule(
      std::shared_ptr<CallInvoker> jsInvoker,
      std::shared_ptr<SurfaceDelegate> surfaceDelegate);
  ~LogBoxModule() override;

  void show(jsi::Runtime& rt);

  void hide(jsi::Runtime& rt);

 private:
  std::shared_ptr<SurfaceDelegate> surfaceDelegate_;
};
} // namespace facebook::react
