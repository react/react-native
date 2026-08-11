/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/attributedstring/AttributedStringBox.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/core/LayoutConstraints.h>
#include <react/renderer/textlayoutmanager/TextLayoutContext.h>
#include <react/renderer/textlayoutmanager/TextMeasureCache.h>
#include <react/utils/ContextContainer.h>
#include <memory>

namespace facebook::react {

class TextLayoutManager;

/*
 * Cross platform facade for text measurement (e.g. Android-specific
 * TextLayoutManager)
 */
class TextLayoutManager {
 public:
  explicit TextLayoutManager(
      const std::shared_ptr<const ContextContainer>& contextContainer);
  virtual ~TextLayoutManager() = default;

  /*
   * Not copyable.
   */
  TextLayoutManager(const TextLayoutManager&) = delete;
  TextLayoutManager& operator=(const TextLayoutManager&) = delete;

  /*
   * Not movable.
   */
  TextLayoutManager(TextLayoutManager&&) = delete;
  TextLayoutManager& operator=(TextLayoutManager&&) = delete;

  /*
   * Measures `attributedString` using native text rendering infrastructure.
   */
  virtual TextMeasurement measure(
      const AttributedStringBox& attributedStringBox,
      const ParagraphAttributes& paragraphAttributes,
      const TextLayoutContext& layoutContext,
      const LayoutConstraints& layoutConstraints) const;

 protected:
  std::shared_ptr<const ContextContainer> contextContainer_;
  TextMeasureCache textMeasureCache_;
};

} // namespace facebook::react
