/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <react/renderer/components/legacyviewmanagerinterop/UnstableLegacyViewManagerAutomaticShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <string>

namespace facebook::react {

class UnstableLegacyViewManagerAutomaticComponentDescriptor final
    : public ConcreteComponentDescriptor<LegacyViewManagerAndroidInteropShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  UnstableLegacyViewManagerAutomaticComponentDescriptor(
      const ComponentDescriptorParameters &parameters,
      std::string legacyComponentName)
      : ConcreteComponentDescriptor(parameters), legacyComponentName_(std::move(legacyComponentName))
  {
  }

  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

 private:
  std::string legacyComponentName_;
};
} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
