/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/view/HostPlatformViewTraitsInitializer.h>
#include <react/renderer/components/view/ViewEventEmitter.h>
#include <react/renderer/components/view/ViewProps.h>
#include <react/renderer/components/view/YogaLayoutableShadowNode.h>
#include <react/renderer/core/ConcreteShadowNode.h>
#include <react/renderer/core/ShadowNodeFragment.h>
#include <type_traits>

namespace facebook::react {

/*
 * Template for all <View>-like classes (classes which have all same props
 * as <View> and similar basic behaviour).
 * For example: <Paragraph>, <Image>, but not <Text>, <RawText>.
 */
template <
    const char *concreteComponentName,
    typename ViewPropsT = ViewProps,
    typename ViewEventEmitterT = ViewEventEmitter,
    typename StateDataT = StateData>
  requires(std::is_base_of_v<ViewProps, ViewPropsT>)
class ConcreteViewShadowNode : public ConcreteShadowNode<
                                   concreteComponentName,
                                   YogaLayoutableShadowNode,
                                   ViewPropsT,
                                   ViewEventEmitterT,
                                   StateDataT> {
  static_assert(std::is_base_of<ViewProps, ViewPropsT>::value, "ViewPropsT must be a descendant of ViewProps");
  static_assert(
      std::is_base_of<YogaStylableProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of YogaStylableProps");
  static_assert(
      std::is_base_of<AccessibilityProps, ViewPropsT>::value,
      "ViewPropsT must be a descendant of AccessibilityProps");

 public:
  using BaseShadowNode =
      ConcreteShadowNode<concreteComponentName, YogaLayoutableShadowNode, ViewPropsT, ViewEventEmitterT, StateDataT>;

  ConcreteViewShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits)
      : BaseShadowNode(fragment, family, traits)
  {
    initialize();
  }

  ConcreteViewShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
      : BaseShadowNode(sourceShadowNode, fragment)
  {
    initialize();
  }

  using ConcreteViewProps = ViewPropsT;

  using BaseShadowNode::BaseShadowNode;

  static ShadowNodeTraits BaseTraits()
  {
    auto traits = BaseShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::ViewKind);
    traits.set(ShadowNodeTraits::Trait::FormsStackingContext);
    traits.set(ShadowNodeTraits::Trait::FormsView);
    return traits;
  }

  Transform getTransform() const override
  {
    auto layoutMetrics = BaseShadowNode::getLayoutMetrics();
    return BaseShadowNode::getConcreteProps().resolveTransform(layoutMetrics);
  }

  bool canBeTouchTarget() const override
  {
    auto pointerEvents = BaseShadowNode::getConcreteProps().ViewProps::pointerEvents;
    return pointerEvents == PointerEventsMode::Auto || pointerEvents == PointerEventsMode::BoxOnly;
  }

  bool canChildrenBeTouchTarget() const override
  {
    auto pointerEvents = BaseShadowNode::getConcreteProps().ViewProps::pointerEvents;
    return pointerEvents == PointerEventsMode::Auto || pointerEvents == PointerEventsMode::BoxNone;
  }

 private:
  void initialize() noexcept
  {
    auto &props = BaseShadowNode::getConcreteProps();

    if (props.yogaStyle.display() == yoga::Display::None) {
      BaseShadowNode::traits_.set(ShadowNodeTraits::Trait::Hidden);
    } else {
      BaseShadowNode::traits_.unset(ShadowNodeTraits::Trait::Hidden);
    }

    // `zIndex` is only defined for non-`static` positioned views.
    if (props.yogaStyle.positionType() != yoga::PositionType::Static) {
      BaseShadowNode::orderIndex_ = props.zIndex.value_or(0);
    } else {
      BaseShadowNode::orderIndex_ = 0;
    }

    bool isKeyboardFocusable = HostPlatformViewTraitsInitializer::isKeyboardFocusable(props) || props.accessible;

    if (isKeyboardFocusable) {
      BaseShadowNode::traits_.set(ShadowNodeTraits::Trait::KeyboardFocusable);
    } else {
      BaseShadowNode::traits_.unset(ShadowNodeTraits::Trait::KeyboardFocusable);
    }
  }
};

} // namespace facebook::react
