/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/unimplementedview/UnimplementedViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/PropsParserContext.h>

namespace facebook::react {

/*
 * Descriptor for <UnimplementedView> component.
 */
class UnimplementedViewComponentDescriptor final
    : public ConcreteComponentDescriptor<UnimplementedViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;

  /*
   * Returns `name` and `handle` based on a `flavor`, not on static data from
   * `UnimplementedViewShadowNode`.
   */
  ComponentHandle getComponentHandle() const override;
  ComponentName getComponentName() const override;

  /*
   * In addition to base implementation, stores a component name inside cloned
   * `Props` object.
   */
  Props::Shared cloneProps(
      const PropsParserContext& context,
      const Props::Shared& props,
      RawProps rawProps) const override;
};

} // namespace facebook::react
