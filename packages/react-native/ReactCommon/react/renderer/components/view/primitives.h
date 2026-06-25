/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/graphics/Color.h>
#include <react/renderer/graphics/RectangleCorners.h>
#include <react/renderer/graphics/RectangleEdges.h>
#include <react/renderer/graphics/ValueUnit.h>

#include <array>
#include <bitset>
#include <cmath>
#include <optional>

namespace facebook::react {

enum class PointerEventsMode : uint8_t { Auto, None, BoxNone, BoxOnly };

struct ViewEvents {
  std::bitset<64> bits{};

  enum class Offset : std::size_t {
    // Pointer events
    PointerEnter = 0,
    PointerMove = 1,
    PointerLeave = 2,

    // PanResponder callbacks
    MoveShouldSetResponder = 3,
    MoveShouldSetResponderCapture = 4,
    StartShouldSetResponder = 5,
    StartShouldSetResponderCapture = 6,
    ResponderGrant = 7,
    ResponderReject = 8,
    ResponderStart = 9,
    ResponderEnd = 10,
    ResponderRelease = 11,
    ResponderMove = 12,
    ResponderTerminate = 13,
    ResponderTerminationRequest = 14,
    ShouldBlockNativeResponder = 15,

    // Touch events
    TouchStart = 16,
    TouchMove = 17,
    TouchEnd = 18,
    TouchCancel = 19,

    // W3C Pointer Events
    PointerEnterCapture = 23,
    PointerLeaveCapture = 24,
    PointerMoveCapture = 25,
    PointerOver = 26,
    PointerOut = 27,
    PointerOverCapture = 28,
    PointerOutCapture = 29,
    Click = 30,
    ClickCapture = 31,
    GotPointerCapture = 32,
    LostPointerCapture = 33,
    PointerDown = 34,
    PointerDownCapture = 35,
    PointerUp = 36,
    PointerUpCapture = 37,
  };

  constexpr bool operator[](const Offset offset) const
  {
    return bits[static_cast<std::size_t>(offset)];
  }

  std::bitset<64>::reference operator[](const Offset offset)
  {
    return bits[static_cast<std::size_t>(offset)];
  }
};

inline static bool operator==(const ViewEvents &lhs, const ViewEvents &rhs)
{
  return lhs.bits == rhs.bits;
}

enum class BackfaceVisibility : uint8_t { Auto, Visible, Hidden };

enum class BorderCurve : uint8_t { Circular, Continuous };

enum class BorderStyle : uint8_t { Solid, Dotted, Dashed };

enum class OutlineStyle : uint8_t { Solid, Dotted, Dashed };

struct CornerRadii {
  float vertical{0.0f};
  float horizontal{0.0f};

  bool operator==(const CornerRadii &other) const = default;
};

enum class Cursor : uint8_t {
  Auto,
  Alias,
  AllScroll,
  Cell,
  ColResize,
  ContextMenu,
  Copy,
  Crosshair,
  Default,
  EResize,
  EWResize,
  Grab,
  Grabbing,
  Help,
  Move,
  NEResize,
  NESWResize,
  NResize,
  NSResize,
  NWResize,
  NWSEResize,
  NoDrop,
  None,
  NotAllowed,
  Pointer,
  Progress,
  RowResize,
  SResize,
  SEResize,
  SWResize,
  Text,
  Url,
  WResize,
  Wait,
  ZoomIn,
  ZoomOut,
};

enum class LayoutConformance : uint8_t { Strict, Compatibility };

template <typename T>
struct CascadedRectangleEdges {
  using Counterpart = RectangleEdges<T>;
  using OptionalT = std::optional<T>;

  OptionalT left{};
  OptionalT top{};
  OptionalT right{};
  OptionalT bottom{};
  OptionalT start{};
  OptionalT end{};
  OptionalT horizontal{};
  OptionalT vertical{};
  OptionalT all{};
  OptionalT block{};
  OptionalT blockStart{};
  OptionalT blockEnd{};

  Counterpart resolve(bool isRTL, T defaults) const
  {
    const auto leadingEdge = isRTL ? end : start;
    const auto trailingEdge = isRTL ? start : end;
    const auto horizontalOrAllOrDefault = horizontal.value_or(all.value_or(defaults));
    const auto verticalOrAllOrDefault = vertical.value_or(all.value_or(defaults));

    return {
        /* .left = */
        left.value_or(leadingEdge.value_or(horizontalOrAllOrDefault)),
        /* .top = */
        blockStart.value_or(block.value_or(top.value_or(verticalOrAllOrDefault))),
        /* .right = */
        right.value_or(trailingEdge.value_or(horizontalOrAllOrDefault)),
        /* .bottom = */
        blockEnd.value_or(block.value_or(bottom.value_or(verticalOrAllOrDefault))),
    };
  }

  bool operator==(const CascadedRectangleEdges<T> &rhs) const = default;
};

template <typename T>
struct CascadedRectangleCorners {
  using Counterpart = RectangleCorners<T>;
  using OptionalT = std::optional<T>;

  OptionalT topLeft{};
  OptionalT topRight{};
  OptionalT bottomLeft{};
  OptionalT bottomRight{};
  OptionalT topStart{};
  OptionalT topEnd{};
  OptionalT bottomStart{};
  OptionalT bottomEnd{};
  OptionalT all{};
  OptionalT endEnd{};
  OptionalT endStart{};
  OptionalT startEnd{};
  OptionalT startStart{};

  Counterpart resolve(bool isRTL, T defaults) const
  {
    const auto logicalTopStart = topStart ? topStart : startStart;
    const auto logicalTopEnd = topEnd ? topEnd : startEnd;
    const auto logicalBottomStart = bottomStart ? bottomStart : endStart;
    const auto logicalBottomEnd = bottomEnd ? bottomEnd : endEnd;

    const auto topLeading = isRTL ? logicalTopEnd : logicalTopStart;
    const auto topTrailing = isRTL ? logicalTopStart : logicalTopEnd;
    const auto bottomLeading = isRTL ? logicalBottomEnd : logicalBottomStart;
    const auto bottomTrailing = isRTL ? logicalBottomStart : logicalBottomEnd;

    return {
        /* .topLeft = */ topLeft.value_or(topLeading.value_or(all.value_or(defaults))),
        /* .topRight = */
        topRight.value_or(topTrailing.value_or(all.value_or(defaults))),
        /* .bottomLeft = */
        bottomLeft.value_or(bottomLeading.value_or(all.value_or(defaults))),
        /* .bottomRight = */
        bottomRight.value_or(bottomTrailing.value_or(all.value_or(defaults))),
    };
  }

  bool operator==(const CascadedRectangleCorners<T> &rhs) const = default;
};

using BorderWidths = RectangleEdges<Float>;
using BorderCurves = RectangleCorners<BorderCurve>;
using BorderStyles = RectangleEdges<BorderStyle>;
using BorderColors = RectangleEdges<SharedColor>;
using BorderRadii = RectangleCorners<CornerRadii>;

using CascadedBorderWidths = CascadedRectangleEdges<Float>;
using CascadedBorderCurves = CascadedRectangleCorners<BorderCurve>;
using CascadedBorderStyles = CascadedRectangleEdges<BorderStyle>;
using CascadedBorderColors = CascadedRectangleEdges<SharedColor>;
using CascadedBorderRadii = CascadedRectangleCorners<ValueUnit>;

struct BorderMetrics {
  BorderColors borderColors{};
  BorderWidths borderWidths{};
  BorderRadii borderRadii{};
  BorderCurves borderCurves{};
  BorderStyles borderStyles{};

  bool operator==(const BorderMetrics &rhs) const = default;
};

inline bool areBorderRadiiCircular(const BorderRadii &borderRadii)
{
  return borderRadii.isUniform() && borderRadii.topLeft.horizontal == borderRadii.topLeft.vertical;
}

} // namespace facebook::react
