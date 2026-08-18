/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <jsi/jsi.h>

namespace facebook::react {
/*
 * Installs UIManger constants provider into JavaScript runtime. This is needed
 * to implement UIManager.getConstants in bridgeless mode. The constants object
 * contains view configs for every legacy native component.
 */
void installLegacyUIManagerConstantsProviderBinding(jsi::Runtime &runtime);
} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
