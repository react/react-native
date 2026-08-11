/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <memory>
#include <unordered_set>
#include <vector>

#include <cxxreact/JSExecutor.h>
#include <folly/dynamic.h>
#include <optional>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

class NativeModule;

struct [[deprecated(
    "This API will be removed along with the legacy architecture.")]] ModuleConfig {
  size_t index;
  folly::dynamic config;
};

class RN_EXPORT [[deprecated(
    "This API will be removed along with the legacy architecture.")]] ModuleRegistry {
 public:
  // not implemented:
  // onBatchComplete: see
  // https://our.intern.facebook.com/intern/tasks/?t=5279396 getModule: only
  // used by views getAllModules: only used for cleanup; use RAII instead
  // notifyCatalystInstanceInitialized: this is really only used by view-related
  // code notifyCatalystInstanceDestroy: use RAII instead

  using ModuleNotFoundCallback = std::function<bool(const std::string& name)>;

  ModuleRegistry(
      std::vector<std::unique_ptr<NativeModule>> modules,
      ModuleNotFoundCallback callback = nullptr);
  void registerModules(std::vector<std::unique_ptr<NativeModule>> modules);

  std::vector<std::string> moduleNames();

  std::optional<ModuleConfig> getConfig(const std::string& name);

  void callNativeMethod(
      unsigned int moduleId,
      unsigned int methodId,
      folly::dynamic&& params,
      int callId);
  MethodCallResult callSerializableNativeHook(
      unsigned int moduleId, unsigned int methodId, folly::dynamic&& params);

  std::string getModuleName(unsigned int moduleId);
  std::string getModuleSyncMethodName(
      unsigned int moduleId, unsigned int methodId);

 private:
  // This is always populated
  std::vector<std::unique_ptr<NativeModule>> modules_;

  // This is used to extend the population of modulesByName_ if registerModules
  // is called after moduleNames
  void updateModuleNamesFromIndex(size_t index);

  // This is only populated if moduleNames() is called.  Values are indices into
  // modules_.
  std::unordered_map<std::string, size_t> modulesByName_;

  // This is populated with modules that are requested via getConfig but are
  // unknown. An error will be thrown if they are subsequently added to the
  // registry.
  std::unordered_set<std::string> unknownModules_;

  // Function will be called if a module was requested but was not found.
  // If the function returns true, ModuleRegistry will try to find the module
  // again (assuming it's registered) If the function returns false,
  // ModuleRegistry will not try to find the module and return nullptr instead.
  ModuleNotFoundCallback moduleNotFoundCallback_;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
