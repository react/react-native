/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <jsi/jsi.h>

namespace facebook::react::LegacyUIManagerConstantsProviderBinding {

/*
 * Installs RN$LegacyInterop_UIManager_getConstants binding into JavaScript
 * runtime. It is supposed to be used as a substitute to UIManager.getConstants
 * in bridgeless mode.
 */
void install(
    jsi::Runtime& runtime,
    const std::string& name,
    std::function<jsi::Value(jsi::Runtime&)>&& provider);
void install(
    jsi::Runtime& runtime,
    const std::string& name,
    std::function<jsi::Value(jsi::Runtime&, const std::string&)>&& provider);
} // namespace facebook::react::LegacyUIManagerConstantsProviderBinding
