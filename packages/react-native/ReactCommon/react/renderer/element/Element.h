/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <memory>

#include <react/renderer/core/ShadowNode.h>

#include <react/renderer/element/ElementFragment.h>

namespace facebook::react {

/*
 * `Element<>` is an abstraction layer that allows describing component
 * hierarchy in a declarative way. Creating `Element`s themself does not create
 * a component tree (aka `ShadowNode` tree) but describes some hierarchical
 * structure that might be used to build an actual component tree (similar to
 * XML Elements).
 * `Element` provides some basic type-safety guarantees: all modifications
 * of element objects require using objects (such as Props or State) of
 * compatible type.
 */
template <typename ShadowNodeT>
class Element final {
 public:
  using ConcreteProps = typename ShadowNodeT::ConcreteProps;
  using SharedConcreteProps = std::shared_ptr<const ConcreteProps>;
  using ConcreteState = typename ShadowNodeT::ConcreteState;
  using ConcreteStateData = typename ShadowNodeT::ConcreteStateData;
  using SharedConcreteState = std::shared_ptr<const ConcreteState>;
  using ConcreteShadowNode = ShadowNodeT;
  using ConcreteUnsharedShadowNode = std::shared_ptr<ConcreteShadowNode>;

  using ConcreteReferenceCallback =
      std::function<void(const std::shared_ptr<const ShadowNodeT>& shadowNode)>;

  /*
   * Constructs an `Element`.
   */
  Element() {
    fragment_.componentHandle = ShadowNodeT::Handle();
    fragment_.componentName = ShadowNodeT::Name();
    fragment_.props = ShadowNodeT::defaultSharedProps();
  }

  /*
   * Converts to `ElementFragment` object.
   */
  operator ElementFragment() {
    return fragment_;
  }

  /*
   * Sets `tag`.
   */
  Element& tag(Tag tag) {
    fragment_.tag = tag;
    return *this;
  }

  /*
   * Sets `surfaceId`.
   */
  Element& surfaceId(SurfaceId surfaceId) {
    fragment_.surfaceId = surfaceId;
    return *this;
  }

  /*
   * Sets `props`.
   */
  Element& props(SharedConcreteProps props) {
    fragment_.props = props;
    return *this;
  }

  /*
   * Sets `props` using callback.
   */
  Element& props(std::function<SharedConcreteProps()> callback) {
    fragment_.props = callback();
    return *this;
  }

  /*
   * Sets `state` using callback.
   */
  Element& stateData(std::function<void(ConcreteStateData&)> callback) {
    fragment_.stateCallback =
        [callback = std::move(callback)](
            const State::Shared& state) -> StateData::Shared {
      auto stateData =
          static_cast<const ConcreteState*>(state.get())->getData();
      callback(stateData);
      return std::make_shared<ConcreteStateData>(stateData);
    };
    return *this;
  }

  /*
   * Sets children.
   */
  Element& children(std::vector<ElementFragment> children) {
    auto fragments = ElementFragment::List{};
    fragments.reserve(children.size());
    for (const auto& child : children) {
      fragments.push_back(child);
    }
    fragment_.children = fragments;
    return *this;
  }

  /*
   * Calls the callback during component construction with a pointer to the
   * component which is being constructed.
   */
  Element& reference(
      std::function<void(const ConcreteUnsharedShadowNode& shadowNode)>
          callback) {
    fragment_.referenceCallback =
        [callback = std::move(callback)](
            const std::shared_ptr<const ShadowNode>& shadowNode) {
          callback(std::const_pointer_cast<ConcreteShadowNode>(
              std::static_pointer_cast<const ConcreteShadowNode>(shadowNode)));
        };
    return *this;
  }

  /*
   * During component construction, assigns a given pointer to a component
   * that is being constructed.
   */
  Element& reference(ConcreteUnsharedShadowNode& outShadowNode) {
    fragment_.referenceCallback =
        [&](const std::shared_ptr<const ShadowNode>& shadowNode) {
          outShadowNode = std::const_pointer_cast<ConcreteShadowNode>(
              std::static_pointer_cast<const ConcreteShadowNode>(shadowNode));
        };
    return *this;
  }

  /*
   * Calls the callback with a reference to a just constructed component.
   */
  Element& finalize(
      std::function<void(ConcreteShadowNode& shadowNode)> finalizeCallback) {
    fragment_.finalizeCallback = [=](ShadowNode& shadowNode) {
      return finalizeCallback(static_cast<ConcreteShadowNode&>(shadowNode));
    };
    return *this;
  }

 private:
  friend class ComponentBuilder;
  ElementFragment fragment_;
};

} // namespace facebook::react
