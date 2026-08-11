/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/componentregistry/ComponentDescriptorProviderRegistry.h>

namespace facebook::react::CoreComponentsRegistry {

std::shared_ptr<const ComponentDescriptorProviderRegistry>
sharedProviderRegistry();

void addCoreComponents(
    std::shared_ptr<const ComponentDescriptorProviderRegistry> registry);

} // namespace facebook::react::CoreComponentsRegistry
