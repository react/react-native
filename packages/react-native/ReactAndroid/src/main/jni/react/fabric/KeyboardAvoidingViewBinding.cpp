/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "KeyboardAvoidingViewBinding.h"

#include <react/renderer/components/keyboardavoidingview/KeyboardAvoidingViewShadowNode.h>

namespace facebook::react {

namespace {

std::shared_ptr<const KeyboardAvoidingViewShadowNode::ConcreteState> getState(
    jni::alias_ref<StateWrapperImpl::javaobject> stateWrapper) {
  if (!stateWrapper) {
    return nullptr;
  }
  return std::dynamic_pointer_cast<
      const KeyboardAvoidingViewShadowNode::ConcreteState>(
      stateWrapper->cthis()->getState());
}

} // namespace

void KeyboardAvoidingViewBinding::registerNatives() {
  javaClassStatic()->registerNatives({
      makeNativeMethod("update", KeyboardAvoidingViewBinding::update),
  });
}

void KeyboardAvoidingViewBinding::update(
    jni::alias_ref<jclass> /*unused*/,
    jni::alias_ref<StateWrapperImpl::javaobject> stateWrapper,
    jfloat keyboardInset,
    jfloat keyboardRestingHeight) {
  auto state = getState(stateWrapper);
  if (state == nullptr) {
    return;
  }

  state->getData().update(keyboardInset, keyboardRestingHeight);
}

} // namespace facebook::react
