/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

#include <jsi/jsi.h>
#include <react/bridging/LongLivedObject.h>

#include <ReactCommon/TurboModule.h>

namespace facebook::react {

class BridgelessNativeModuleProxy;

/**
 * Represents the JavaScript binding for the TurboModule system.
 */
class TurboModuleBinding final {
 public:
  /*
   * Installs TurboModuleBinding into JavaScript runtime.
   * Thread synchronization must be enforced externally.
   *
   * @deprecated Use the overload that takes
   * TurboModuleProviderFunctionTypeWithRuntime instead.
   * Remove after React Native 0.84 is released.
   */
  [[deprecated("Use the overload that takes TurboModuleProviderFunctionTypeWithRuntime instead")]]
  static void install(
      jsi::Runtime &runtime,
      TurboModuleProviderFunctionType &&moduleProvider,
      TurboModuleProviderFunctionType &&legacyModuleProvider = nullptr,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection = nullptr);

  static void install(
      jsi::Runtime &runtime,
      TurboModuleProviderFunctionTypeWithRuntime &&moduleProvider,
      TurboModuleProviderFunctionTypeWithRuntime &&legacyModuleProvider = nullptr,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection = nullptr);

  ~TurboModuleBinding();

 private:
  friend BridgelessNativeModuleProxy;

  TurboModuleBinding(
      jsi::Runtime &runtime,
      TurboModuleProviderFunctionTypeWithRuntime &&moduleProvider,
      std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection);

  /**
   * A lookup function exposed to JS to get an instance of a TurboModule
   * for the given name.
   */
  jsi::Value getModule(jsi::Runtime &runtime, const std::string &moduleName) const;

  jsi::Runtime &runtime_;
  TurboModuleProviderFunctionTypeWithRuntime moduleProvider_;
  std::shared_ptr<LongLivedObjectCollection> longLivedObjectCollection_;
};

} // namespace facebook::react
