/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/PrivateGuard.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <memory>
#include <string>

#include <cxxreact/ModuleRegistry.h>
#include <jsi/jsi.h>
#include <optional>

namespace facebook::react {

/**
 * Holds and creates JS representations of the modules in ModuleRegistry
 */
class [[deprecated("This API will be removed along with the legacy architecture.")]] JSINativeModules {
 public:
  explicit JSINativeModules(std::shared_ptr<ModuleRegistry> moduleRegistry);
  jsi::Value getModule(jsi::Runtime &rt, const jsi::PropNameID &name);
  void reset();

 private:
  std::optional<jsi::Function> m_genNativeModuleJS;
  std::shared_ptr<ModuleRegistry> m_moduleRegistry;
  std::unordered_map<std::string, jsi::Object> m_objects;

  std::optional<jsi::Object> createModule(jsi::Runtime &rt, const std::string &name);
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
