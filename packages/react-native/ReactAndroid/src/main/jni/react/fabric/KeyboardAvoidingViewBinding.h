/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>

#include "StateWrapperImpl.h"

namespace facebook::react {

/*
 * Gives `ReactKeyboardAvoidingView` access to the shared animation backend
 * through the C++ state of its shadow node.
 */
class KeyboardAvoidingViewBinding : public jni::JavaClass<KeyboardAvoidingViewBinding> {
 public:
  constexpr static const char *const kJavaDescriptor =
      "Lcom/facebook/react/views/keyboardavoidingview/KeyboardAvoidingViewBinding;";

  static void registerNatives();

 private:
  static void update(
      jni::alias_ref<jclass> /*unused*/,
      jni::alias_ref<StateWrapperImpl::javaobject> stateWrapper,
      jfloat keyboardInset,
      jfloat keyboardRestingHeight);
};

} // namespace facebook::react
