/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "KeyboardAvoidingViewShadowNode.h"

#include <algorithm>

namespace facebook::react {

// NOLINTNEXTLINE(modernize-avoid-c-arrays)
const char KeyboardAvoidingViewComponentName[] = "KeyboardAvoidingView";

KeyboardAvoidingViewState KeyboardAvoidingViewShadowNode::initialStateData(
    const Props::Shared& /*props*/,
    const ShadowNodeFamily::Shared& family,
    const ComponentDescriptor& componentDescriptor) {
  auto animationBackend =
      componentDescriptor.getContextContainer()
          ->find<std::weak_ptr<UIManagerAnimationBackend>>(AnimationBackendKey)
          .value_or(std::weak_ptr<UIManagerAnimationBackend>{});
  return {family, animationBackend};
}

void KeyboardAvoidingViewShadowNode::applyKeyboardInset() const {
  ensureUnsealed();

  const auto& props = getConcreteProps();
  if (!props.enabled || props.keyboardInset <= 0) {
    return;
  }

  auto inset =
      yoga::StyleLength::points(static_cast<float>(props.keyboardInset));
  auto style = yogaNode_.style();

  switch (props.behavior) {
    case KeyboardAvoidingViewBehavior::None:
      return;
    case KeyboardAvoidingViewBehavior::Height:
      style.setDimension(
          yoga::Dimension::Height,
          yoga::StyleSizeLength::points(
              std::max(
                  static_cast<float>(
                      props.keyboardRestingHeight - props.keyboardInset),
                  0.0f)));
      style.setFlex(yoga::FloatOptional(0));
      break;
    case KeyboardAvoidingViewBehavior::Padding:
      style.setPadding(yoga::Edge::Bottom, inset);
      break;
    case KeyboardAvoidingViewBehavior::Position:
      style.setPosition(yoga::Edge::Bottom, inset);
      break;
  }

  if (style != yogaNode_.style()) {
    yogaNode_.setStyle(style);
    yogaNode_.setDirty(true);
  }
}

} // namespace facebook::react
