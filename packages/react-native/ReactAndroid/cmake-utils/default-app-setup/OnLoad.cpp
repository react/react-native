/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// This C++ file is part of the default configuration used by apps and is placed
// inside react-native to encapsulate it from user space (so you won't need to
// touch C++/Cmake code at all on Android).
//
// If you wish to customize it (because you want to manually link a C++ library
// or pass a custom compilation flag) you can:
//
// 1. Copy this CMake file inside the `android/app/src/main/jni` folder of your
// project
// 2. Copy the OnLoad.cpp (in this same folder) file inside the same folder as
// above.
// 3. Extend your `android/app/build.gradle` as follows
//
// android {
//    // Other config here...
//    externalNativeBuild {
//        cmake {
//            path "src/main/jni/CMakeLists.txt"
//        }
//    }
// }

#include <DefaultComponentsRegistry.h>
#include <DefaultTurboModuleManagerDelegate.h>
#include <FBReactNativeSpec.h>
#include <React/ComponentRegistry.h>
#include <autolinking.h>
#include <fbjni/fbjni.h>

#ifdef REACT_NATIVE_APP_CODEGEN_HEADER
#include REACT_NATIVE_APP_CODEGEN_HEADER
#endif
#ifdef REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#include REACT_NATIVE_APP_COMPONENT_DESCRIPTORS_HEADER
#endif

namespace facebook::react {

void registerComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry) {
  // Custom Fabric Components go here. You can register custom
  // components coming from your App or from 3rd party libraries here.
  //
  // providerRegistry->add(concreteComponentDescriptorProvider<
  //        MyComponentDescriptor>());

  // We link app local components if available
#ifdef REACT_NATIVE_APP_COMPONENT_REGISTRATION
  REACT_NATIVE_APP_COMPONENT_REGISTRATION(registry);
#endif

  // And we fallback to the components autolinked
  autolinking_registerProviders(registry);
}

std::shared_ptr<TurboModule> cxxModuleProvider(
    const std::string& name,
    const std::shared_ptr<CallInvoker>& jsInvoker) {
  // Here you can provide your CXX Turbo Modules coming from
  // either your application or from external libraries. The approach to follow
  // is similar to the following (for a module called `NativeCxxModuleExample`):
  //
  // if (name == NativeCxxModuleExample::kModuleName) {
  //   return std::make_shared<NativeCxxModuleExample>(jsInvoker);
  // }

  // And we fallback to the CXX module providers autolinked
  return autolinking_cxxModuleProvider(name, jsInvoker);

  return nullptr;
}

std::shared_ptr<TurboModule> javaModuleProvider(
    const std::string& name,
    const JavaTurboModule::InitParams& params) {
  // Here you can provide your own module provider for TurboModules coming from
  // either your application or from external libraries. The approach to follow
  // is similar to the following (for a library called `samplelibrary`):
  //
  // auto module = samplelibrary_ModuleProvider(name, params);
  // if (module != nullptr) {
  //    return module;
  // }
  // return rncore_ModuleProvider(name, params);

  // We link app local modules if available
#ifdef REACT_NATIVE_APP_MODULE_PROVIDER
  auto module = REACT_NATIVE_APP_MODULE_PROVIDER(name, params);
  if (module != nullptr) {
    return module;
  }
#endif

  // We first try to look up core modules
  if (auto module = FBReactNativeSpec_ModuleProvider(name, params)) {
    return module;
  }

  // And we fallback to the module providers autolinked
  if (auto module = autolinking_ModuleProvider(name, params)) {
    return module;
  }

  return nullptr;
}

} // namespace facebook::react

JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
  return facebook::jni::initialize(vm, [] {
    facebook::react::DefaultTurboModuleManagerDelegate::cxxModuleProvider =
        &facebook::react::cxxModuleProvider;
    facebook::react::DefaultTurboModuleManagerDelegate::javaModuleProvider =
        &facebook::react::javaModuleProvider;
    facebook::react::DefaultComponentsRegistry::
        registerComponentDescriptorsFromEntryPoint =
            &facebook::react::registerComponents;
  });
}
