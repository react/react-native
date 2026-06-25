/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <cstdint>
#include <functional>
#include <memory>
#include <unordered_map>
#include <utility>

#include <cxxreact/JSModulesUnbundle.h>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

class RN_EXPORT [[deprecated("This API will be removed along with the legacy architecture.")]] RAMBundleRegistry {
 public:
  constexpr static uint32_t MAIN_BUNDLE_ID = 0;

  explicit RAMBundleRegistry(
      std::unique_ptr<JSModulesUnbundle> mainBundle,
      std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> factory = nullptr);

  RAMBundleRegistry(RAMBundleRegistry &&) = default;
  RAMBundleRegistry &operator=(RAMBundleRegistry &&) = default;

  void registerBundle(uint32_t bundleId, std::string bundlePath);
  JSModulesUnbundle::Module getModule(uint32_t bundleId, uint32_t moduleId);
  virtual ~RAMBundleRegistry() = default;

 private:
  JSModulesUnbundle *getBundle(uint32_t bundleId) const;

  std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> m_factory;
  std::unordered_map<uint32_t, std::string> m_bundlePaths;
  std::unordered_map<uint32_t, std::unique_ptr<JSModulesUnbundle>> m_bundles;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
