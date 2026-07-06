/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/core/ConcreteState.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/core/ShadowNodeFamily.h>
#include <react/renderer/core/StateData.h>

namespace facebook::react {

/*
 * Base templace class for all `ShadowNode`s which connects exact `ShadowNode`
 * type with exact `Props` type.
 * `ConcreteShadowNode` is a default implementation of `ShadowNode` interface
 * with many handy features.
 */
template <
    ComponentName concreteComponentName,
    typename BaseShadowNodeT,
    typename PropsT,
    typename EventEmitterT = EventEmitter,
    typename StateDataT = StateData>
class ConcreteShadowNode : public BaseShadowNodeT {
  static_assert(
      std::is_base_of<ShadowNode, BaseShadowNodeT>::value,
      "BaseShadowNodeT must be a descendant of ShadowNode");
  static_assert(std::is_base_of<Props, PropsT>::value, "PropsT must be a descendant of Props");

 protected:
  using ShadowNode::props_;
  using ShadowNode::state_;

 public:
  using BaseShadowNodeT::BaseShadowNodeT;

  using ConcreteProps = PropsT;
  using SharedConcreteProps = std::shared_ptr<const PropsT>;
  using UnsharedConcreteProps = std::shared_ptr<PropsT>;
  using ConcreteEventEmitter = EventEmitterT;
  using SharedConcreteEventEmitter = std::shared_ptr<const EventEmitterT>;
  using SharedConcreteShadowNode = std::shared_ptr<const ConcreteShadowNode>;
  using ConcreteState = ConcreteState<StateDataT>;
  using ConcreteStateData = StateDataT;

  static ComponentName Name()
  {
    return ComponentName(concreteComponentName);
  }

  static ComponentHandle Handle()
  {
    return ComponentHandle(concreteComponentName);
  }

  /*
   * A set of traits associated with a particular class.
   * Reimplement in subclasses to declare class-specific traits.
   */
  static ShadowNodeTraits BaseTraits()
  {
    return BaseShadowNodeT::BaseTraits();
  }

  /*
   * Classic / parse path: construct `PropsT` by parsing `rawProps` field-by-
   * field via the 3-arg `(context, sourceProps, rawProps)` constructor.
   * `ConcreteComponentDescriptor::cloneProps` calls this when the
   * iterator-setter path is disabled (per-class via the
   * `HasIteratorSetterCtor` concept, or globally via the runtime flag).
   */
  static UnsharedConcreteProps
  Props(const PropsParserContext &context, const RawProps &rawProps, const Props::Shared &baseProps = nullptr)
  {
    return std::make_shared<PropsT>(
        context, baseProps ? static_cast<const PropsT &>(*baseProps) : *defaultSharedProps(), rawProps);
  }

  /*
   * Iterator-setter path: copy-construct `PropsT` from `baseProps` only.
   * `ConcreteComponentDescriptor::cloneProps` then walks `rawProps` via
   * `RawProps::forEachItem` and overwrites individual fields through
   * `PropsT::setProp`. Available when `PropsT` satisfies
   * `HasIteratorSetterCtor`.
   */
  static UnsharedConcreteProps Props(const Props::Shared &baseProps)
  {
    return std::make_shared<PropsT>(baseProps ? static_cast<const PropsT &>(*baseProps) : *defaultSharedProps());
  }

#ifdef RN_SERIALIZABLE_STATE
  static void initializeDynamicProps(
      UnsharedConcreteProps props,
      const RawProps &rawProps,
      const Props::Shared &baseProps = nullptr)
  {
    if (baseProps) {
      props->initializeDynamicProps(static_cast<const PropsT &>(*baseProps), rawProps);
    } else {
      props->initializeDynamicProps(*defaultSharedProps(), rawProps);
    }
  }
#endif

  static const SharedConcreteProps &defaultSharedProps()
  {
    static const SharedConcreteProps defaultSharedProps = std::make_shared<const PropsT>();
    return defaultSharedProps;
  }

  static ConcreteStateData initialStateData(
      const Props::Shared & /*props*/,
      const ShadowNodeFamily::Shared & /*family*/,
      const ComponentDescriptor & /*componentDescriptor*/)
  {
    return {};
  }

  /*
   * Returns a concrete props object associated with the node.
   * Thread-safe after the node is sealed.
   */
  const ConcreteProps &getConcreteProps() const
  {
    react_native_assert(BaseShadowNodeT::props_ && "Props must not be `nullptr`.");
    return static_cast<const ConcreteProps &>(*props_);
  }

  /*
   * Returns a concrete props object associated with the node, as a shared_ptr.
   * Thread-safe after the node is sealed.
   */
  const std::shared_ptr<const ConcreteProps> &getConcreteSharedProps() const
  {
    react_native_assert(BaseShadowNodeT::props_ && "Props must not be `nullptr`.");
    return std::static_pointer_cast<const ConcreteProps>(props_);
  }

  /*
   * Returns a concrete event emitter object associated with the node.
   * Thread-safe after the node is sealed.
   */
  const ConcreteEventEmitter &getConcreteEventEmitter() const
  {
    return static_cast<const ConcreteEventEmitter &>(*BaseShadowNodeT::getEventEmitter());
  }

  /*
   * Returns a concrete state data associated with the node.
   * Thread-safe after the node is sealed.
   */
  const ConcreteStateData &getStateData() const
  {
    react_native_assert(state_ && "State must not be `nullptr`.");
    return static_cast<const ConcreteState *>(state_.get())->getData();
  }

  /*
   * Creates and assigns a new state object containing given state data.
   * Can be called only before the node is sealed (usually during construction).
   */
  void setStateData(ConcreteStateData &&data)
  {
    Sealable::ensureUnsealed();
    state_ = std::make_shared<const ConcreteState>(std::make_shared<const ConcreteStateData>(std::move(data)), *state_);
  }
};

} // namespace facebook::react
