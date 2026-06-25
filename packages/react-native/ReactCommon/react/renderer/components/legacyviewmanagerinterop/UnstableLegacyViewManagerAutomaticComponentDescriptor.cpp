/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "UnstableLegacyViewManagerAutomaticComponentDescriptor.h"

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <react/renderer/components/legacyviewmanagerinterop/UnstableLegacyViewManagerAutomaticShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <string>

namespace facebook::react {
ComponentName
UnstableLegacyViewManagerAutomaticComponentDescriptor::getComponentName()
    const {
  return legacyComponentName_.c_str();
}

ComponentHandle
UnstableLegacyViewManagerAutomaticComponentDescriptor::getComponentHandle()
    const {
  return reinterpret_cast<ComponentHandle>(getComponentName());
}
} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
