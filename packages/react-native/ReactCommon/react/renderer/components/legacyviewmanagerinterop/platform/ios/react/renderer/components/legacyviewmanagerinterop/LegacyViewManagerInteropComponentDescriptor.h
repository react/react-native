/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#ifndef RCT_REMOVE_LEGACY_COMPONENT_INTEROP

#include <react/renderer/components/legacyviewmanagerinterop/LegacyViewManagerInteropShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>

namespace facebook::react {

class LegacyViewManagerInteropComponentDescriptor final
    : public ConcreteComponentDescriptor<LegacyViewManagerInteropShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  LegacyViewManagerInteropComponentDescriptor(const ComponentDescriptorParameters &parameters);
  /*
   * Returns `name` and `handle` based on a `flavor`, not on static data from
   * `LegacyViewManagerInteropShadowNode`.
   */
  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

 protected:
  void adopt(ShadowNode &shadowNode) const override;

 private:
  const std::shared_ptr<void> _coordinator;
};

} // namespace facebook::react

#endif // RCT_REMOVE_LEGACY_COMPONENT_INTEROP
