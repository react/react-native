/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RAMBundleRegistry.h"

#ifndef RCT_REMOVE_LEGACY_ARCH

#include <folly/String.h>

#include <memory>

namespace facebook::react {

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wdeprecated"
constexpr uint32_t RAMBundleRegistry::MAIN_BUNDLE_ID;
#pragma clang diagnostic pop

RAMBundleRegistry::RAMBundleRegistry(
    std::unique_ptr<JSModulesUnbundle> mainBundle,
    std::function<std::unique_ptr<JSModulesUnbundle>(std::string)> factory)
    : m_factory(std::move(factory)) {
  m_bundles.emplace(MAIN_BUNDLE_ID, std::move(mainBundle));
}

void RAMBundleRegistry::registerBundle(
    uint32_t bundleId,
    std::string bundlePath) {
  m_bundlePaths.emplace(bundleId, std::move(bundlePath));
}

JSModulesUnbundle::Module RAMBundleRegistry::getModule(
    uint32_t bundleId,
    uint32_t moduleId) {
  if (m_bundles.find(bundleId) == m_bundles.end()) {
    if (!m_factory) {
      throw std::runtime_error(
          "You need to register factory function in order to "
          "support multiple RAM bundles.");
    }

    auto bundlePath = m_bundlePaths.find(bundleId);
    if (bundlePath == m_bundlePaths.end()) {
      throw std::runtime_error(
          "In order to fetch RAM bundle from the registry, its file "
          "path needs to be registered first.");
    }
    m_bundles.emplace(bundleId, m_factory(bundlePath->second));
  }

  auto module = getBundle(bundleId)->getModule(moduleId);
  if (bundleId == MAIN_BUNDLE_ID) {
    return module;
  }

  return {
      .name = "seg-" + std::to_string(bundleId) + '_' + module.name,
      .code = std::move(module.code),
  };
}

JSModulesUnbundle* RAMBundleRegistry::getBundle(uint32_t bundleId) const {
  return m_bundles.at(bundleId).get();
}

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_ARCH
