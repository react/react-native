/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "KeyboardAvoidingViewState.h"

#include <react/renderer/animationbackend/AnimatedPropsBuilder.h>
#include <react/renderer/animationbackend/AnimationMutation.h>

#include <utility>

namespace facebook::react {

KeyboardAvoidingViewState::KeyboardAvoidingViewState(
    ShadowNodeFamily::Weak family,
    std::weak_ptr<UIManagerAnimationBackend> animationBackend)
    : family_(std::move(family)),
      animationBackend_(std::move(animationBackend)) {}

#ifdef ANDROID
folly::dynamic KeyboardAvoidingViewState::getDynamic() const {
  return folly::dynamic::object();
}
#endif

void KeyboardAvoidingViewState::update(
    Float keyboardInset,
    Float keyboardRestingHeight) const {
  auto family = family_.lock();
  auto animationBackend = animationBackend_.lock();
  if (!family || !animationBackend) {
    return;
  }

  animationBackend->pushAnimationMutations(
      [&](AnimationTimestamp /*timestamp*/) {
        folly::dynamic rawProps = folly::dynamic::object(
            "keyboardInset", static_cast<double>(keyboardInset))(
            "keyboardRestingHeight",
            static_cast<double>(keyboardRestingHeight));
        AnimatedPropsBuilder builder;
        builder.storeDynamic(rawProps);

        AnimationMutations mutations;
        mutations.batch.push_back(
            AnimationMutation{
                .tag = family->getTag(),
                .family = family,
                .props = builder.get(),
                .hasLayoutUpdates = true});
        return mutations;
      });
}

} // namespace facebook::react
