/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <cstdint>
#include <stdexcept>
#include <string>

namespace facebook::react {

class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] JSModulesUnbundle {
  /**
   * Represents the set of JavaScript modules that the application consists of.
   * The source code of each module can be retrieved by module ID.
   *
   * The class is non-copyable because copying instances might involve copying
   * several megabytes of memory.
   */
 public:
  class ModuleNotFound : public std::out_of_range {
   public:
    using std::out_of_range::out_of_range;
    explicit ModuleNotFound(uint32_t moduleId)
        : std::out_of_range::out_of_range(
              "Module not found: " + std::to_string(moduleId)) {}
  };
  struct Module {
    std::string name;
    std::string code;
  };
  JSModulesUnbundle() {}
  virtual ~JSModulesUnbundle() = default;
  virtual Module getModule(uint32_t moduleId) const = 0;

 private:
  JSModulesUnbundle(const JSModulesUnbundle&) = delete;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
