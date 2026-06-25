/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/core/LayoutPrimitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/debug/flags.h>
#include <react/renderer/graphics/Rect.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/utils/hash_combine.h>
#include <algorithm>

namespace facebook::react {

/*
 * Describes results of layout process for particular shadow node.
 */
struct LayoutMetrics {
  // Origin: relative to the outer border of its parent.
  // Size: includes border, padding and content.
  Rect frame;
  // Width of the border + padding in each direction.
  EdgeInsets contentInsets{0};
  // Width of the border in each direction.
  EdgeInsets borderWidth{0};
  // See `DisplayType` for all possible options.
  DisplayType displayType{DisplayType::Flex};
  // See `PositionType` for all possible options.
  PositionType positionType{PositionType::Relative};
  // See `LayoutDirection` for all possible options.
  LayoutDirection layoutDirection{LayoutDirection::Undefined};
  // Whether React Native treated cardinal directions as flow-relative
  // directions due to being laid out in RTL with `doLeftAndRightSwapInRTL`
  // enabled.
  bool wasLeftAndRightSwapped{false};
  // Pixel density. Number of device pixels per density-independent pixel.
  Float pointScaleFactor{1.0};
  // Surface font scale this node was last laid out with.
  Float fontSizeMultiplier{1.0};
  // How much the children of the node actually overflow in each direction.
  // Positive values indicate that children are overflowing outside of the node.
  // Negative values indicate that children are clipped inside the node
  // (like when using `overflow: clip` on Web).
  EdgeInsets overflowInset{};

  // Origin: the outer border of the node.
  // Size: includes content only.
  Rect getContentFrame() const
  {
    return Rect{
        .origin = Point{.x = contentInsets.left, .y = contentInsets.top},
        .size = Size{
            .width = frame.size.width - contentInsets.left - contentInsets.right,
            .height = frame.size.height - contentInsets.top - contentInsets.bottom}};
  }

  // Calculates the frame of the node including overflow insets.
  // If the frame was drawn on screen, it would include all the children of the
  // node (and their children, recursively).
  Rect getOverflowInsetFrame() const
  {
    return Rect{
        .origin =
            Point{
                .x = frame.origin.x + std::min(Float{0}, overflowInset.left),
                .y = frame.origin.y + std::min(Float{0}, overflowInset.top)},
        .size = Size{
            .width =
                frame.size.width - std::min(Float{0}, overflowInset.left) + -std::min(Float{0}, overflowInset.right),
            .height =
                frame.size.height - std::min(Float{0}, overflowInset.top) + -std::min(Float{0}, overflowInset.bottom)}};
  }

  // Origin: the outer border of the node.
  // Size: includes content and padding (but no borders).
  Rect getPaddingFrame() const
  {
    return Rect{
        .origin = Point{.x = borderWidth.left, .y = borderWidth.top},
        .size = Size{
            .width = frame.size.width - borderWidth.left - borderWidth.right,
            .height = frame.size.height - borderWidth.top - borderWidth.bottom}};
  }

  bool operator==(const LayoutMetrics &rhs) const = default;
};

/*
 * Represents some undefined, not-yet-computed or meaningless value of
 * `LayoutMetrics` type.
 * The value is comparable by equality with any other `LayoutMetrics` value.
 */
static const LayoutMetrics EmptyLayoutMetrics = {
    /* .frame = */ .frame = {.origin = {.x = 0, .y = 0}, .size = {.width = -1.0, .height = -1.0}}};

#if RN_DEBUG_STRING_CONVERTIBLE

std::string getDebugName(const LayoutMetrics &object);
std::vector<DebugStringConvertibleObject> getDebugProps(
    const LayoutMetrics &object,
    DebugStringConvertibleOptions options);

#endif

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::LayoutMetrics> {
  size_t operator()(const facebook::react::LayoutMetrics &layoutMetrics) const
  {
    return facebook::react::hash_combine(
        layoutMetrics.frame,
        layoutMetrics.contentInsets,
        layoutMetrics.borderWidth,
        layoutMetrics.displayType,
        layoutMetrics.layoutDirection,
        layoutMetrics.pointScaleFactor,
        layoutMetrics.fontSizeMultiplier,
        layoutMetrics.overflowInset);
  }
};

} // namespace std
