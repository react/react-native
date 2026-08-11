/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>

namespace facebook::react {

class ComponentNameResolverBinding
    : public facebook::jni::JavaClass<ComponentNameResolverBinding> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/ComponentNameResolverBinding;";

  static void install(
      jni::alias_ref<jclass> /* unused */,
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      jni::alias_ref<jobject> componentNameResolver);

  static void registerNatives();
};

} // namespace facebook::react
