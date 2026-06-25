/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <yoga/Yoga.h>

#include <yoga/algorithm/FlexDirection.h>
#include <yoga/node/Node.h>

namespace facebook::yoga {

inline Align resolveChildAlignment(
    const yoga::Node* node,
    const yoga::Node* child) {
  const Align align = child->style().alignSelf() == Align::Auto
      ? node->style().alignItems()
      : child->style().alignSelf();

  if (node->style().display() == Display::Flex && align == Align::Baseline &&
      isColumn(node->style().flexDirection())) {
    return Align::FlexStart;
  }

  return align;
}

inline Justify resolveChildJustification(
    const yoga::Node* node,
    const yoga::Node* child) {
  return child->style().justifySelf() == Justify::Auto
      ? node->style().justifyItems()
      : child->style().justifySelf();
}

/**
 * Fallback alignment to use on overflow
 * https://www.w3.org/TR/css-align-3/#distribution-values
 */
constexpr Align fallbackAlignment(Align align) {
  switch (align) {
      // Fallback to flex-start
    case Align::SpaceBetween:
    case Align::Stretch:
      return Align::FlexStart;

    // Fallback to safe center. TODO (T208209388): This should be aligned to
    // Start instead of FlexStart (for row-reverse containers)
    case Align::SpaceAround:
    case Align::SpaceEvenly:
      return Align::FlexStart;
    default:
      return align;
  }
}

/**
 * Fallback alignment to use on overflow
 * https://www.w3.org/TR/css-align-3/#distribution-values
 */
constexpr Justify fallbackAlignment(Justify align) {
  switch (align) {
      // Fallback to flex-start
    case Justify::SpaceBetween:
      // TODO: Support `justify-content: stretch`
      // case Justify::Stretch:
      return Justify::FlexStart;

    // Fallback to safe center. TODO (T208209388): This should be aligned to
    // Start instead of FlexStart (for row-reverse containers)
    case Justify::SpaceAround:
    case Justify::SpaceEvenly:
      return Justify::FlexStart;
    default:
      return align;
  }
}

} // namespace facebook::yoga
