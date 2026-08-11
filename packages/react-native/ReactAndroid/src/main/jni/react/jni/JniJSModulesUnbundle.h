/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <android/asset_manager.h>
#include <cxxreact/JSModulesUnbundle.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

namespace facebook::react {

class [[deprecated(
    "This API will be removed along with the legacy architecture.")]] JniJSModulesUnbundle
    : public JSModulesUnbundle {
  /**
   * This implementation reads modules as single file from the assets of an apk.
   */
 public:
  JniJSModulesUnbundle() = default;
  JniJSModulesUnbundle(
      AAssetManager * assetManager, std::string moduleDirectory);
  JniJSModulesUnbundle(JniJSModulesUnbundle && other) = delete;
  JniJSModulesUnbundle& operator=(JSModulesUnbundle&& other) = delete;

  static std::unique_ptr<JniJSModulesUnbundle> fromEntryFile(
      AAssetManager * assetManager, const std::string& entryFile);

  static bool isUnbundle(
      AAssetManager * assetManager, const std::string& assetName);
  virtual Module getModule(uint32_t moduleId) const override;

 private:
  AAssetManager* m_assetManager = nullptr;
  std::string m_moduleDirectory;
};

} // namespace facebook::react

#endif
