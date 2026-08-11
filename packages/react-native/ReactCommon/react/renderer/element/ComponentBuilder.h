/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>

#include <react/renderer/componentregistry/ComponentDescriptorRegistry.h>
#include <react/renderer/core/ComponentDescriptor.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>

#include <react/renderer/element/Element.h>
#include <react/renderer/element/ElementFragment.h>

namespace facebook::react {

/*
 * Build `ShadowNode` trees with a given given `Element` trees.
 */
class ComponentBuilder final {
 public:
  ComponentBuilder(
      ComponentDescriptorRegistry::Shared componentDescriptorRegistry);

  /*
   * Copyable and movable.
   */
  ComponentBuilder(const ComponentBuilder& componentBuilder) = default;
  ComponentBuilder(ComponentBuilder&& componentBuilder) noexcept = default;
  ComponentBuilder& operator=(const ComponentBuilder& other) = default;
  ComponentBuilder& operator=(ComponentBuilder&& other) = default;

  /*
   * Builds a `ShadowNode` tree with given `Element` tree using stored
   * `ComponentDescriptorRegistry`.
   */
  template <typename ShadowNodeT>
  std::shared_ptr<ShadowNodeT> build(Element<ShadowNodeT> element) const {
    return std::static_pointer_cast<ShadowNodeT>(build(element.fragment_));
  }

 private:
  /*
   * Internal, type-erased version of `build`.
   */
  std::shared_ptr<ShadowNode> build(
      const ElementFragment& elementFragment) const;

  ComponentDescriptorRegistry::Shared componentDescriptorRegistry_;
};

} // namespace facebook::react
