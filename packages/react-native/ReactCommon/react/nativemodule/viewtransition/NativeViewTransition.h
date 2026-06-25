/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string>

#if __has_include("FBReactNativeSpecJSI.h") // CocoaPod headers on Apple
#include "FBReactNativeSpecJSI.h"
#else
#include <FBReactNativeSpec/FBReactNativeSpecJSI.h>
#endif

#include <react/renderer/bridging/bridging.h>

namespace facebook::react {

class NativeViewTransition : public NativeViewTransitionCxxSpec<NativeViewTransition> {
 public:
  explicit NativeViewTransition(std::shared_ptr<CallInvoker> jsInvoker);

  std::optional<jsi::Object>
  getViewTransitionInstance(jsi::Runtime &rt, const std::string &name, const std::string &pseudo);

  jsi::Value findPseudoElementShadowNodeByTag(jsi::Runtime &rt, double reactTag);

  void waitForTransitionAnimation(jsi::Runtime &rt, double animationId);

  void transitionAnimationFinished(jsi::Runtime &rt, double animationId);
};

} // namespace facebook::react
