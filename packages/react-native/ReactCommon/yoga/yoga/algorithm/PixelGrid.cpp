/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <yoga/Yoga.h>

#include <yoga/algorithm/PixelGrid.h>
#include <yoga/numeric/Comparison.h>

namespace facebook::yoga {

float roundValueToPixelGrid(
    const double value,
    const double pointScaleFactor,
    const bool forceCeil,
    const bool forceFloor) {
  double scaledValue = value * pointScaleFactor;
  // We want to calculate `fractial` such that `floor(scaledValue) = scaledValue
  // - fractial`.
  double fractial = fmod(scaledValue, 1.0);
  if (fractial < 0) {
    // This branch is for handling negative numbers for `value`.
    //
    // Regarding `floor` and `ceil`. Note that for a number x, `floor(x) <= x <=
    // ceil(x)` even for negative numbers. Here are a couple of examples:
    //   - x =  2.2: floor( 2.2) =  2, ceil( 2.2) =  3
    //   - x = -2.2: floor(-2.2) = -3, ceil(-2.2) = -2
    //
    // Regarding `fmodf`. For fractional negative numbers, `fmodf` returns a
    // negative number. For example, `fmodf(-2.2) = -0.2`. However, we want
    // `fractial` to be the number such that subtracting it from `value` will
    // give us `floor(value)`. In the case of negative numbers, adding 1 to
    // `fmodf(value)` gives us this. Let's continue the example from above:
    //   - fractial = fmodf(-2.2) = -0.2
    //   - Add 1 to the fraction: fractial2 = fractial + 1 = -0.2 + 1 = 0.8
    //   - Finding the `floor`: -2.2 - fractial2 = -2.2 - 0.8 = -3
    ++fractial;
  }
  if (yoga::inexactEquals(fractial, 0)) {
    // First we check if the value is already rounded
    scaledValue = scaledValue - fractial;
  } else if (yoga::inexactEquals(fractial, 1.0)) {
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceCeil) {
    // Next we check if we need to use forced rounding
    scaledValue = scaledValue - fractial + 1.0;
  } else if (forceFloor) {
    scaledValue = scaledValue - fractial;
  } else {
    // Finally we just round the value
    scaledValue = scaledValue - fractial +
        (!std::isnan(fractial) &&
                 (fractial > 0.5 || yoga::inexactEquals(fractial, 0.5))
             ? 1.0
             : 0.0);
  }
  return (std::isnan(scaledValue) || std::isnan(pointScaleFactor))
      ? YGUndefined
      : (float)(scaledValue / pointScaleFactor);
}

void roundLayoutResultsToPixelGrid(
    yoga::Node* const node,
    const double absoluteLeft,
    const double absoluteTop) {
  const auto pointScaleFactor =
      static_cast<double>(node->getConfig()->getPointScaleFactor());

  const double nodeLeft = node->getLayout().position(PhysicalEdge::Left);
  const double nodeTop = node->getLayout().position(PhysicalEdge::Top);

  const double nodeWidth = node->getLayout().dimension(Dimension::Width);
  const double nodeHeight = node->getLayout().dimension(Dimension::Height);

  const double absoluteNodeLeft = absoluteLeft + nodeLeft;
  const double absoluteNodeTop = absoluteTop + nodeTop;

  const double absoluteNodeRight = absoluteNodeLeft + nodeWidth;
  const double absoluteNodeBottom = absoluteNodeTop + nodeHeight;

  if (pointScaleFactor != 0.0) {
    // If a node has a custom measure function we never want to round down its
    // size as this could lead to unwanted text truncation.
    const bool textRounding = node->getNodeType() == NodeType::Text;

    node->setLayoutPosition(
        roundValueToPixelGrid(nodeLeft, pointScaleFactor, false, textRounding),
        PhysicalEdge::Left);

    node->setLayoutPosition(
        roundValueToPixelGrid(nodeTop, pointScaleFactor, false, textRounding),
        PhysicalEdge::Top);

    // We multiply dimension by scale factor and if the result is close to the
    // whole number, we don't have any fraction To verify if the result is close
    // to whole number we want to check both floor and ceil numbers

    const double scaledNodeWith = nodeWidth * pointScaleFactor;
    const bool hasFractionalWidth =
        !yoga::inexactEquals(round(scaledNodeWith), scaledNodeWith);

    const double scaledNodeHeight = nodeHeight * pointScaleFactor;
    const bool hasFractionalHeight =
        !yoga::inexactEquals(round(scaledNodeHeight), scaledNodeHeight);

    const float roundedNodeLeft = roundValueToPixelGrid(
        absoluteNodeLeft, pointScaleFactor, false, textRounding);

    float roundedNodeWidth = roundValueToPixelGrid(
                                 absoluteNodeRight,
                                 pointScaleFactor,
                                 (textRounding && hasFractionalWidth),
                                 (textRounding && !hasFractionalWidth)) -
        roundedNodeLeft;

    // Rounding the two edges independently can still narrow a node below the
    // size it measured, which is what the comment above means to prevent. The
    // left and right edge can fall on opposite sides of `inexactEquals`'
    // tolerance: for text measured as 23 physical pixels on a 2.75 density
    // screen the left edge lands on 103.9999008 scaled units and is snapped up
    // to 104, while the right edge lands on 126.9998999, misses the tolerance,
    // and is floored to 126 - a 22 pixel wide box for 23 pixels of text.
    //
    // Recompute the right edge with `forceCeil` in exactly those cases. Nodes
    // that already round to at least the size they measured keep the width
    // computed above.
    const double scaledRoundedNodeWidth =
        static_cast<double>(roundedNodeWidth) * pointScaleFactor;
    if (textRounding && scaledRoundedNodeWidth < scaledNodeWith &&
        !yoga::inexactEquals(scaledRoundedNodeWidth, scaledNodeWith)) {
      roundedNodeWidth = roundValueToPixelGrid(
                             absoluteNodeRight, pointScaleFactor, true, false) -
          roundedNodeLeft;
    }

    node->getLayout().setDimension(Dimension::Width, roundedNodeWidth);

    node->getLayout().setDimension(
        Dimension::Height,
        roundValueToPixelGrid(
            absoluteNodeBottom,
            pointScaleFactor,
            (textRounding && hasFractionalHeight),
            (textRounding && !hasFractionalHeight)) -
            roundValueToPixelGrid(
                absoluteNodeTop, pointScaleFactor, false, textRounding));
  }

  for (yoga::Node* child : node->getChildren()) {
    if (child->getOwner() != node) {
      continue;
    }
    roundLayoutResultsToPixelGrid(child, absoluteNodeLeft, absoluteNodeTop);
  }
}

} // namespace facebook::yoga
