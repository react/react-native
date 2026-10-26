/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/graphics/Float.h>
#include <react/renderer/uimanager/UIManagerAnimationBackend.h>

#include <memory>

#ifdef ANDROID
#include <folly/dynamic.h>
#endif

namespace facebook::react {

/*
 * State for <KeyboardAvoidingView> component.
 */
class KeyboardAvoidingViewState final {
 public:
  KeyboardAvoidingViewState() = default;

  KeyboardAvoidingViewState(ShadowNodeFamily::Weak family, std::weak_ptr<UIManagerAnimationBackend> animationBackend);

#ifdef ANDROID
  KeyboardAvoidingViewState(const KeyboardAvoidingViewState &previousState, const folly::dynamic & /*data*/)
      : KeyboardAvoidingViewState(previousState) {};

  folly::dynamic getDynamic() const;
#endif

  /*
   * Sends the keyboard inset to the shared animation backend, which applies
   * it with a commit. Must be called on the main thread.
   */
  void update(Float keyboardInset, Float keyboardRestingHeight) const;

 private:
  ShadowNodeFamily::Weak family_;
  std::weak_ptr<UIManagerAnimationBackend> animationBackend_;
};

} // namespace facebook::react
