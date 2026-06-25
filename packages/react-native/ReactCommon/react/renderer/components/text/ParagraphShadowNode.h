/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/text/BaseTextShadowNode.h>
#include <react/renderer/components/text/ParagraphEventEmitter.h>
#include <react/renderer/components/text/ParagraphProps.h>
#include <react/renderer/components/text/ParagraphState.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNode.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextLayoutManagerExtended.h>

namespace facebook::react {

extern const char ParagraphComponentName[];

/*
 * `ShadowNode` for <Paragraph> component, represents <View>-like component
 * containing and displaying text. Text content is represented as nested <Text>
 * and <RawText> components.
 */
class ParagraphShadowNode
    : public ConcreteViewShadowNode<ParagraphComponentName, ParagraphProps, ParagraphEventEmitter, ParagraphState>,
      public BaseTextShadowNode {
 public:
  using ConcreteViewShadowNode::ConcreteViewShadowNode;

  ParagraphShadowNode(
      const ShadowNodeFragment &fragment,
      const ShadowNodeFamily::Shared &family,
      ShadowNodeTraits traits);

  ParagraphShadowNode(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment);

  static ShadowNodeTraits BaseTraits()
  {
    auto traits = ConcreteViewShadowNode::BaseTraits();
    traits.set(ShadowNodeTraits::Trait::LeafYogaNode);
    traits.set(ShadowNodeTraits::Trait::MeasurableYogaNode);
    traits.set(ShadowNodeTraits::Trait::BaselineYogaNode);

#ifdef ANDROID
    // Unsetting `FormsStackingContext` trait is essential on Android where we
    // can't mount views inside `TextView`.
    // T221699219: This should be removed when PreparedLayoutTextView is rolled
    // out.
    traits.unset(ShadowNodeTraits::Trait::FormsStackingContext);
#endif

    return traits;
  }

  /*
   * Associates a shared TextLayoutManager with the node.
   * `ParagraphShadowNode` uses the manager to measure text content
   * and construct `ParagraphState` objects.
   */
  void setTextLayoutManager(std::shared_ptr<const TextLayoutManager> textLayoutManager);

#pragma mark - LayoutableShadowNode

  void layout(LayoutContext layoutContext) override;

  Size measureContent(const LayoutContext &layoutContext, const LayoutConstraints &layoutConstraints) const override;

  Float baseline(const LayoutContext &layoutContext, Size size) const override;

  /*
   * Internal representation of the nested content of the node in a format
   * suitable for future processing.
   */
  class Content final {
   public:
    AttributedString attributedString;
    ParagraphAttributes paragraphAttributes;
    Attachments attachments;
  };

 protected:
  bool shouldNewRevisionDirtyMeasurement(const ShadowNode &sourceShadowNode, const ShadowNodeFragment &fragment)
      const override;

 private:
  void initialize() noexcept;
  /*
   * Builds (if needed) and returns a reference to a `Content` object.
   */
  const Content &getContent(const LayoutContext &layoutContext) const;

  /*
   * Builds and returns a `Content` object with given `layoutConstraints`.
   */
  Content getContentWithMeasuredAttachments(
      const LayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const;

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  template <typename ParagraphStateT>
  void updateStateIfNeeded(const Content &content, const MeasuredPreparedTextLayout &layout);

  /*
   * Creates a `State` object (with `AttributedText` and
   * `TextLayoutManager`) if needed.
   */
  void updateStateIfNeeded(const Content &content);

  /**
   * Returns any previously prepared layout, generated for measurement, which
   * may be used, given the currently assigned layout to the ShadowNode
   */
  MeasuredPreparedTextLayout *findUsableLayout();

  /**
   * Returns the final measure of the content frame, before layout rounding
   */
  Size rawContentSize();

  std::shared_ptr<const TextLayoutManager> textLayoutManager_;

  /*
   * Cached content of the subtree started from the node.
   */
  mutable std::optional<Content> content_{};

  /*
   * Intermediate layout results generated during measurement, that may be
   * reused by the platform.
   */
  mutable std::vector<MeasuredPreparedTextLayout> measuredLayouts_;
};

} // namespace facebook::react
