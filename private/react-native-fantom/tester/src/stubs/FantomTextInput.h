/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/textinput/BaseTextInputProps.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/core/propsConversions.h>
#include "../render/TextLayout.h"

namespace facebook::react {

class FantomTextInputProps : public BaseTextInputProps {
 public:
  FantomTextInputProps() = default;
  FantomTextInputProps(const PropsParserContext &context, const FantomTextInputProps &source, const RawProps &raw)
      : BaseTextInputProps(context, source, raw),
        secureTextEntry(convertRawProp(context, raw, "secureTextEntry", source.secureTextEntry, false))
  {
  }
  bool secureTextEntry{};
};

// NOLINTNEXTLINE(facebook-hte-CArray, modernize-avoid-c-arrays)
inline constexpr char FantomAndroidTextInputName[] = "AndroidTextInput";
// NOLINTNEXTLINE(facebook-hte-CArray, modernize-avoid-c-arrays)
inline constexpr char FantomSinglelineTextInputName[] = "RCTSinglelineTextInputView";
// NOLINTNEXTLINE(facebook-hte-CArray, modernize-avoid-c-arrays)
inline constexpr char FantomMultilineTextInputName[] = "RCTMultilineTextInputView";

template <const char *Name>
class FantomTextInputShadowNode : public ConcreteViewShadowNode<Name, FantomTextInputProps, ViewEventEmitter> {
 public:
  using Base = ConcreteViewShadowNode<Name, FantomTextInputProps, ViewEventEmitter>;
  using Base::Base;
  static ShadowNodeTraits BaseTraits()
  {
    auto traits = Base::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    return traits;
  }
  std::shared_ptr<const TextLayoutManager> textLayoutManager;

 protected:
  Size measureContent(const LayoutContext &context, const LayoutConstraints &constraints) const override
  {
    const auto &props = this->getConcreteProps();
    AttributedString text;
    text.appendFragment(
        {.string = props.text.empty() ? props.placeholder : props.text,
         .textAttributes = props.getEffectiveTextAttributes(context.fontSizeMultiplier),
         .parentShadowView = {}});
    auto paragraph = props.paragraphAttributes;
    if (!props.multiline) {
      paragraph.maximumNumberOfLines = 1;
    }
    return textLayoutManager
        ->measure(
            AttributedStringBox{text},
            paragraph,
            {.pointScaleFactor = context.pointScaleFactor, .surfaceId = this->getSurfaceId()},
            constraints)
        .size;
  }
};

template <const char *Name>
class FantomTextInputComponentDescriptor : public ConcreteComponentDescriptor<FantomTextInputShadowNode<Name>> {
 public:
  using Base = ConcreteComponentDescriptor<FantomTextInputShadowNode<Name>>;
  using Base::Base;

 protected:
  void adopt(ShadowNode &node) const override
  {
    Base::adopt(node);
    static_cast<FantomTextInputShadowNode<Name> &>(node).textLayoutManager =
        this->contextContainer_->template at<std::shared_ptr<TextLayoutManager>>("TextLayoutManager");
  }
};

} // namespace facebook::react
