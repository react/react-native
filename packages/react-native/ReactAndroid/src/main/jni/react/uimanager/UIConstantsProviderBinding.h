/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <fbjni/fbjni.h>
#include <react/jni/JRuntimeExecutor.h>
#include <react/jni/NativeMap.h>

namespace facebook::react {

class DefaultEventTypesProvider
    : public jni::JavaClass<DefaultEventTypesProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderBinding$DefaultEventTypesProvider;";

  folly::dynamic getDefaultEventTypes() const {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>()>(
                "getDefaultEventTypes");
    return method(self())->cthis()->consume();
  }
};

class ConstantsForViewManagerProvider
    : public jni::JavaClass<ConstantsForViewManagerProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderBinding$ConstantsForViewManagerProvider;";

  folly::dynamic getConstantsForViewManager(
      const std::string& viewManagerName) const {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>(
                const std::string&)>("getConstantsForViewManager");
    auto result = method(self(), viewManagerName);
    if (result == nullptr) {
      return nullptr;
    }
    return result->cthis()->consume();
  }
};

class ConstantsProvider : public jni::JavaClass<ConstantsProvider> {
 public:
  static constexpr const char* kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderBinding$ConstantsProvider;";

  folly::dynamic getConstants() const {
    static auto method =
        javaClassStatic()
            ->getMethod<jni::alias_ref<NativeMap::jhybridobject>()>(
                "getConstants");
    return method(self())->cthis()->consume();
  }
};

class UIConstantsProviderBinding
    : public jni::JavaClass<UIConstantsProviderBinding> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/uimanager/UIConstantsProviderBinding;";

  static void install(
      jni::alias_ref<jclass> /* unused */,
      jni::alias_ref<JRuntimeExecutor::javaobject> runtimeExecutor,
      jni::alias_ref<DefaultEventTypesProvider::javaobject>
          defaultExportableEventTypesProvider,
      jni::alias_ref<ConstantsForViewManagerProvider::javaobject>
          constantsForViewManagerProvider,
      jni::alias_ref<ConstantsProvider::javaobject> constantsProvider);

  static void registerNatives();
};

} // namespace facebook::react
