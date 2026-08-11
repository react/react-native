/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <memory>
#include <string>
#include <vector>

#include <ReactCommon/CxxReactPackage.h>
#include <ReactCommon/JavaTurboModule.h>
#include <ReactCommon/TurboModule.h>
#include <ReactCommon/TurboModuleManagerDelegate.h>
#include <fbjni/fbjni.h>

namespace facebook::react {

class DefaultTurboModuleManagerDelegate : public jni::HybridClass<
                                              DefaultTurboModuleManagerDelegate,
                                              TurboModuleManagerDelegate> {
 public:
  static constexpr auto kJavaDescriptor =
      "Lcom/facebook/react/defaults/DefaultTurboModuleManagerDelegate;";

  static jni::local_ref<jhybriddata> initHybrid(
      jni::alias_ref<jclass> /*unused*/,
      jni::alias_ref<jni::JList<
          CxxReactPackage::javaobject>::javaobject> /*cxxReactPackages*/);

  static void registerNatives();

  static std::function<std::shared_ptr<TurboModule>(
      const std::string&,
      const std::shared_ptr<CallInvoker>&)>
      cxxModuleProvider;

  static std::function<std::shared_ptr<TurboModule>(
      const std::string&,
      const JavaTurboModule::InitParams&)>
      javaModuleProvider;

  std::shared_ptr<TurboModule> getTurboModule(
      const std::string& name,
      const std::shared_ptr<CallInvoker>& jsInvoker) override;
  std::shared_ptr<TurboModule> getTurboModule(
      const std::string& name,
      const JavaTurboModule::InitParams& params) override;

 private:
  friend HybridBase;
  using HybridBase::HybridBase;

  std::vector<jni::global_ref<CxxReactPackage::javaobject>> cxxReactPackages_;

  DefaultTurboModuleManagerDelegate(
      jni::alias_ref<jni::JList<CxxReactPackage::javaobject>::javaobject>
          cxxReactPackage);
};

} // namespace facebook::react
