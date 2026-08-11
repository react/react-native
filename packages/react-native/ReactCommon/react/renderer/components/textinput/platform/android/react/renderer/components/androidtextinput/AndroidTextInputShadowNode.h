/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "AndroidTextInputEventEmitter.h"
#include "AndroidTextInputProps.h"
#include "AndroidTextInputState.h"

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

extern const char AndroidTextInputComponentName[];

/*
 * `ShadowNode` for <AndroidTextInput> component.
 */
class AndroidTextInputShadowNode final : public ConcreteViewShadowNode<
                                             AndroidTextInputComponentName,
                                             AndroidTextInputProps,
                                             AndroidTextInputEventEmitter,
                                             AndroidTextInputState> {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  static ShadowNodeTraits BaseTraits() {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    traits.set(ShadowNodeTraits::Trait::BaselineYogaNode);
    return traits;
  }

  /*
   * Associates a shared TextLayoutManager with the node.
   * `TextInputShadowNode` uses the manager to measure text content
   * and construct `TextInputState` objects.
   */
  void setTextLayoutManager(
      std::shared_ptr<const TextLayoutManager> textLayoutManager);

 protected:
  Size measureContent(
      const LayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const override;

  void layout(LayoutContext layoutContext) override;

  Float baseline(const LayoutContext& layoutContext, Size size) const override;

  std::shared_ptr<const TextLayoutManager> textLayoutManager_;

  /*
   * Determines the constraints to use while measure the underlying text
   */
  LayoutConstraints getTextConstraints(
      const LayoutConstraints& layoutConstraints) const;

 private:
  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded(const LayoutContext& layoutContext);

  /*
   * Returns a `AttributedString` which represents text content of the node.
   */
  AttributedString getAttributedString(
      const LayoutContext& layoutContext) const;

  /**
   * Get the most up-to-date attributed string for measurement and State.
   */
  AttributedString getMostRecentAttributedString(
      const LayoutContext& layoutContext) const;

  AttributedString getPlaceholderAttributedString(
      const LayoutContext& layoutContext) const;
};

} // namespace facebook::react
