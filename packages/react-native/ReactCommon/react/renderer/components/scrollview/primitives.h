/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <tuple>

namespace facebook::react {

enum class ScrollViewSnapToAlignment { Start, Center, End };

enum class ScrollViewIndicatorStyle { Default, Black, White };

enum class ScrollViewKeyboardDismissMode { None, OnDrag, Interactive };

enum class ContentInsetAdjustmentBehavior { Never, Automatic, ScrollableAxes, Always };

enum class ScrollViewEdgeEffectStyle { Automatic, Soft, Hard };

class ScrollViewEdgeEffect final {
 public:
  std::optional<ScrollViewEdgeEffectStyle> style{};
  bool hidden{false};

  bool operator==(const ScrollViewEdgeEffect &rhs) const
  {
    return std::tie(this->style, this->hidden) ==
        std::tie(rhs.style, rhs.hidden);
  }

  bool operator!=(const ScrollViewEdgeEffect &rhs) const
  {
    return !(*this == rhs);
  }
};

class ScrollViewMaintainVisibleContentPosition final {
 public:
  int minIndexForVisible{0};
  std::optional<int> autoscrollToTopThreshold{};

  bool operator==(const ScrollViewMaintainVisibleContentPosition &rhs) const = default;
};

} // namespace facebook::react
