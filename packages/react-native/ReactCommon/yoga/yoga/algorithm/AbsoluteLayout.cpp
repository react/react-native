/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/algorithm/AbsoluteLayout.h>
#include <yoga/algorithm/Align.h>
#include <yoga/algorithm/BoundAxis.h>
#include <yoga/algorithm/CalculateLayout.h>
#include <yoga/algorithm/TrailingPosition.h>

namespace facebook::yoga {

static inline void setFlexStartLayoutPosition(
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection axis,
    const float containingBlockWidth) {
  float position = child->style().computeFlexStartMargin(
                       axis, direction, containingBlockWidth) +
      parent->getLayout().border(flexStartEdge(axis));

  // https://www.w3.org/TR/css-grid-1/#abspos
  // absolute positioned grid items are positioned relative to the padding edge
  // of the grid container
  if (!child->hasErrata(Errata::AbsolutePositionWithoutInsetsExcludesPadding) &&
      parent->style().display() != Display::Grid) {
    position += parent->getLayout().padding(flexStartEdge(axis));
  }

  child->setLayoutPosition(position, flexStartEdge(axis));
}

static inline void setFlexEndLayoutPosition(
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection axis,
    const float containingBlockWidth) {
  float flexEndPosition = parent->getLayout().border(flexEndEdge(axis)) +
      child->style().computeFlexEndMargin(
          axis, direction, containingBlockWidth);

  // https://www.w3.org/TR/css-grid-1/#abspos
  // absolute positioned grid items are positioned relative to the padding edge
  // of the grid container
  if (!child->hasErrata(Errata::AbsolutePositionWithoutInsetsExcludesPadding) &&
      parent->style().display() != Display::Grid) {
    flexEndPosition += parent->getLayout().padding(flexEndEdge(axis));
  }

  child->setLayoutPosition(
      getPositionOfOppositeEdge(flexEndPosition, axis, parent, child),
      flexStartEdge(axis));
}

static inline void setCenterLayoutPosition(
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection axis,
    const float containingBlockWidth) {
  float parentContentBoxSize =
      parent->getLayout().measuredDimension(dimension(axis)) -
      parent->getLayout().border(flexStartEdge(axis)) -
      parent->getLayout().border(flexEndEdge(axis));

  // https://www.w3.org/TR/css-grid-1/#abspos
  // absolute positioned grid items are positioned relative to the padding edge
  // of the grid container
  if (!child->hasErrata(Errata::AbsolutePositionWithoutInsetsExcludesPadding) &&
      parent->style().display() != Display::Grid) {
    parentContentBoxSize -= parent->getLayout().padding(flexStartEdge(axis));
    parentContentBoxSize -= parent->getLayout().padding(flexEndEdge(axis));
  }

  const float childOuterSize =
      child->getLayout().measuredDimension(dimension(axis)) +
      child->style().computeMarginForAxis(axis, containingBlockWidth);

  float position = (parentContentBoxSize - childOuterSize) / 2.0f +
      parent->getLayout().border(flexStartEdge(axis)) +
      child->style().computeFlexStartMargin(
          axis, direction, containingBlockWidth);

  // https://www.w3.org/TR/css-grid-1/#abspos
  // absolute positioned grid items are positioned relative to the padding edge
  // of the grid container
  if (!child->hasErrata(Errata::AbsolutePositionWithoutInsetsExcludesPadding) &&
      parent->style().display() != Display::Grid) {
    position += parent->getLayout().padding(flexStartEdge(axis));
  }

  child->setLayoutPosition(position, flexStartEdge(axis));
}

static void justifyAbsoluteChild(
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection mainAxis,
    const float containingBlockWidth) {
  const Justify justify = parent->style().display() == Display::Grid
      ? resolveChildJustification(parent, child)
      : parent->style().justifyContent();
  switch (justify) {
    case Justify::Start:
    case Justify::Auto:
    case Justify::Stretch:
    case Justify::FlexStart:
    case Justify::SpaceBetween:
      setFlexStartLayoutPosition(
          parent, child, direction, mainAxis, containingBlockWidth);
      break;
    case Justify::End:
    case Justify::FlexEnd:
      setFlexEndLayoutPosition(
          parent, child, direction, mainAxis, containingBlockWidth);
      break;
    case Justify::Center:
    case Justify::SpaceAround:
    case Justify::SpaceEvenly:
      setCenterLayoutPosition(
          parent, child, direction, mainAxis, containingBlockWidth);
      break;
  }
}

static void alignAbsoluteChild(
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection crossAxis,
    const float containingBlockWidth) {
  Align itemAlign = resolveChildAlignment(parent, child);
  const Wrap parentWrap = parent->style().flexWrap();
  if (parentWrap == Wrap::WrapReverse) {
    if (itemAlign == Align::FlexEnd) {
      itemAlign = Align::FlexStart;
    } else if (itemAlign != Align::Center) {
      itemAlign = Align::FlexEnd;
    }
  }

  switch (itemAlign) {
    case Align::Start:
    case Align::Auto:
    case Align::FlexStart:
    case Align::Baseline:
    case Align::SpaceAround:
    case Align::SpaceBetween:
    case Align::Stretch:
    case Align::SpaceEvenly:
      setFlexStartLayoutPosition(
          parent, child, direction, crossAxis, containingBlockWidth);
      break;
    case Align::End:
    case Align::FlexEnd:
      setFlexEndLayoutPosition(
          parent, child, direction, crossAxis, containingBlockWidth);
      break;
    case Align::Center:
      setCenterLayoutPosition(
          parent, child, direction, crossAxis, containingBlockWidth);
      break;
  }
}

/*
 * Absolutely positioned nodes do not participate in flex layout and thus their
 * positions can be determined independently from the rest of their siblings.
 * For each axis there are essentially two cases:
 *
 * 1) The node has insets defined. In this case we can just use these to
 *    determine the position of the node.
 * 2) The node does not have insets defined. In this case we look at the style
 *    of the parent to position the node. Things like justify content and
 *    align content will move absolute children around. If none of these
 *    special properties are defined, the child is positioned at the start
 *    (defined by flex direction) of the leading flex line.
 *
 * This function does that positioning for the given axis. The spec has more
 * information on this topic: https://www.w3.org/TR/css-flexbox-1/#abspos-items
 */
static void positionAbsoluteChild(
    const yoga::Node* const containingNode,
    const yoga::Node* const parent,
    yoga::Node* child,
    const Direction direction,
    const FlexDirection axis,
    const bool isMainAxis,
    const float containingBlockWidth,
    const float containingBlockHeight) {
  const bool isAxisRow = isRow(axis);
  const float containingBlockSize =
      isAxisRow ? containingBlockWidth : containingBlockHeight;

  // The inline-start position takes priority over the end position in the case
  // that they are both set and the node has a fixed width. Thus we only have 2
  // cases here: if inline-start is defined and if inline-end is defined.
  //
  // Despite checking inline-start to honor prioritization of insets, we write
  // to the flex-start edge because this algorithm works by positioning on the
  // flex-start edge and then filling in the flex-end direction at the end if
  // necessary.
  if (child->style().isInlineStartPositionDefined(axis, direction) &&
      !child->style().isInlineStartPositionAuto(axis, direction)) {
    const float positionRelativeToInlineStart =
        child->style().computeInlineStartPosition(
            axis, direction, containingBlockSize) +
        containingNode->style().computeInlineStartBorder(axis, direction) +
        child->style().computeInlineStartMargin(
            axis, direction, containingBlockSize);
    const float positionRelativeToFlexStart =
        inlineStartEdge(axis, direction) != flexStartEdge(axis)
        ? getPositionOfOppositeEdge(
              positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    child->setLayoutPosition(positionRelativeToFlexStart, flexStartEdge(axis));
  } else if (
      child->style().isInlineEndPositionDefined(axis, direction) &&
      !child->style().isInlineEndPositionAuto(axis, direction)) {
    const float positionRelativeToInlineStart =
        containingNode->getLayout().measuredDimension(dimension(axis)) -
        child->getLayout().measuredDimension(dimension(axis)) -
        containingNode->style().computeInlineEndBorder(axis, direction) -
        child->style().computeInlineEndMargin(
            axis, direction, containingBlockSize) -
        child->style().computeInlineEndPosition(
            axis, direction, containingBlockSize);
    const float positionRelativeToFlexStart =
        inlineStartEdge(axis, direction) != flexStartEdge(axis)
        ? getPositionOfOppositeEdge(
              positionRelativeToInlineStart, axis, containingNode, child)
        : positionRelativeToInlineStart;

    child->setLayoutPosition(positionRelativeToFlexStart, flexStartEdge(axis));
  } else {
    isMainAxis ? justifyAbsoluteChild(
                     parent, child, direction, axis, containingBlockWidth)
               : alignAbsoluteChild(
                     parent, child, direction, axis, containingBlockWidth);
  }
}

void layoutAbsoluteChild(
    const yoga::Node* const containingNode,
    const yoga::Node* const node,
    yoga::Node* const child,
    const float containingBlockWidth,
    const float containingBlockHeight,
    const SizingMode widthMode,
    const Direction direction,
    LayoutData& layoutMarkerData,
    const uint32_t depth,
    const uint32_t generationCount) {
  // For grid containers, use inline (Row) and block (Column) axes for
  // positioning, since grid alignment properties (justify-self, align-self)
  // operate on inline/block axes, not main/cross axes based on flex-direction.
  const FlexDirection mainAxis = node->style().display() == Display::Grid
      ? resolveDirection(FlexDirection::Row, direction)
      : resolveDirection(node->style().flexDirection(), direction);
  const FlexDirection crossAxis = node->style().display() == Display::Grid
      ? FlexDirection::Column
      : resolveCrossDirection(mainAxis, direction);
  const bool isMainAxisRow = isRow(mainAxis);

  float childWidth = YGUndefined;
  float childHeight = YGUndefined;
  SizingMode childWidthSizingMode = SizingMode::MaxContent;
  SizingMode childHeightSizingMode = SizingMode::MaxContent;

  auto marginRow = child->style().computeMarginForAxis(
      FlexDirection::Row, containingBlockWidth);
  auto marginColumn = child->style().computeMarginForAxis(
      FlexDirection::Column, containingBlockWidth);

  if (child->hasDefiniteLength(Dimension::Width, containingBlockWidth)) {
    childWidth = child
                     ->getResolvedDimension(
                         direction,
                         Dimension::Width,
                         containingBlockWidth,
                         containingBlockWidth)
                     .unwrap() +
        marginRow;
  } else {
    // If the child doesn't have a specified width, compute the width based on
    // the left/right offsets if they're defined.
    if (child->style().isFlexStartPositionDefined(
            FlexDirection::Row, direction) &&
        child->style().isFlexEndPositionDefined(
            FlexDirection::Row, direction) &&
        !child->style().isFlexStartPositionAuto(
            FlexDirection::Row, direction) &&
        !child->style().isFlexEndPositionAuto(FlexDirection::Row, direction)) {
      childWidth =
          containingNode->getLayout().measuredDimension(Dimension::Width) -
          (containingNode->style().computeFlexStartBorder(
               FlexDirection::Row, direction) +
           containingNode->style().computeFlexEndBorder(
               FlexDirection::Row, direction)) -
          (child->style().computeFlexStartPosition(
               FlexDirection::Row, direction, containingBlockWidth) +
           child->style().computeFlexEndPosition(
               FlexDirection::Row, direction, containingBlockWidth));
      childWidth = boundAxis(
          child,
          FlexDirection::Row,
          direction,
          childWidth,
          containingBlockWidth,
          containingBlockWidth);
    }
  }

  if (child->hasDefiniteLength(Dimension::Height, containingBlockHeight)) {
    childHeight = child
                      ->getResolvedDimension(
                          direction,
                          Dimension::Height,
                          containingBlockHeight,
                          containingBlockWidth)
                      .unwrap() +
        marginColumn;
  } else {
    // If the child doesn't have a specified height, compute the height based
    // on the top/bottom offsets if they're defined.
    if (child->style().isFlexStartPositionDefined(
            FlexDirection::Column, direction) &&
        child->style().isFlexEndPositionDefined(
            FlexDirection::Column, direction) &&
        !child->style().isFlexStartPositionAuto(
            FlexDirection::Column, direction) &&
        !child->style().isFlexEndPositionAuto(
            FlexDirection::Column, direction)) {
      childHeight =
          containingNode->getLayout().measuredDimension(Dimension::Height) -
          (containingNode->style().computeFlexStartBorder(
               FlexDirection::Column, direction) +
           containingNode->style().computeFlexEndBorder(
               FlexDirection::Column, direction)) -
          (child->style().computeFlexStartPosition(
               FlexDirection::Column, direction, containingBlockHeight) +
           child->style().computeFlexEndPosition(
               FlexDirection::Column, direction, containingBlockHeight));
      childHeight = boundAxis(
          child,
          FlexDirection::Column,
          direction,
          childHeight,
          containingBlockHeight,
          containingBlockWidth);
    }
  }

  // Exactly one dimension needs to be defined for us to be able to do aspect
  // ratio calculation. One dimension being the anchor and the other being
  // flexible.
  const auto& childStyle = child->style();
  if (yoga::isUndefined(childWidth) ^ yoga::isUndefined(childHeight)) {
    if (childStyle.aspectRatio().isDefined()) {
      if (yoga::isUndefined(childWidth)) {
        childWidth = marginRow +
            (childHeight - marginColumn) * childStyle.aspectRatio().unwrap();
      } else if (yoga::isUndefined(childHeight)) {
        childHeight = marginColumn +
            (childWidth - marginRow) / childStyle.aspectRatio().unwrap();
      }
    }
  }

  // If we're still missing one or the other dimension, measure the content.
  if (yoga::isUndefined(childWidth) || yoga::isUndefined(childHeight)) {
    childWidthSizingMode = yoga::isUndefined(childWidth)
        ? SizingMode::MaxContent
        : SizingMode::StretchFit;
    childHeightSizingMode = yoga::isUndefined(childHeight)
        ? SizingMode::MaxContent
        : SizingMode::StretchFit;

    // If the size of the owner is defined then try to constrain the absolute
    // child to that size as well. This allows text within the absolute child
    // to wrap to the size of its owner. This is the same behavior as many
    // browsers implement.
    if (!isMainAxisRow && yoga::isUndefined(childWidth) &&
        widthMode != SizingMode::MaxContent &&
        yoga::isDefined(containingBlockWidth) && containingBlockWidth > 0) {
      childWidth = containingBlockWidth;
      childWidthSizingMode = SizingMode::FitContent;
    }

    calculateLayoutInternal(
        child,
        childWidth,
        childHeight,
        direction,
        childWidthSizingMode,
        childHeightSizingMode,
        containingBlockWidth,
        containingBlockHeight,
        false,
        LayoutPassReason::kAbsMeasureChild,
        layoutMarkerData,
        depth,
        generationCount);
    childWidth = child->getLayout().measuredDimension(Dimension::Width) +
        child->style().computeMarginForAxis(
            FlexDirection::Row, containingBlockWidth);
    childHeight = child->getLayout().measuredDimension(Dimension::Height) +
        child->style().computeMarginForAxis(
            FlexDirection::Column, containingBlockWidth);
  }

  calculateLayoutInternal(
      child,
      childWidth,
      childHeight,
      direction,
      SizingMode::StretchFit,
      SizingMode::StretchFit,
      containingBlockWidth,
      containingBlockHeight,
      true,
      LayoutPassReason::kAbsLayout,
      layoutMarkerData,
      depth,
      generationCount);

  positionAbsoluteChild(
      containingNode,
      node,
      child,
      direction,
      mainAxis,
      true /*isMainAxis*/,
      containingBlockWidth,
      containingBlockHeight);
  positionAbsoluteChild(
      containingNode,
      node,
      child,
      direction,
      crossAxis,
      false /*isMainAxis*/,
      containingBlockWidth,
      containingBlockHeight);
}

bool layoutAbsoluteDescendants(
    yoga::Node* containingNode,
    yoga::Node* currentNode,
    SizingMode widthSizingMode,
    Direction currentNodeDirection,
    LayoutData& layoutMarkerData,
    uint32_t currentDepth,
    uint32_t generationCount,
    float currentNodeLeftOffsetFromContainingBlock,
    float currentNodeTopOffsetFromContainingBlock,
    float containingNodeAvailableInnerWidth,
    float containingNodeAvailableInnerHeight) {
  bool hasNewLayout = false;
  for (auto child : currentNode->getLayoutChildren()) {
    if (child->style().display() == Display::None) {
      continue;
    } else if (child->style().positionType() == PositionType::Absolute) {
      const bool absoluteErrata =
          currentNode->hasErrata(Errata::AbsolutePercentAgainstInnerSize);
      const float containingBlockWidth = absoluteErrata
          ? containingNodeAvailableInnerWidth
          : containingNode->getLayout().measuredDimension(Dimension::Width) -
              containingNode->style().computeBorderForAxis(FlexDirection::Row);
      const float containingBlockHeight = absoluteErrata
          ? containingNodeAvailableInnerHeight
          : containingNode->getLayout().measuredDimension(Dimension::Height) -
              containingNode->style().computeBorderForAxis(
                  FlexDirection::Column);

      layoutAbsoluteChild(
          containingNode,
          currentNode,
          child,
          containingBlockWidth,
          containingBlockHeight,
          widthSizingMode,
          currentNodeDirection,
          layoutMarkerData,
          currentDepth,
          generationCount);

      hasNewLayout = hasNewLayout || child->getHasNewLayout();

      /*
       * At this point the child has its position set but only on its the
       * parent's flexStart edge. Additionally, this position should be
       * interpreted relative to the containing block of the child if it had
       * insets defined. So we need to adjust the position by subtracting the
       * the parents offset from the containing block. However, getting that
       * offset is complicated since the two nodes can have different main/cross
       * axes.
       */
      const FlexDirection parentMainAxis = resolveDirection(
          currentNode->style().flexDirection(), currentNodeDirection);
      const FlexDirection parentCrossAxis =
          resolveCrossDirection(parentMainAxis, currentNodeDirection);

      if (needsTrailingPosition(parentMainAxis)) {
        const bool mainInsetsDefined = isRow(parentMainAxis)
            ? child->style().horizontalInsetsDefined()
            : child->style().verticalInsetsDefined();
        setChildTrailingPosition(
            mainInsetsDefined ? containingNode : currentNode,
            child,
            parentMainAxis);
      }
      if (needsTrailingPosition(parentCrossAxis)) {
        const bool crossInsetsDefined = isRow(parentCrossAxis)
            ? child->style().horizontalInsetsDefined()
            : child->style().verticalInsetsDefined();
        setChildTrailingPosition(
            crossInsetsDefined ? containingNode : currentNode,
            child,
            parentCrossAxis);
      }

      /*
       * At this point we know the left and top physical edges of the child are
       * set with positions that are relative to the containing block if insets
       * are defined
       */
      const float childLeftPosition =
          child->getLayout().position(PhysicalEdge::Left);
      const float childTopPosition =
          child->getLayout().position(PhysicalEdge::Top);

      const float childLeftOffsetFromParent =
          child->style().horizontalInsetsDefined()
          ? (childLeftPosition - currentNodeLeftOffsetFromContainingBlock)
          : childLeftPosition;
      const float childTopOffsetFromParent =
          child->style().verticalInsetsDefined()
          ? (childTopPosition - currentNodeTopOffsetFromContainingBlock)
          : childTopPosition;

      child->setLayoutPosition(childLeftOffsetFromParent, PhysicalEdge::Left);
      child->setLayoutPosition(childTopOffsetFromParent, PhysicalEdge::Top);
    } else if (
        child->style().positionType() == PositionType::Static &&
        !child->alwaysFormsContainingBlock()) {
      // We may write new layout results for absolute descendants of "child"
      // which are positioned relative to the current containing block instead
      // of their parent. "child" may not be dirty, or have new constraints, so
      // absolute positioning may be the first time during this layout pass that
      // we need to mutate these descendents. Make sure the path of
      // nodes to them is mutable before positioning.
      child->cloneChildrenIfNeeded();
      const Direction childDirection =
          child->resolveDirection(currentNodeDirection);
      // By now all descendants of the containing block that are not absolute
      // will have their positions set for left and top.
      const float childLeftOffsetFromContainingBlock =
          currentNodeLeftOffsetFromContainingBlock +
          child->getLayout().position(PhysicalEdge::Left);
      const float childTopOffsetFromContainingBlock =
          currentNodeTopOffsetFromContainingBlock +
          child->getLayout().position(PhysicalEdge::Top);

      hasNewLayout = layoutAbsoluteDescendants(
                         containingNode,
                         child,
                         widthSizingMode,
                         childDirection,
                         layoutMarkerData,
                         currentDepth + 1,
                         generationCount,
                         childLeftOffsetFromContainingBlock,
                         childTopOffsetFromContainingBlock,
                         containingNodeAvailableInnerWidth,
                         containingNodeAvailableInnerHeight) ||
          hasNewLayout;

      cleanupContentsNodesRecursively(
          child, /* didPerformLayout */ hasNewLayout);
      if (hasNewLayout) {
        child->setHasNewLayout(hasNewLayout);
      }
    }
  }
  return hasNewLayout;
}
} // namespace facebook::yoga
