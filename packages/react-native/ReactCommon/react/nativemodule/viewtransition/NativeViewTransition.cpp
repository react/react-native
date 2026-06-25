/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "NativeViewTransition.h"

#include <react/renderer/uimanager/UIManagerBinding.h>

#ifdef RN_DISABLE_OSS_PLUGIN_HEADER
#include "Plugins.h"
#endif

std::shared_ptr<facebook::react::TurboModule>
NativeViewTransitionModuleProvider(
    std::shared_ptr<facebook::react::CallInvoker> jsInvoker) {
  return std::make_shared<facebook::react::NativeViewTransition>(
      std::move(jsInvoker));
}

namespace facebook::react {

NativeViewTransition::NativeViewTransition(
    std::shared_ptr<CallInvoker> jsInvoker)
    : NativeViewTransitionCxxSpec(std::move(jsInvoker)) {}

std::optional<jsi::Object> NativeViewTransition::getViewTransitionInstance(
    jsi::Runtime& rt,
    const std::string& name,
    const std::string& pseudo) {
  auto& uiManager = UIManagerBinding::getBinding(rt)->getUIManager();
  auto* viewTransitionDelegate = uiManager.getViewTransitionDelegate();
  if (viewTransitionDelegate == nullptr) {
    return std::nullopt;
  }

  auto instance =
      viewTransitionDelegate->getViewTransitionInstance(name, pseudo);
  if (!instance) {
    return std::nullopt;
  }

  auto result = jsi::Object(rt);
  result.setProperty(rt, "x", instance->x);
  result.setProperty(rt, "y", instance->y);
  result.setProperty(rt, "width", instance->width);
  result.setProperty(rt, "height", instance->height);
  result.setProperty(rt, "nativeTag", static_cast<double>(instance->nativeTag));
  return result;
}

jsi::Value NativeViewTransition::findPseudoElementShadowNodeByTag(
    jsi::Runtime& rt,
    double reactTag) {
  auto& uiManager = UIManagerBinding::getBinding(rt)->getUIManager();
  auto* viewTransitionDelegate = uiManager.getViewTransitionDelegate();
  if (viewTransitionDelegate != nullptr) {
    auto shadowNode = viewTransitionDelegate->findPseudoElementShadowNodeByTag(
        static_cast<Tag>(reactTag));
    if (shadowNode) {
      return Bridging<std::shared_ptr<const ShadowNode>>::toJs(rt, shadowNode);
    }
  }

  return jsi::Value::null();
}

void NativeViewTransition::waitForTransitionAnimation(
    jsi::Runtime& rt,
    double animationId) {
  auto& uiManager = UIManagerBinding::getBinding(rt)->getUIManager();
  auto* viewTransitionDelegate = uiManager.getViewTransitionDelegate();
  if (viewTransitionDelegate != nullptr) {
    viewTransitionDelegate->waitForTransitionAnimation(
        static_cast<int>(animationId));
  }
}

void NativeViewTransition::transitionAnimationFinished(
    jsi::Runtime& rt,
    double animationId) {
  auto& uiManager = UIManagerBinding::getBinding(rt)->getUIManager();
  auto* viewTransitionDelegate = uiManager.getViewTransitionDelegate();
  if (viewTransitionDelegate != nullptr) {
    viewTransitionDelegate->transitionAnimationFinished(
        static_cast<int>(animationId));
  }
}

} // namespace facebook::react
