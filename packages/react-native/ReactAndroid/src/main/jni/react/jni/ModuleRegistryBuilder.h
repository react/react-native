/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <string>

#include <cxxreact/CxxModule.h>
#include <cxxreact/ModuleRegistry.h>
#include <fbjni/fbjni.h>

#include "CxxModuleWrapperBase.h"
#include "JavaModuleWrapper.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

class MessageQueueThread;

class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] ModuleHolder
    : public jni::JavaClass<ModuleHolder> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/facebook/react/bridge/ModuleHolder;";

  std::string getName() const;
  xplat::module::CxxModule::Provider getProvider(const std::string& moduleName)
      const;
};

[[deprecated(
    "This API will be removed along with the legacy architecture.")]] std::
    vector<std::unique_ptr<NativeModule>>
    buildNativeModuleList(
        std::weak_ptr<Instance> winstance,
        jni::alias_ref<
            jni::JCollection<JavaModuleWrapper::javaobject>::javaobject>
            javaModules,
        std::shared_ptr<MessageQueueThread> moduleMessageQueue);
} // namespace facebook::react

#endif
