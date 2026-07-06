/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>

#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/FlexDirection.h>
#include <yoga/algorithm/FlexLine.h>

namespace facebook::yoga {

FlexLine calculateFlexLine(
    yoga::Node* const node,
    const Direction ownerDirection,
    const float ownerWidth,
    const float mainAxisOwnerSize,
    const float availableInnerWidth,
    const float availableInnerMainDim,
    Node::LayoutableChildren::Iterator& iterator,
    const size_t lineCount) {
  std::vector<yoga::Node*> itemsInFlow;
  itemsInFlow.reserve(node->getChildCount());

  float sizeConsumed = 0.0f;
  float totalFlexGrowFactors = 0.0f;
  float totalFlexShrinkScaledFactors = 0.0f;
  size_t numberOfAutoMargins = 0;
  yoga::Node* firstElementInLine = nullptr;

  float sizeConsumedIncludingMinConstraint = 0;
  const Direction direction = node->resolveDirection(ownerDirection);
  const FlexDirection mainAxis =
      resolveDirection(node->style().flexDirection(), direction);
  const bool isNodeFlexWrap = node->style().flexWrap() != Wrap::NoWrap;
  const float gap =
      node->style().computeGapForAxis(mainAxis, availableInnerMainDim, node);

  const auto childrenEnd = node->getLayoutChildren().end();
  // Add items to the current line until it's full or we run out of items.
  for (; iterator != childrenEnd; iterator++) {
    auto child = *iterator;
    if (child->style().display() == Display::None ||
        child->style().positionType() == PositionType::Absolute) {
      continue;
    }

    if (firstElementInLine == nullptr) {
      firstElementInLine = child;
    }

    if (child->style().flexStartMarginIsAuto(mainAxis, ownerDirection)) {
      numberOfAutoMargins++;
    }
    if (child->style().flexEndMarginIsAuto(mainAxis, ownerDirection)) {
      numberOfAutoMargins++;
    }

    child->setLineIndex(lineCount);
    const float childMarginMainAxis = child->style().computeMarginForAxis(
        mainAxis, availableInnerWidth, child);
    const float childLeadingGapMainAxis =
        child == firstElementInLine ? 0.0f : gap;
    const float flexBasisWithMinAndMaxConstraints =
        boundAxisWithinMinAndMax(
            child,
            direction,
            mainAxis,
            child->getLayout().computedFlexBasis,
            mainAxisOwnerSize,
            ownerWidth)
            .unwrap();

    // If this is a multi-line flow and this item pushes us over the available
    // size, we've hit the end of the current line. Break out of the loop and
    // lay out the current line.
    if (sizeConsumedIncludingMinConstraint + flexBasisWithMinAndMaxConstraints +
                childMarginMainAxis + childLeadingGapMainAxis >
            availableInnerMainDim &&
        isNodeFlexWrap && !itemsInFlow.empty()) {
      break;
    }

    sizeConsumedIncludingMinConstraint += flexBasisWithMinAndMaxConstraints +
        childMarginMainAxis + childLeadingGapMainAxis;
    sizeConsumed += flexBasisWithMinAndMaxConstraints + childMarginMainAxis +
        childLeadingGapMainAxis;

    if (child->isNodeFlexible()) {
      totalFlexGrowFactors += child->resolveFlexGrow();

      // Unlike the grow factor, the shrink factor is scaled relative to the
      // child dimension.
      totalFlexShrinkScaledFactors += -child->resolveFlexShrink() *
          child->getLayout().computedFlexBasis.unwrap();
    }

    itemsInFlow.push_back(child);
  }

  // The total flex factor needs to be floored to 1.
  if (totalFlexGrowFactors > 0 && totalFlexGrowFactors < 1) {
    totalFlexGrowFactors = 1;
  }

  // The total flex shrink factor needs to be floored to 1.
  if (totalFlexShrinkScaledFactors > 0 && totalFlexShrinkScaledFactors < 1) {
    totalFlexShrinkScaledFactors = 1;
  }

  return FlexLine{
      .itemsInFlow = std::move(itemsInFlow),
      .sizeConsumed = sizeConsumed,
      .numberOfAutoMargins = numberOfAutoMargins,
      .layout = FlexLineRunningLayout{
          totalFlexGrowFactors,
          totalFlexShrinkScaledFactors,
      }};
}

} // namespace facebook::yoga
