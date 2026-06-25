/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <cstddef>

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/graphics/Size.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>

namespace facebook::react {

template <typename TextLayoutManagerT>
concept TextLayoutManagerWithPreparedTextLayout = requires(
    TextLayoutManagerT textLayoutManager,
    AttributedString attributedString,
    ParagraphAttributes paragraphAttributes,
    TextLayoutContext layoutContext,
    LayoutConstraints layoutConstraints,
    typename TextLayoutManagerT::PreparedTextLayout preparedTextLayout) {
  sizeof(typename TextLayoutManagerT::PreparedTextLayout);
  {
    textLayoutManager.prepareLayout(attributedString, paragraphAttributes, layoutContext, layoutConstraints)
  } -> std::same_as<typename TextLayoutManagerT::PreparedTextLayout>;
  {
    textLayoutManager.measurePreparedLayout(preparedTextLayout, layoutContext, layoutConstraints)
  } -> std::same_as<TextMeasurement>;
};

namespace detail {
template <typename T>
struct PreparedTextLayoutT {
  using type = std::nullptr_t;
};

template <TextLayoutManagerWithPreparedTextLayout T>
struct PreparedTextLayoutT<T> {
  using type = typename T::PreparedTextLayout;
};

/**
 * TextLayoutManagerExtended acts as an adapter for TextLayoutManager methods
 * which may not exist for a specific platform. Callers can check at
 * compile-time whether a method is supported, and calling if it is not will
 * terminate.
 */
template <typename TextLayoutManagerT>
class TextLayoutManagerExtended {
 public:
  static constexpr bool supportsLineMeasurement()
  {
    return requires(TextLayoutManagerT textLayoutManager) {
      {
        textLayoutManager.measureLines(AttributedStringBox{}, ParagraphAttributes{}, Size{})
      } -> std::same_as<LinesMeasurements>;
    };
  }

  static constexpr bool supportsPreparedTextLayout()
  {
    return TextLayoutManagerWithPreparedTextLayout<TextLayoutManagerT>;
  }

  using PreparedTextLayout = typename PreparedTextLayoutT<TextLayoutManagerT>::type;

  TextLayoutManagerExtended(const TextLayoutManagerT &textLayoutManager) : textLayoutManager_(textLayoutManager) {}

  LinesMeasurements measureLines(
      const AttributedStringBox &attributedStringBox,
      const ParagraphAttributes &paragraphAttributes,
      const Size &size)
  {
    if constexpr (supportsLineMeasurement()) {
      return textLayoutManager_.measureLines(attributedStringBox, paragraphAttributes, size);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support measureLines";
  }

  PreparedTextLayout prepareLayout(
      const AttributedString &attributedString,
      const ParagraphAttributes &paragraphAttributes,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const
  {
    if constexpr (supportsPreparedTextLayout()) {
      return textLayoutManager_.prepareLayout(attributedString, paragraphAttributes, layoutContext, layoutConstraints);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support prepareLayout";
  }

  TextMeasurement measurePreparedLayout(
      const PreparedTextLayout &layout,
      const TextLayoutContext &layoutContext,
      const LayoutConstraints &layoutConstraints) const
  {
    if constexpr (supportsPreparedTextLayout()) {
      return textLayoutManager_.measurePreparedLayout(layout, layoutContext, layoutConstraints);
    }
    LOG(FATAL) << "Platform TextLayoutManager does not support measurePreparedLayout";
  }

 private:
  const TextLayoutManagerT &textLayoutManager_;
};
} // namespace detail

using TextLayoutManagerExtended = detail::TextLayoutManagerExtended<TextLayoutManager>;

struct MeasuredPreparedTextLayout {
  LayoutConstraints layoutConstraints;
  TextMeasurement measurement;
  TextLayoutManagerExtended::PreparedTextLayout preparedTextLayout{};
};

} // namespace facebook::react
