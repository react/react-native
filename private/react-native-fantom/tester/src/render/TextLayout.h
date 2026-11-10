/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <include/core/SkCanvas.h>
#include <include/core/SkFont.h>
#include <include/core/SkTextBlob.h>

#include <react/renderer/attributedstring/AttributedString.h>
#include <react/renderer/attributedstring/ParagraphAttributes.h>
#include <react/renderer/textlayoutmanager/TextLayoutManager.h>

namespace facebook::react {

struct TextRun {
  std::string text;
  TextAttributes attributes;
  Float x{};
  Float width{};
  Float ascent{};
  sk_sp<SkTextBlob> blob;
};

struct TextLine {
  std::vector<TextRun> runs;
  Float width{};
  Float height{};
  Float ascent{};
};

struct TextLayout {
  std::vector<TextLine> lines;
  TextMeasurement measurement;
};

using TextCanvas = SkCanvas;
SkFont applyFont(TextCanvas *canvas, const TextAttributes &attributes);

void registerFont(const std::string &filePath);
TextLayout
layoutText(TextCanvas *canvas, const AttributedString &text, const ParagraphAttributes &paragraph, Float maximumWidth);
void paintText(TextCanvas *canvas, const TextLayout &layout, Float width);

class FantomTextLayoutManager : public TextLayoutManager {
 public:
  using TextLayoutManager::TextLayoutManager;
  TextMeasurement measure(
      const AttributedStringBox &text,
      const ParagraphAttributes &paragraph,
      const TextLayoutContext &context,
      const LayoutConstraints &constraints) const override;
};

} // namespace facebook::react
