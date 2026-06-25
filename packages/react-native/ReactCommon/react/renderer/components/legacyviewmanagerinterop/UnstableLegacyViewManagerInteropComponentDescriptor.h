/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

/*
 * Descriptor for <UnstableReactLegacyComponent> component.
 *
 * This component is part of the Fabric Interop Layer and is subject to future
 * changes (hence the "Unstable" prefix).
 */
template <const char *concreteComponentName>
class UnstableLegacyViewManagerInteropComponentDescriptor
    : public ConcreteComponentDescriptor<ConcreteViewShadowNode<concreteComponentName, ViewProps>> {
 public:
  UnstableLegacyViewManagerInteropComponentDescriptor<concreteComponentName>(
      const ComponentDescriptorParameters &parameters)
      : ConcreteComponentDescriptor<ConcreteViewShadowNode<concreteComponentName, ViewProps>>(parameters)
  {
  }

 private:
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
