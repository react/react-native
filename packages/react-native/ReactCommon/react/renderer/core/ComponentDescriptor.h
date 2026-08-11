/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/EventDispatcher.h>
#include <react/renderer/core/InstanceHandle.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawPropsParser.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/State.h>
#include <react/renderer/core/StateData.h>

namespace facebook::react {

class ComponentDescriptorParameters;
class ComponentDescriptor;
class ContextContainer;

using SharedComponentDescriptor = std::shared_ptr<const ComponentDescriptor>;

/*
 * Abstract class defining an interface of `ComponentDescriptor`.
 * `ComponentDescriptor` represents particular `ShadowNode` type and
 * defines (customizes) basic operations with particular kind of
 * `ShadowNode`s (such as creating, cloning, props and children managing).
 */
class ComponentDescriptor {
 public:
  using Shared = std::shared_ptr<const ComponentDescriptor>;
  using Unique = std::unique_ptr<const ComponentDescriptor>;

  /*
   * `Flavor` is a special concept designed to allow registering instances of
   * the exact same `ComponentDescriptor` class with different `ComponentName`
   * and `ComponentHandle` (the particular custom implementation might use
   * stored `flavor` to return different values from those virtual methods).
   * Since it's a very niche requirement (e.g. we plan to use it for
   * an interoperability layer with old renderer), we are thinking about
   * removing this feature completely after it's no longer needed.
   */
  using Flavor = std::shared_ptr<const void>;

  explicit ComponentDescriptor(
      const ComponentDescriptorParameters& parameters,
      RawPropsParser&& rawPropsParser = {});

  virtual ~ComponentDescriptor() = default;

  /*
   * Returns stored instance of `ContextContainer`.
   */
  const std::shared_ptr<const ContextContainer>& getContextContainer() const;

  /*
   * Returns `componentHandle` associated with particular kind of components.
   * All `ShadowNode`s of this type must return same `componentHandle`.
   */
  virtual ComponentHandle getComponentHandle() const = 0;

  /*
   * Returns component's name.
   * React uses a `name` to refer to particular kind of components in
   * `create` requests.
   */
  virtual ComponentName getComponentName() const = 0;

  /*
   * Returns traits associated with a particular component type.
   */
  virtual ShadowNodeTraits getTraits() const = 0;

  /*
   * Creates a new `ShadowNode` of a particular component type.
   */
  virtual std::shared_ptr<ShadowNode> createShadowNode(
      const ShadowNodeFragment& fragment,
      const ShadowNodeFamily::Shared& family) const = 0;

  /*
   * Clones a `ShadowNode` with optionally new `props` and/or `children`.
   */
  virtual std::shared_ptr<ShadowNode> cloneShadowNode(
      const ShadowNode& sourceShadowNode,
      const ShadowNodeFragment& fragment) const = 0;

  /*
   * Appends (by mutating) a given `childShadowNode` to `parentShadowNode`.
   */
  virtual void appendChild(
      const std::shared_ptr<const ShadowNode>& parentShadowNode,
      const std::shared_ptr<const ShadowNode>& childShadowNode) const = 0;

  /*
   * Creates a new `Props` of a particular type with all values copied from
   * `props` and `rawProps` applied on top of this.
   * If `props` is `nullptr`, a default `Props` object (with default values)
   * will be used.
   * Must return an object which is NOT pointer equal to `props`.
   */
  virtual Props::Shared cloneProps(
      const PropsParserContext& context,
      const Props::Shared& props,
      RawProps rawProps) const = 0;

  /*
   * Create an initial State object that represents (and contains) an initial
   * State's data which can be constructed based on initial Props.
   */
  virtual State::Shared createInitialState(
      const Props::Shared& props,
      const ShadowNodeFamily::Shared& family) const = 0;

  /*
   * Creates a new State object that represents (and contains) a new version of
   * State's data.
   */
  virtual State::Shared createState(
      const ShadowNodeFamily& family,
      const StateData::Shared& data) const = 0;

  /*
   * Creates a shadow node family for particular node.
   */
  virtual ShadowNodeFamily::Shared createFamily(
      const ShadowNodeFamilyFragment& fragment) const = 0;

 protected:
  friend ShadowNode;

  EventDispatcher::Weak eventDispatcher_;
  std::shared_ptr<const ContextContainer> contextContainer_;
  Flavor flavor_;
  RawPropsParser rawPropsParser_;

  /*
   * Called immediately after `ShadowNode` is created, cloned or state is
   * progressed using clonesless state progression (not fully shipped yet).
   *
   * Override this method to pass information from custom `ComponentDescriptor`
   * to new instance of `ShadowNode`.
   *
   * Example usages:
   *   - Inject image manager to `ImageShadowNode` in
   * `ImageComponentDescriptor`.
   *   - Set `ShadowNode`'s size from state in
   * `ModalHostViewComponentDescriptor`.
   */
  virtual void adopt(ShadowNode& shadowNode) const = 0;
};

/*
 * Represents a collection of arguments that sufficient to construct a
 * `ComponentDescriptor`.
 */
class ComponentDescriptorParameters {
 public:
  EventDispatcher::Weak eventDispatcher;
  std::shared_ptr<const ContextContainer> contextContainer;
  ComponentDescriptor::Flavor flavor;
};

} // namespace facebook::react
