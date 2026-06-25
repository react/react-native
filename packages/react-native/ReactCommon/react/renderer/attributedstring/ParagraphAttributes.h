/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <react/renderer/attributedstring/primitives.h>
#include <react/renderer/debug/DebugStringConvertible.h>
#include <react/renderer/graphics/Float.h>
#include <react/utils/hash_combine.h>

namespace facebook::react {

class ParagraphAttributes;

using SharedParagraphAttributes = std::shared_ptr<const ParagraphAttributes>;

/*
 * Represents all visual attributes of a paragraph of text.
 * Two data structures, ParagraphAttributes and AttributedText, should be
 * enough to define visual representation of a piece of text on the screen.
 */
class ParagraphAttributes : public DebugStringConvertible {
 public:
#pragma mark - Fields

  /*
   * Maximum number of lines which paragraph can take.
   * Zero value represents "no limit".
   */
  int maximumNumberOfLines{};

  /*
   * In case if a text cannot fit given boundaries, defines a place where
   * an ellipsize should be placed.
   */
  EllipsizeMode ellipsizeMode{};

  /*
   * (Android only) Break strategy for breaking paragraphs into lines.
   */
  TextBreakStrategy textBreakStrategy{TextBreakStrategy::HighQuality};

  /*
   * Enables font size adjustment to fit constrained boundaries.
   */
  bool adjustsFontSizeToFit{};

  /*
   * (Android only) Leaves enough room for ascenders and descenders instead of
   * using the font ascent and descent strictly.
   */
  bool includeFontPadding{true};

  /*
   * (Android only) Frequency of automatic hyphenation to use when determining
   * word breaks.
   */
  HyphenationFrequency android_hyphenationFrequency{};

  /*
   * In case of font size adjustment enabled, defines minimum and maximum
   * font sizes.
   */
  Float minimumFontSize{std::numeric_limits<Float>::quiet_NaN()};
  Float maximumFontSize{std::numeric_limits<Float>::quiet_NaN()};

  /*
   * Specifies the smallest possible scale a font can reach when
   * adjustsFontSizeToFit is enabled. (values 0.01-1.0).
   */
  Float minimumFontScale{std::numeric_limits<Float>::quiet_NaN()};

  /*
   * The vertical alignment of the text, causing the glyphs to be vertically
   * aligned in its container.
   */
  std::optional<TextAlignmentVertical> textAlignVertical{};

  bool operator==(const ParagraphAttributes &rhs) const;

#pragma mark - DebugStringConvertible

#if RN_DEBUG_STRING_CONVERTIBLE
  SharedDebugStringConvertibleList getDebugProps() const override;
#endif
};

} // namespace facebook::react

namespace std {

template <>
struct hash<facebook::react::ParagraphAttributes> {
  size_t operator()(const facebook::react::ParagraphAttributes &attributes) const
  {
    return facebook::react::hash_combine(
        attributes.maximumNumberOfLines,
        attributes.ellipsizeMode,
        attributes.textBreakStrategy,
        attributes.adjustsFontSizeToFit,
        attributes.minimumFontSize,
        attributes.maximumFontSize,
        attributes.includeFontPadding,
        attributes.android_hyphenationFrequency,
        attributes.minimumFontScale,
        attributes.textAlignVertical);
  }
};
} // namespace std
