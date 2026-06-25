/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DevToolsRuntimeSettings.h"

namespace facebook::react {

void DevToolsRuntimeSettings::setReloadAndProfileConfig(
    NativePartialReloadAndProfileConfig config) {
  if (config.shouldReloadAndProfile.has_value()) {
    _config.shouldReloadAndProfile = config.shouldReloadAndProfile.value();
  }
  if (config.recordChangeDescriptions.has_value()) {
    _config.recordChangeDescriptions = config.recordChangeDescriptions.value();
  }
};

NativeReloadAndProfileConfig
DevToolsRuntimeSettings::getReloadAndProfileConfig() const {
  return _config;
};

} // namespace facebook::react
