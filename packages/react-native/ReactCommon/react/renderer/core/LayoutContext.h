/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <vector>

#include <react/renderer/core/LayoutableShadowNode.h>

namespace facebook::react {

/*
 * LayoutContext: Additional contextual information useful for particular
 * layout approaches.
 */
struct LayoutContext {
  /*
   * Reflects the scale factor needed to convert from the logical coordinate
   * space into the device coordinate space of the physical screen.
   * Some layout systems *might* use this to round layout metric values
   * to `pixel value`.
   */
  Float pointScaleFactor{1.0};

  /*
   * A raw pointer to list of raw pointers to `LayoutableShadowNode`s that were
   * affected by the re-layout pass. If the field is not `nullptr`, a particular
   * `LayoutableShadowNode` implementation should add mutated nodes to this
   * list. The order is not specified. Nothing in this collection is owing (on
   * purpose), make sure the memory is managed responsibly.
   */
  std::vector<const LayoutableShadowNode *> *affectedNodes{};

  /*
   * Flag indicating whether in reassignment of direction
   * aware properties should take place. If yes, following
   * reassignment will occur in RTL context.
   * - (left|right) → (start|end)
   * - margin(Left|Right) → margin(Start|End)
   * - padding(Left|Right) → padding(Start|End)
   * - borderTop(Left|Right)Radius → borderTop(Start|End)Radius
   * - borderBottom(Left|Right)Radius → borderBottom(Start|End)Radius
   * - border(Left|Right)Width → border(Start|End)Width
   * - border(Left|Right)Color → border(Start|End)Color
   */
  bool swapLeftAndRightInRTL{false};

  /*
   * Multiplier used to change size of the font in surface.
   */
  Float fontSizeMultiplier{1.0};

  /*
   * Viewport offset is offset of the React Native's root view.
   * If React Native takes up entire screen, it will be {0, 0}.
   */
  Point viewportOffset{};

  /*
   * Viewport size is size of the React Native's root view.
   */
  Size viewportSize{};
};

inline bool operator==(const LayoutContext &lhs, const LayoutContext &rhs)
{
  return std::tie(
             lhs.pointScaleFactor,
             lhs.affectedNodes,
             lhs.swapLeftAndRightInRTL,
             lhs.fontSizeMultiplier,
             lhs.viewportOffset,
             lhs.viewportSize) ==
      std::tie(
             rhs.pointScaleFactor,
             rhs.affectedNodes,
             rhs.swapLeftAndRightInRTL,
             rhs.fontSizeMultiplier,
             rhs.viewportOffset,
             rhs.viewportSize);
}

} // namespace facebook::react
