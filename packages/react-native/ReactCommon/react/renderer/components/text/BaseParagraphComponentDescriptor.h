/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/utils/ContextContainer.h>

namespace facebook::react {

constexpr const char *const TextLayoutManagerKey = "TextLayoutManager";

template <typename ShadowNodeT>
class BaseParagraphComponentDescriptor : public ConcreteComponentDescriptor<ShadowNodeT> {
 public:
  explicit BaseParagraphComponentDescriptor(const ComponentDescriptorParameters &parameters)
      : ConcreteComponentDescriptor<ShadowNodeT>(parameters),
        textLayoutManager_(getManagerByName<TextLayoutManager>(this->contextContainer_, TextLayoutManagerKey))
  {
  }

  ComponentName getComponentName() const override
  {
    return ShadowNodeT::Name();
  }

 protected:
  void adopt(ShadowNode &shadowNode) const override
  {
    ConcreteComponentDescriptor<ShadowNodeT>::adopt(shadowNode);

    auto &paragraphShadowNode = static_cast<ShadowNodeT &>(shadowNode);

    // `ParagraphShadowNode` uses `TextLayoutManager` to measure text content
    // and communicate text rendering metrics to mounting layer.
    paragraphShadowNode.setTextLayoutManager(textLayoutManager_);
  }

 private:
  // Every `ParagraphShadowNode` has a reference to a shared `TextLayoutManager`
  const std::shared_ptr<const TextLayoutManager> textLayoutManager_;
};

} // namespace facebook::react
