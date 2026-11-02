/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ParagraphShadowNode.h"

#include <cmath>

#include <react/debug/react_native_assert.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/components/view/ViewShadowNode.h>
#include <react/renderer/components/view/conversions.h>
#include <react/renderer/graphics/rounding.h>
#include <react/renderer/telemetry/TransactionTelemetry.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/utils/FloatComparison.h>

#include <react/renderer/components/text/ParagraphState.h>

#define assert_valid_size(size, layoutConstraints)  \
  react_native_assert(                              \
      (size).width + kDefaultEpsilon >=             \
          (layoutConstraints).minimumSize.width &&  \
      (size).width - kDefaultEpsilon <=             \
          (layoutConstraints).maximumSize.width &&  \
      (size).height + kDefaultEpsilon >=            \
          (layoutConstraints).minimumSize.height && \
      (size).height - kDefaultEpsilon <=            \
          (layoutConstraints).maximumSize.height)

namespace facebook::react {
using Content = ParagraphShadowNode::Content;

// NOLINTNEXTLINE(facebook-hte-CArray, modernize-avoid-c-arrays)
const char ParagraphComponentName[] = "Paragraph";

void ParagraphShadowNode::initialize() noexcept {
#ifdef ANDROID
  if (getConcreteProps().isSelectable) {
    traits_.set(ShadowNodeTraits::Trait::KeyboardFocusable);
  }
#endif
}

ParagraphShadowNode::ParagraphShadowNode(
    const ShadowNodeFragment& fragment,
    const ShadowNodeFamily::Shared& family,
    ShadowNodeTraits traits)
    : ConcreteViewShadowNode(fragment, family, traits) {
  initialize();
}

ParagraphShadowNode::ParagraphShadowNode(
    const ShadowNode& sourceShadowNode,
    const ShadowNodeFragment& fragment)
    : ConcreteViewShadowNode(sourceShadowNode, fragment) {
  initialize();
  // A revision with neither new props nor new children (e.g. one Yoga cloned
  // because a sibling changed) renders the same content, so keep the
  // attributed string and the layouts measured for it instead of rebuilding
  // and re-measuring them. `getContent` drops both if the layout context they
  // were built for no longer matches.
  //
  // Content with attachments is not kept: they point at the children the
  // content was built from, and `layout` replaces those children with laid-out
  // clones, so in a later revision the pointers would outlive the nodes.
  if (fragment.props == nullptr && fragment.children == nullptr) {
    const auto& source =
        static_cast<const ParagraphShadowNode&>(sourceShadowNode);
    if (source.content_.has_value() && source.content_->attachments.empty()) {
      content_ = source.content_;
      // A layout is later matched by its measured size alone (see
      // `findUsableLayout`). Text that fits its font size to the constraints
      // can measure the same under different constraints with a different
      // font size, so its layouts are not kept.
      //
      // Only the layout the source used is kept (`layout` drops the others).
      // Every layout holds a JNI global reference on Android, so carrying all
      // of them would let them pile up across revisions when only the
      // constraints change, until the global reference table overflows.
      if (!source.content_->paragraphAttributes.adjustsFontSizeToFit &&
          !source.measuredLayouts_.empty()) {
        measuredLayouts_.push_back(source.measuredLayouts_.back());
      }
    }
  }
}

bool ParagraphShadowNode::shouldNewRevisionDirtyMeasurement(
    const ShadowNode& /*sourceShadowNode*/,
    const ShadowNodeFragment& fragment) const {
  return fragment.props != nullptr;
}

LayoutDirection ParagraphShadowNode::resolvedLayoutDirection() const {
  return YGNodeLayoutGetDirection(&yogaNode_) == YGDirectionRTL
      ? LayoutDirection::RightToLeft
      : LayoutDirection::LeftToRight;
}

void ParagraphShadowNode::dropContentBuiltForAnotherContext(
    const LayoutContext& layoutContext) const {
  if (!content_.has_value()) {
    return;
  }
  const auto& baseTextAttributes =
      content_->attributedString.getBaseTextAttributes();
  // The content is built from this node's props and children, and it is only
  // carried over to revisions that have neither new props nor new children
  // (see the copy constructor). The only other inputs are the font size
  // multiplier from the layout context and the layout direction Yoga resolves
  // from the parent, and those can change without new props or children, so
  // they are the two things to check here.
  if (baseTextAttributes.fontSizeMultiplier !=
          layoutContext.fontSizeMultiplier ||
      baseTextAttributes.layoutDirection != resolvedLayoutDirection()) {
    content_.reset();
    measuredLayouts_.clear();
  }
}

const Content& ParagraphShadowNode::getContent(
    const LayoutContext& layoutContext) const {
  dropContentBuiltForAnotherContext(layoutContext);
  if (content_.has_value()) {
    return content_.value();
  }

  ensureUnsealed();

  auto textAttributes = TextAttributes::defaultTextAttributes();
  textAttributes.fontSizeMultiplier = layoutContext.fontSizeMultiplier;
  textAttributes.apply(getConcreteProps().textAttributes);
  textAttributes.layoutDirection = resolvedLayoutDirection();
  auto attributedString = AttributedString{};
  auto attachments = Attachments{};
  buildAttributedString(textAttributes, *this, attributedString, attachments);
  attributedString.setBaseTextAttributes(textAttributes);

  content_ = Content{
      .attributedString = std::move(attributedString),
      .paragraphAttributes = getConcreteProps().paragraphAttributes,
      .attachments = std::move(attachments)};

  return content_.value();
}

Content ParagraphShadowNode::getContentWithMeasuredAttachments(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  auto content = getContent(layoutContext);

  if (content.attachments.empty()) {
    // Base case: No attachments, nothing to do.
    return content;
  }

  auto localLayoutConstraints = layoutConstraints;
  // Having enforced minimum size for text fragments doesn't make much sense.
  localLayoutConstraints.minimumSize = Size{0, 0};

  auto& fragments = content.attributedString.getFragments();

  for (const auto& attachment : content.attachments) {
    auto laytableShadowNode =
        dynamic_cast<const LayoutableShadowNode*>(attachment.shadowNode);

    if (laytableShadowNode == nullptr) {
      continue;
    }

    auto size =
        laytableShadowNode->measure(layoutContext, localLayoutConstraints);

    // Rounding to *next* value on the pixel grid.
    size.width += 0.01f;
    size.height += 0.01f;
    size = roundToPixel<&ceil>(size, layoutContext.pointScaleFactor);

    auto fragmentLayoutMetrics = LayoutMetrics{};
    fragmentLayoutMetrics.pointScaleFactor = layoutContext.pointScaleFactor;
    fragmentLayoutMetrics.frame.size = size;
    fragments[attachment.fragmentIndex].parentShadowView.layoutMetrics =
        fragmentLayoutMetrics;
  }

  return content;
}

void ParagraphShadowNode::setTextLayoutManager(
    std::shared_ptr<const TextLayoutManager> textLayoutManager) {
  ensureUnsealed();
  textLayoutManager_ = std::move(textLayoutManager);
}

template <typename ParagraphStateT>
void ParagraphShadowNode::updateStateIfNeeded(
    const Content& content,
    const MeasuredPreparedTextLayout& layout) {
  ensureUnsealed();

  auto& state = static_cast<const ParagraphStateT&>(getStateData());

  react_native_assert(textLayoutManager_);

  bool pointScaleFactorChanged =
      ReactNativeFeatureFlags::fixTextLayoutOnPixelDensityChange() &&
      state.measuredLayout.pointScaleFactor != layout.pointScaleFactor;

  if (!pointScaleFactorChanged &&
      state.measuredLayout.measurement.size == layout.measurement.size &&
      state.attributedString == content.attributedString &&
      state.paragraphAttributes == content.paragraphAttributes) {
    return;
  }

  setStateData(
      ParagraphStateT{
          content.attributedString,
          content.paragraphAttributes,
          textLayoutManager_,
          layout});
}

void ParagraphShadowNode::updateStateIfNeeded(const Content& content) {
  ensureUnsealed();

  auto& state = getStateData();

  react_native_assert(textLayoutManager_);
#ifdef ANDROID
  if (state.attributedString == content.attributedString) {
    return;
  }

  setStateData(
      ParagraphState{
          content.attributedString,
          content.paragraphAttributes,
          textLayoutManager_});
#else
  auto layoutSize = getLayoutMetrics().getContentFrame().size;
  if (state.attributedString == content.attributedString &&
      state.layoutSize == layoutSize) {
    return;
  }

  setStateData(
      ParagraphState{
          .attributedString = content.attributedString,
          .paragraphAttributes = content.paragraphAttributes,
          .layoutManager = textLayoutManager_,
          .layoutSize = layoutSize});
#endif
}

const MeasuredPreparedTextLayout* ParagraphShadowNode::findUsableLayout(
    Float pointScaleFactor) {
  const MeasuredPreparedTextLayout* ret = nullptr;

  if constexpr (TextLayoutManagerExtended::supportsPreparedTextLayout()) {
    // We consider the layout to be reusable, if our content measurement,
    // combined with padding/border (not snapped) exactly corresponds to the
    // measurement of the node, before layout rounding. We may not find a
    // compatible layout, such as if Yoga already knew the dimensions (an
    // exact width/height was given), or if our content measurement was
    // adjusted by a constraint (like min-size).
    auto expectedSize = rawContentSize();
    // Newest first, so that a layout measured for this revision wins over an
    // equally sized one carried over from a previous revision.
    for (auto it = measuredLayouts_.rbegin(); it != measuredLayouts_.rend();
         ++it) {
      const auto& prevLayout = **it;
      if (prevLayout.pointScaleFactor == pointScaleFactor &&
          floatEquality(
              prevLayout.measurement.size.width, expectedSize.width) &&
          floatEquality(
              prevLayout.measurement.size.height, expectedSize.height)) {
        ret = &prevLayout;
        break;
      }
    }
  }

  return ret;
}

Size ParagraphShadowNode::rawContentSize() {
  return Size{
      .width = YGNodeLayoutGetRawWidth(&yogaNode_) -
          layoutMetrics_.contentInsets.left -
          layoutMetrics_.contentInsets.right,
      .height = YGNodeLayoutGetRawHeight(&yogaNode_) -
          layoutMetrics_.contentInsets.top -
          layoutMetrics_.contentInsets.bottom};
}

#pragma mark - LayoutableShadowNode

Size ParagraphShadowNode::measureContent(
    const LayoutContext& layoutContext,
    const LayoutConstraints& layoutConstraints) const {
  // Layouts carried over from a previous revision were prepared for its
  // content, so drop them first if that content no longer applies.
  dropContentBuiltForAnotherContext(layoutContext);

  if constexpr (TextLayoutManagerExtended::supportsPreparedTextLayout()) {
    // Layouts carried over from a previous revision may have been prepared
    // at another pixel density, which they can't be reused for.
    for (const auto& layout : measuredLayouts_) {
      if (layout->layoutConstraints == layoutConstraints &&
          layout->pointScaleFactor == layoutContext.pointScaleFactor) {
        return layout->measurement.size;
      }
    }
  }

  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);

  TextLayoutContext textLayoutContext{
      .pointScaleFactor = layoutContext.pointScaleFactor,
      .surfaceId = getSurfaceId(),
  };

  if constexpr (TextLayoutManagerExtended::supportsPreparedTextLayout()) {
    if (ReactNativeFeatureFlags::enablePreparedTextLayout()) {
      TextLayoutManagerExtended tme(*textLayoutManager_);

      auto preparedLayout = tme.prepareLayout(
          content.attributedString,
          content.paragraphAttributes,
          textLayoutContext,
          layoutConstraints);
      auto measurement = tme.measurePreparedLayout(
          preparedLayout, textLayoutContext, layoutConstraints);

      measuredLayouts_.push_back(
          std::make_shared<const MeasuredPreparedTextLayout>(
              MeasuredPreparedTextLayout{
                  .layoutConstraints = layoutConstraints,
                  .pointScaleFactor = layoutContext.pointScaleFactor,
                  .measurement = measurement,
                  // PreparedTextLayout is not trivially copyable on all
                  // platforms
                  // NOLINTNEXTLINE(performance-move-const-arg)
                  .preparedTextLayout = std::move(preparedLayout)}));
      assert_valid_size(measurement.size, layoutConstraints);
      return measurement.size;
    }
  }

  auto size = textLayoutManager_
                  ->measure(
                      AttributedStringBox{std::move(content.attributedString)},
                      content.paragraphAttributes,
                      textLayoutContext,
                      layoutConstraints)
                  .size;
  assert_valid_size(size, layoutConstraints);
  return size;
}

Float ParagraphShadowNode::baseline(
    const LayoutContext& layoutContext,
    Size size) const {
  auto layoutMetrics = getLayoutMetrics();
  auto layoutConstraints =
      LayoutConstraints{size, size, layoutMetrics.layoutDirection};
  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);

  AttributedStringBox attributedStringBox{std::move(content.attributedString)};

  if constexpr (TextLayoutManagerExtended::supportsLineMeasurement()) {
    auto lines =
        TextLayoutManagerExtended(*textLayoutManager_)
            .measureLines(
                attributedStringBox, content.paragraphAttributes, size);
    return LineMeasurement::baseline(lines);
  } else {
    LOG(WARNING)
        << "Baseline alignment is not supported by the current platform";
    return 0;
  }
}

void ParagraphShadowNode::layout(LayoutContext layoutContext) {
  ensureUnsealed();

  auto layoutMetrics = getLayoutMetrics();

  auto size = ReactNativeFeatureFlags::enablePreparedTextLayout()
      ? rawContentSize()
      : layoutMetrics.getContentFrame().size;

  LayoutConstraints layoutConstraints{
      .minimumSize = size,
      .maximumSize = size,
      .layoutDirection = layoutMetrics.layoutDirection};
  auto content =
      getContentWithMeasuredAttachments(layoutContext, layoutConstraints);

  auto measuredLayout = findUsableLayout(layoutContext.pointScaleFactor);

  if constexpr (
      TextLayoutManagerExtended::supportsPreparedTextLayout() &&
      std::is_constructible_v<
          ParagraphState,
          decltype(content.attributedString),
          decltype(content.paragraphAttributes),
          decltype(textLayoutManager_),
          decltype(*measuredLayout)>) {
    if (ReactNativeFeatureFlags::enablePreparedTextLayout()) {
      // We may not have a reusable layout, like if Yoga knew exact dimensions
      // for the paragraph. Measure now, if this is the case.
      // T223634461: This would ideally happen lazily, in case the view may be
      // culled
      if (measuredLayout == nullptr) {
        measureContent(layoutContext, layoutConstraints);
        measuredLayout = findUsableLayout(layoutContext.pointScaleFactor);
      }
      react_native_assert(measuredLayout);
      updateStateIfNeeded<ParagraphState>(content, *measuredLayout);

      // Only this layout can be reused by a later revision (see the copy
      // constructor), so drop the others measured for this one.
      std::erase_if(measuredLayouts_, [&](const auto& layout) {
        return layout.get() != measuredLayout;
      });

    } else if (ReactNativeFeatureFlags::fixTextLayoutOnPixelDensityChange()) {
      MeasuredPreparedTextLayout unpreparedLayout;
      unpreparedLayout.pointScaleFactor = layoutContext.pointScaleFactor;
      updateStateIfNeeded<ParagraphState>(content, unpreparedLayout);
    } else {
      updateStateIfNeeded(content);
    }
  } else {
    updateStateIfNeeded(content);
  }

  TextLayoutContext textLayoutContext{
      .pointScaleFactor = layoutContext.pointScaleFactor,
      .surfaceId = getSurfaceId(),
  };
  // The state update above already captured the attributed string and
  // nothing below reads it, so the box can take it instead of copying it.
  AttributedStringBox attributedStringBox{std::move(content.attributedString)};

  if (getConcreteProps().onTextLayout) {
    if constexpr (TextLayoutManagerExtended::supportsLineMeasurement()) {
      auto linesMeasurements =
          TextLayoutManagerExtended(*textLayoutManager_)
              .measureLines(
                  attributedStringBox, content.paragraphAttributes, size);
      getConcreteEventEmitter().onTextLayout(linesMeasurements);
    } else {
      LOG(WARNING) << "onTextLayout is not supported by the current platform";
    }
  }

  if (content.attachments.empty()) {
    // No attachments to layout.
    return;
  }

  // Only measure if attachments are not empty.
  auto measurement = (measuredLayout != nullptr)
      ? measuredLayout->measurement
      : textLayoutManager_->measure(
            attributedStringBox,
            content.paragraphAttributes,
            textLayoutContext,
            layoutConstraints);

  //  Iterating on attachments, we clone shadow nodes and moving
  //  `paragraphShadowNode` that represents clones of `this` object.
  auto paragraphShadowNode = static_cast<ParagraphShadowNode*>(this);
  // `paragraphOwningShadowNode` is owning pointer to`paragraphShadowNode`
  // (besides the initial case when `paragraphShadowNode == this`), we need
  // this only to keep it in memory for a while.
  auto paragraphOwningShadowNode = std::shared_ptr<ShadowNode>{};

  react_native_assert(
      content.attachments.size() == measurement.attachments.size());

  for (size_t i = 0; i < content.attachments.size(); i++) {
    auto& attachment = content.attachments.at(i);

    if (dynamic_cast<const LayoutableShadowNode*>(attachment.shadowNode) ==
        nullptr) {
      // Not a layoutable `ShadowNode`, no need to lay it out.
      continue;
    }

    auto clonedShadowNode = std::shared_ptr<ShadowNode>{};

    paragraphOwningShadowNode = paragraphShadowNode->cloneTree(
        attachment.shadowNode->getFamily(),
        [&](const ShadowNode& oldShadowNode) {
          clonedShadowNode = oldShadowNode.clone({});
          return clonedShadowNode;
        });
    paragraphShadowNode =
        static_cast<ParagraphShadowNode*>(paragraphOwningShadowNode.get());

    auto& layoutableShadowNode =
        dynamic_cast<LayoutableShadowNode&>(*clonedShadowNode);
    const auto& attachmentMeasurement = measurement.attachments[i];
    if (attachmentMeasurement.isClipped) {
      layoutableShadowNode.setLayoutMetrics(
          LayoutMetrics{.frame = {}, .displayType = DisplayType::None});
      continue;
    }

    auto attachmentFrame = attachmentMeasurement.frame;
    attachmentFrame.origin.x += layoutMetrics.contentInsets.left;
    attachmentFrame.origin.y += layoutMetrics.contentInsets.top;

    auto attachmentSize = roundToPixel<&ceil>(
        attachmentFrame.size, layoutMetrics.pointScaleFactor);
    auto attachmentOrigin = roundToPixel<&round>(
        attachmentFrame.origin, layoutMetrics.pointScaleFactor);
    auto attachmentLayoutContext = layoutContext;
    auto attachmentLayoutConstrains = LayoutConstraints{
        attachmentSize, attachmentSize, layoutConstraints.layoutDirection};

    // Laying out the `ShadowNode` and the subtree starting from it.
    layoutableShadowNode.layoutTree(
        attachmentLayoutContext, attachmentLayoutConstrains);

    // Altering the origin of the `ShadowNode` (which is defined by text
    // layout, not by internal styles and state).
    auto attachmentLayoutMetrics = layoutableShadowNode.getLayoutMetrics();
    attachmentLayoutMetrics.frame.origin = attachmentOrigin;
    layoutableShadowNode.setLayoutMetrics(attachmentLayoutMetrics);
  }

  // If we ended up cloning something, we need to update the list of children
  // to reflect the changes that we made.
  if (paragraphShadowNode != this) {
    this->children_ =
        static_cast<const ParagraphShadowNode*>(paragraphShadowNode)->children_;
  }
}

} // namespace facebook::react
