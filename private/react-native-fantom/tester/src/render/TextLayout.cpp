/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "TextLayout.h"

#include <hb-ot.h>
#include <hb.h>
#include <include/core/SkData.h>
#include <include/core/SkFontMetrics.h>
#include <include/core/SkFontMgr.h>
#include <include/core/SkFontStyle.h>
#include <include/core/SkPaint.h>
#include <include/core/SkString.h>
#include <include/core/SkTypeface.h>
#include <include/ports/SkFontMgr_empty.h>
#include <react/renderer/graphics/Color.h>
#include <src/utils/SkUTF.h>
#include <algorithm>
#include <array>
#include <cmath>
#include <memory>
#include <mutex>
#include <span>
#include <stdexcept>

#ifndef FANTOM_SKIA_FACTORY_PROVIDED
/* static */ sk_sp<SkFontMgr> SkFontMgr::Factory() {
  return SkFontMgr_New_Custom_Empty();
}
#endif

namespace facebook::react {
namespace {

constexpr auto defaultFontFamily = "DejaVu Sans";
constexpr auto emojiFontFamily = "Noto Color Emoji";

struct RegisteredFont {
  std::string family;
  sk_sp<SkTypeface> face;
  std::shared_ptr<hb_font_t> shapingFont;
};
struct FontRegistry {
  std::vector<RegisteredFont> fonts;
  std::mutex mutex;
};

FontRegistry& fontRegistry() {
  static FontRegistry registry;
  return registry;
}

std::shared_ptr<hb_font_t> makeShapingFont(SkTypeface* typeface) {
  const auto face = std::unique_ptr<hb_face_t, decltype(&hb_face_destroy)>(
      hb_face_create_for_tables(
          [](hb_face_t*, hb_tag_t tag, void* data) {
            auto table = static_cast<SkTypeface*>(data)->copyTableData(tag);
            if (!table) {
              return hb_blob_get_empty();
            }
            auto* bytes = table.release();
            return hb_blob_create(
                static_cast<const char*>(bytes->data()),
                static_cast<unsigned>(bytes->size()),
                HB_MEMORY_MODE_READONLY,
                bytes,
                [](void* owner) { static_cast<SkData*>(owner)->unref(); });
          },
          typeface,
          nullptr),
      hb_face_destroy);
  auto font =
      std::shared_ptr<hb_font_t>(hb_font_create(face.get()), hb_font_destroy);
  hb_ot_font_set_funcs(font.get());
  hb_font_make_immutable(font.get());
  return font;
}

struct ShapedText {
  Float width{};
  sk_sp<SkTextBlob> blob;
};

ShapedText shapeEmoji(const SkFont& font, const std::string& text) {
  if (text.size() > static_cast<size_t>(std::numeric_limits<int>::max())) {
    throw std::runtime_error("Fantom text is too long to shape");
  }
  std::shared_ptr<hb_font_t> shapingFont;
  {
    auto& registry = fontRegistry();
    std::lock_guard lock(registry.mutex);
    for (const auto& registered : registry.fonts) {
      if (registered.face.get() == font.getTypeface()) {
        shapingFont = registered.shapingFont;
        break;
      }
    }
  }
  if (!shapingFont) {
    throw std::runtime_error("Cannot shape an unregistered Fantom font");
  }
  const auto buffer =
      std::unique_ptr<hb_buffer_t, decltype(&hb_buffer_destroy)>(
          hb_buffer_create(), hb_buffer_destroy);
  hb_buffer_set_flags(buffer.get(), HB_BUFFER_FLAG_REMOVE_DEFAULT_IGNORABLES);
  hb_buffer_add_utf8(
      buffer.get(), text.data(), static_cast<int>(text.size()), 0, -1);
  hb_buffer_guess_segment_properties(buffer.get());
  hb_shape(shapingFont.get(), buffer.get(), nullptr, 0);
  if (hb_buffer_allocation_successful(buffer.get()) == 0) {
    throw std::runtime_error("Cannot allocate Fantom text shaping buffer");
  }
  unsigned count = 0;
  const auto* glyphInfo = hb_buffer_get_glyph_infos(buffer.get(), &count);
  const auto* glyphPositions =
      hb_buffer_get_glyph_positions(buffer.get(), nullptr);
  if (count == 0) {
    return {};
  }
  if (glyphInfo == nullptr || glyphPositions == nullptr ||
      count > static_cast<unsigned>(std::numeric_limits<int>::max())) {
    throw std::runtime_error("Cannot read Fantom shaped glyphs");
  }
  const auto glyphs = std::span(glyphInfo, count);
  const auto positions = std::span(glyphPositions, count);
  SkTextBlobBuilder builder;
  const auto& run = builder.allocRunPos(font, static_cast<int>(count));
  auto* points = run.points();
  if (run.glyphs == nullptr || points == nullptr) {
    throw std::runtime_error("Cannot allocate Fantom shaped glyphs");
  }
  const auto outputGlyphs = std::span(run.glyphs, count);
  const auto outputPositions = std::span(points, count);
  const auto scale = font.getSize() /
      static_cast<Float>(hb_face_get_upem(hb_font_get_face(shapingFont.get())));
  Float width = 0;
  for (unsigned i = 0; i < count; ++i) {
    outputGlyphs[i] = static_cast<SkGlyphID>(glyphs[i].codepoint);
    outputPositions[i] = {
        .fX = width + static_cast<Float>(positions[i].x_offset) * scale,
        .fY = -static_cast<Float>(positions[i].y_offset) * scale};
    width += static_cast<Float>(positions[i].x_advance) * scale;
  }
  return {.width = width, .blob = builder.make()};
}

size_t nextTextUnitEnd(const std::string& text, size_t start) {
  const auto bytes = std::span(text.data(), text.size());
  const auto* cursor = bytes.subspan(start).data();
  const auto* end = std::to_address(bytes.end());
  const auto codepoint = SkUTF::NextUTF8(&cursor, end);
  if (codepoint < 0) {
    throw std::runtime_error("Invalid UTF-8 in Fantom text");
  }
  auto* next = cursor;
  auto following = next < end ? SkUTF::NextUTF8(&next, end) : -1;
  if (following == 0xfe0e || following == 0xfe0f) {
    cursor = next;
    following = next < end ? SkUTF::NextUTF8(&next, end) : -1;
  }
  if (codepoint == '#' || codepoint == '*' ||
      (codepoint >= '0' && codepoint <= '9')) {
    if (following == 0x20e3) {
      cursor = next;
    }
  }
  return static_cast<size_t>(cursor - text.data());
}

Float getFontSizeMultiplier(const TextAttributes& attributes) {
  if (!attributes.allowFontScaling.value_or(true)) {
    return 1;
  }
  const auto multiplier = std::isfinite(attributes.fontSizeMultiplier)
      ? attributes.fontSizeMultiplier
      : 1;
  return std::isfinite(attributes.maxFontSizeMultiplier) &&
          attributes.maxFontSizeMultiplier >= 1
      ? std::min(multiplier, attributes.maxFontSizeMultiplier)
      : multiplier;
}

sk_sp<SkTypeface> typeface(const TextAttributes& attributes) {
  auto& registry = fontRegistry();
  std::lock_guard lock(registry.mutex);
  const auto family =
      attributes.fontFamily.empty() ? defaultFontFamily : attributes.fontFamily;
  const bool bold = attributes.fontWeight.value_or(FontWeight::Regular) >=
      FontWeight::Semibold;
  const bool italic = attributes.fontStyle == FontStyle::Italic;
  sk_sp<SkTypeface> closest;
  int closestDistance = std::numeric_limits<int>::max();
  for (const auto& font : registry.fonts) {
    if (font.family != family) {
      continue;
    }
    const auto style = font.face->fontStyle();
    const auto distance = std::abs(style.weight() - (bold ? 700 : 400)) +
        ((style.slant() != SkFontStyle::kUpright_Slant) != italic ? 1000 : 0);
    if (distance < closestDistance) {
      closest = font.face;
      closestDistance = distance;
    }
  }
  if (closest) {
    return closest;
  }
  for (const auto& font : registry.fonts) {
    if (font.family == defaultFontFamily &&
        font.face->fontStyle() == SkFontStyle::Normal()) {
      return font.face;
    }
  }
  throw std::runtime_error(
      "Fantom requires its bundled default font before measuring text");
}

sk_sp<SkTypeface> emojiTypeface() {
  auto& registry = fontRegistry();
  std::lock_guard lock(registry.mutex);
  for (const auto& font : registry.fonts) {
    if (font.family == emojiFontFamily) {
      return font.face;
    }
  }
  return nullptr;
}

bool hasDefaultEmojiPresentation(SkUnichar codepoint) {
  // Unicode 16.0 Emoji_Presentation.
  static constexpr auto ranges = std::to_array<std::array<SkUnichar, 2>>({
      {0x231a, 0x231b},   {0x23e9, 0x23ec},   {0x23f0, 0x23f0},
      {0x23f3, 0x23f3},   {0x25fd, 0x25fe},   {0x2614, 0x2615},
      {0x2648, 0x2653},   {0x267f, 0x267f},   {0x2693, 0x2693},
      {0x26a1, 0x26a1},   {0x26aa, 0x26ab},   {0x26bd, 0x26be},
      {0x26c4, 0x26c5},   {0x26ce, 0x26ce},   {0x26d4, 0x26d4},
      {0x26ea, 0x26ea},   {0x26f2, 0x26f3},   {0x26f5, 0x26f5},
      {0x26fa, 0x26fa},   {0x26fd, 0x26fd},   {0x2705, 0x2705},
      {0x270a, 0x270b},   {0x2728, 0x2728},   {0x274c, 0x274c},
      {0x274e, 0x274e},   {0x2753, 0x2755},   {0x2757, 0x2757},
      {0x2795, 0x2797},   {0x27b0, 0x27b0},   {0x27bf, 0x27bf},
      {0x2b1b, 0x2b1c},   {0x2b50, 0x2b50},   {0x2b55, 0x2b55},
      {0x1f004, 0x1f004}, {0x1f0cf, 0x1f0cf}, {0x1f18e, 0x1f18e},
      {0x1f191, 0x1f19a}, {0x1f1e6, 0x1f1ff}, {0x1f201, 0x1f201},
      {0x1f21a, 0x1f21a}, {0x1f22f, 0x1f22f}, {0x1f232, 0x1f236},
      {0x1f238, 0x1f23a}, {0x1f250, 0x1f251}, {0x1f300, 0x1f320},
      {0x1f32d, 0x1f335}, {0x1f337, 0x1f37c}, {0x1f37e, 0x1f393},
      {0x1f3a0, 0x1f3ca}, {0x1f3cf, 0x1f3d3}, {0x1f3e0, 0x1f3f0},
      {0x1f3f4, 0x1f3f4}, {0x1f3f8, 0x1f43e}, {0x1f440, 0x1f440},
      {0x1f442, 0x1f4fc}, {0x1f4ff, 0x1f53d}, {0x1f54b, 0x1f54e},
      {0x1f550, 0x1f567}, {0x1f57a, 0x1f57a}, {0x1f595, 0x1f596},
      {0x1f5a4, 0x1f5a4}, {0x1f5fb, 0x1f64f}, {0x1f680, 0x1f6c5},
      {0x1f6cc, 0x1f6cc}, {0x1f6d0, 0x1f6d2}, {0x1f6d5, 0x1f6d7},
      {0x1f6dc, 0x1f6df}, {0x1f6eb, 0x1f6ec}, {0x1f6f4, 0x1f6fc},
      {0x1f7e0, 0x1f7eb}, {0x1f7f0, 0x1f7f0}, {0x1f90c, 0x1f93a},
      {0x1f93c, 0x1f945}, {0x1f947, 0x1f9ff}, {0x1fa70, 0x1fa7c},
      {0x1fa80, 0x1fa89}, {0x1fa8f, 0x1fac6}, {0x1face, 0x1fadc},
      {0x1fadf, 0x1fae9}, {0x1faf0, 0x1faf8},
  });
  const auto range = std::lower_bound(
      ranges.begin(),
      ranges.end(),
      codepoint,
      [](const auto& bounds, SkUnichar value) { return bounds[1] < value; });
  return range != ranges.end() && (*range)[0] <= codepoint;
}

bool hasColorEmoji(const std::string& text, const sk_sp<SkTypeface>& emoji) {
  if (!emoji) {
    return false;
  }
  const auto* cursor = text.data();
  const auto bytes = std::span(text.data(), text.size());
  const auto* end = std::to_address(bytes.end());
  while (cursor < end) {
    const auto codepoint = SkUTF::NextUTF8(&cursor, end);
    if (codepoint < 0) {
      throw std::runtime_error("Invalid UTF-8 in Fantom text");
    }
    const auto* next = cursor;
    const auto following = next < end ? SkUTF::NextUTF8(&next, end) : -1;
    if (following != 0xfe0e &&
        (following == 0xfe0f || codepoint == 0x20e3 ||
         hasDefaultEmojiPresentation(codepoint)) &&
        emoji->unicharToGlyph(codepoint) != 0) {
      return true;
    }
  }
  return false;
}

bool hasGlyphs(const SkFont& font, const std::string& text) {
  const auto count = SkUTF::CountUTF8(text.data(), text.size());
  if (count < 0) {
    throw std::runtime_error("Invalid UTF-8 in Fantom text");
  }
  std::vector<SkGlyphID> glyphs(static_cast<size_t>(count));
  font.textToGlyphs(
      text.data(), text.size(), SkTextEncoding::kUTF8, glyphs.data(), count);
  return std::ranges::none_of(glyphs, [](auto glyph) { return glyph == 0; });
}

std::string fallbackFamily(
    const std::string& character,
    const TextAttributes& attributes) {
  const auto* cursor = character.data();
  const auto bytes = std::span(character.data(), character.size());
  const auto codepoint = SkUTF::NextUTF8(&cursor, std::to_address(bytes.end()));
  auto& registry = fontRegistry();
  std::lock_guard lock(registry.mutex);
  for (const auto& font : registry.fonts) {
    if (font.face->unicharToGlyph(codepoint) != 0) {
      return font.family;
    }
  }
  return attributes.fontFamily;
}

AttributedString resolveFontFallback(
    SkCanvas* canvas,
    const AttributedString& text) {
  AttributedString resolved;
  const auto emoji = emojiTypeface();
  for (const auto& fragment : text.getFragments()) {
    const auto font = applyFont(canvas, fragment.textAttributes);
    if (fragment.isAttachment() ||
        (hasGlyphs(font, fragment.string) &&
         !hasColorEmoji(fragment.string, emoji))) {
      resolved.appendFragment(AttributedString::Fragment{fragment});
      continue;
    }
    auto run = fragment;
    run.string.clear();
    for (size_t start = 0; start < fragment.string.size();) {
      const auto end = nextTextUnitEnd(fragment.string, start);
      const auto character = fragment.string.substr(start, end - start);
      const auto family = hasColorEmoji(character, emoji)
          ? std::string(emojiFontFamily)
          : hasGlyphs(font, character)
          ? fragment.textAttributes.fontFamily
          : fallbackFamily(character, fragment.textAttributes);
      if (family != run.textAttributes.fontFamily && !run.string.empty()) {
        resolved.appendFragment(AttributedString::Fragment{run});
        run.string.clear();
      }
      run.textAttributes.fontFamily = family;
      run.string += character;
      start = end;
    }
    if (!run.string.empty()) {
      resolved.appendFragment(std::move(run));
    }
  }
  return resolved;
}

} // namespace

void registerFont(const std::string& filePath) {
  auto& registry = fontRegistry();
  std::lock_guard lock(registry.mutex);
  static const auto manager = SkFontMgr_New_Custom_Empty();
  auto face = manager->makeFromFile(filePath.c_str());
  if (!face) {
    throw std::runtime_error("Cannot register Fantom font: " + filePath);
  }
  SkString family;
  face->getFamilyName(&family);
  auto shapingFont = std::string_view(family.c_str()) == emojiFontFamily
      ? makeShapingFont(face.get())
      : nullptr;
  registry.fonts.push_back(
      {family.c_str(), std::move(face), std::move(shapingFont)});
}

SkFont applyFont(SkCanvas* /*canvas*/, const TextAttributes& attributes) {
  SkFont font(
      typeface(attributes),
      (std::isfinite(attributes.fontSize) ? attributes.fontSize : 14) *
          getFontSizeMultiplier(attributes));
  font.setEdging(SkFont::Edging::kAntiAlias);
  font.setHinting(SkFontHinting::kNone);
  font.setSubpixel(true);
  font.setLinearMetrics(true);
  font.setEmbeddedBitmaps(true);
  return font;
}

TextLayout layoutText(
    SkCanvas* canvas,
    const AttributedString& text,
    const ParagraphAttributes& paragraph,
    Float maximumWidth) {
  TextLayout result;
  TextLine line;
  const auto maxLines = paragraph.maximumNumberOfLines > 0
      ? paragraph.maximumNumberOfLines
      : std::numeric_limits<int>::max();
  auto finishLine = [&] {
    result.measurement.size.width =
        std::max(result.measurement.size.width, line.width);
    result.measurement.size.height += line.height;
    result.lines.push_back(std::move(line));
    line = {};
  };

  const auto resolved = resolveFontFallback(canvas, text);
  for (const auto& fragment : resolved.getFragments()) {
    const auto selectedFont = applyFont(canvas, fragment.textAttributes);
    SkFontMetrics font{};
    selectedFont.getMetrics(&font);
    const auto height = std::isfinite(fragment.textAttributes.lineHeight)
        ? fragment.textAttributes.lineHeight *
            getFontSizeMultiplier(fragment.textAttributes)
        : static_cast<Float>((font.fDescent - font.fAscent + font.fLeading));
    const auto measure = [&](const std::string& token) -> ShapedText {
      if (fragment.textAttributes.fontFamily == emojiFontFamily &&
          SkUTF::CountUTF8(token.data(), token.size()) > 1) {
        return shapeEmoji(selectedFont, token);
      }
      return {
          .width = selectedFont.measureText(
              token.data(), token.size(), SkTextEncoding::kUTF8),
          .blob = nullptr};
    };
    auto append = [&](const std::string& token, ShapedText shaped) {
      line.runs.push_back(
          {token,
           fragment.textAttributes,
           line.width,
           shaped.width,
           static_cast<Float>(-font.fAscent),
           std::move(shaped.blob)});
      line.width += shaped.width;
      line.height = std::max(line.height, height);
      line.ascent = std::max(line.ascent, static_cast<Float>(-font.fAscent));
    };

    if (fragment.isAttachment()) {
      const auto size = fragment.parentShadowView.layoutMetrics.frame.size;
      if (line.width > 0 && line.width + size.width > maximumWidth) {
        finishLine();
      }
      result.measurement.attachments.push_back(
          {.frame =
               {.origin =
                    {.x = line.width, .y = result.measurement.size.height},
                .size = size},
           .isClipped = static_cast<int>(result.lines.size()) >= maxLines});
      line.width += size.width;
      line.height = std::max(line.height, size.height);
      continue;
    }

    // Break at whitespace, then at UTF-8 character boundaries for long words.
    for (size_t start = 0; start < fragment.string.size();) {
      if (fragment.string[start] == '\n') {
        line.height = std::max(line.height, height);
        finishLine();
        ++start;
        continue;
      }
      auto end = start + 1;
      const bool whitespace =
          fragment.string[start] == ' ' || fragment.string[start] == '\t';
      while (end < fragment.string.size() && fragment.string[end] != '\n' &&
             (fragment.string[end] == ' ' || fragment.string[end] == '\t') ==
                 whitespace) {
        ++end;
      }
      auto token = fragment.string.substr(start, end - start);
      auto shaped = measure(token);
      if (line.width > 0 && line.width + shaped.width > maximumWidth) {
        finishLine();
        if (whitespace) {
          start = end;
          continue;
        }
      }
      if (shaped.width <= maximumWidth || whitespace) {
        append(token, std::move(shaped));
      } else {
        for (size_t i = 0; i < token.size();) {
          const auto next = nextTextUnitEnd(token, i);
          auto character = token.substr(i, next - i);
          shaped = measure(character);
          if (line.width > 0 && line.width + shaped.width > maximumWidth) {
            finishLine();
          }
          append(character, std::move(shaped));
          i = next;
        }
      }
      start = end;
    }
  }
  if (!line.runs.empty() || line.height > 0) {
    finishLine();
  }
  if (static_cast<int>(result.lines.size()) > maxLines) {
    result.lines.resize(maxLines);
    result.measurement.size = {};
    for (const auto& visibleLine : result.lines) {
      result.measurement.size.width =
          std::max(result.measurement.size.width, visibleLine.width);
      result.measurement.size.height += visibleLine.height;
    }
  }
  return result;
}

void paintText(SkCanvas* canvas, const TextLayout& layout, Float width) {
  if (canvas == nullptr) {
    throw std::invalid_argument("Fantom requires a canvas to paint text");
  }
  Float y = 0;
  for (const auto& line : layout.lines) {
    Float offset = 0;
    if (!line.runs.empty()) {
      const auto alignment = line.runs.front().attributes.alignment;
      if (alignment == TextAlignment::Center) {
        offset = (width - line.width) / 2;
      } else if (alignment == TextAlignment::Right) {
        offset = width - line.width;
      }
    }
    for (const auto& run : line.runs) {
      const auto font = applyFont(canvas, run.attributes);
      const auto opacity =
          std::isfinite(run.attributes.opacity) ? run.attributes.opacity : 1;
      const auto paintFor = [&](SharedColor color) {
        SkPaint paint;
        paint.setAntiAlias(true);
        paint.setColor(SkColorSetARGB(
            alphaFromColor(color),
            redFromColor(color),
            greenFromColor(color),
            blueFromColor(color)));
        paint.setAlphaf(paint.getAlphaf() * opacity);
        return paint;
      };
      if (run.attributes.backgroundColor) {
        canvas->drawRect(
            SkRect::MakeXYWH(offset + run.x, y, run.width, line.height),
            paintFor(run.attributes.backgroundColor));
      }
      const auto color = run.attributes.foregroundColor
          ? run.attributes.foregroundColor
          : blackColor();
      const auto baseline = y + (line.height - line.ascent) / 2 + line.ascent;
      if (run.blob) {
        canvas->drawTextBlob(
            run.blob, offset + run.x, baseline, paintFor(color));
      } else {
        canvas->drawSimpleText(
            run.text.data(),
            run.text.size(),
            SkTextEncoding::kUTF8,
            offset + run.x,
            baseline,
            font,
            paintFor(color));
      }
    }
    y += line.height;
  }
}

TextMeasurement FantomTextLayoutManager::measure(
    const AttributedStringBox& text,
    const ParagraphAttributes& paragraph,
    const TextLayoutContext& /*context*/,
    const LayoutConstraints& constraints) const {
  auto result =
      layoutText(
          nullptr, text.getValue(), paragraph, constraints.maximumSize.width)
          .measurement;
  result.size = constraints.clamp(result.size);
  return result;
}

} // namespace facebook::react
