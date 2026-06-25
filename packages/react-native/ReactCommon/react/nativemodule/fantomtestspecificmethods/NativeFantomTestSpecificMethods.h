/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>

namespace facebook::react {

struct FantomForcedCloneCommitHook;

class NativeFantomTestSpecificMethods : public NativeFantomTestSpecificMethodsCxxSpec<NativeFantomTestSpecificMethods> {
 public:
  explicit NativeFantomTestSpecificMethods(std::shared_ptr<CallInvoker> jsInvoker);

  void registerForcedCloneCommitHook(jsi::Runtime &runtime);

  void takeFunctionAndNoop(jsi::Runtime &runtime, jsi::Function callback);

  void setRootNodeSize(jsi::Runtime &runtime, int surfaceId, float width, float height);

 private:
  std::shared_ptr<FantomForcedCloneCommitHook> fantomForcedCloneCommitHook_{};
};

} // namespace facebook::react
