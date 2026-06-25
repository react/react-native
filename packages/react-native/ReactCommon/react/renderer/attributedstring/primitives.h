/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <functional>
#include <limits>

namespace facebook::react {

enum class FontStyle { Normal, Italic, Oblique };

enum class FontWeight : int {
  Weight100 = 100,
  UltraLight = 100,
  Weight200 = 200,
  Thin = 200,
  Weight300 = 300,
  Light = 300,
  Weight400 = 400,
  Regular = 400,
  Weight500 = 500,
  Medium = 500,
  Weight600 = 600,
  Semibold = 600,
  Demibold = 600,
  Weight700 = 700,
  Bold = 700,
  Weight800 = 800,
  Heavy = 800,
  Weight900 = 900,
  Black = 900
};

enum class FontVariant : int {
  Default = 0,
  SmallCaps = 1 << 1,
  OldstyleNums = 1 << 2,
  LiningNums = 1 << 3,
  TabularNums = 1 << 4,
  ProportionalNums = 1 << 5,
  StylisticOne = 1 << 6,
  StylisticTwo = 1 << 7,
  StylisticThree = 1 << 8,
  StylisticFour = 1 << 9,
  StylisticFive = 1 << 10,
  StylisticSix = 1 << 11,
  StylisticSeven = 1 << 12,
  StylisticEight = 1 << 13,
  StylisticNine = 1 << 14,
  StylisticTen = 1 << 15,
  StylisticEleven = 1 << 16,
  StylisticTwelve = 1 << 17,
  StylisticThirteen = 1 << 18,
  StylisticFourteen = 1 << 19,
  StylisticFifteen = 1 << 20,
  StylisticSixteen = 1 << 21,
  StylisticSeventeen = 1 << 22,
  StylisticEighteen = 1 << 23,
  StylisticNineteen = 1 << 24,
  StylisticTwenty = 1 << 25
};

enum class DynamicTypeRamp {
  Caption2,
  Caption1,
  Footnote,
  Subheadline,
  Callout,
  Body,
  Headline,
  Title3,
  Title2,
  Title1,
  LargeTitle
};

enum class EllipsizeMode {
  Clip, // Do not add ellipsize, simply clip.
  Head, // Truncate at head of line: "...wxyz".
  Tail, // Truncate at tail of line: "abcd...".
  Middle // Truncate middle of line: "ab...yz".
};

enum class TextBreakStrategy {
  Simple, // Simple strategy.
  HighQuality, // High-quality strategy, including hyphenation.
  Balanced // Balances line lengths.
};

enum class TextAlignment {
  Natural, // Indicates the default alignment for script.
  Left, // Visually left aligned.
  Center, // Visually centered.
  Right, // Visually right aligned.
  Justified // Fully-justified. The last line in a paragraph is natural-aligned.
};

enum class TextAlignmentVertical {
  Auto,
  Top,
  Bottom,
  Center,
};

enum class WritingDirection {
  Natural, // Determines direction using the Unicode Bidi Algorithm rules P2 and
           // P3.
  LeftToRight, // Left to right writing direction.
  RightToLeft // Right to left writing direction.
};

enum class LineBreakStrategy {
  None, // Don't use any line break strategies
  PushOut, // Use the push out line break strategy.
  HangulWordPriority, // When specified, it prohibits breaking between Hangul
                      // characters.
  Standard // Use the same configuration of line break strategies that the
           // system uses for standard UI labels.
};

enum class LineBreakMode {
  Word, // Wrap at word boundaries, default
  Char, // Wrap at character boundaries
  Clip, // Simply clip
  Head, // Truncate at head of line: "...wxyz"
  Middle, // Truncate middle of line:  "ab...yz"
  Tail // Truncate at tail of line: "abcd..."
};

enum class TextDecorationLineType { None, Underline, Strikethrough, UnderlineStrikethrough };

enum class TextDecorationStyle { Solid, Double, Dotted, Dashed, Wavy };

enum class TextTransform {
  None,
  Uppercase,
  Lowercase,
  Capitalize,
  Unset,
};

enum class HyphenationFrequency {
  None, // No hyphenation.
  Normal, // Less frequent hyphenation.
  Full // Standard amount of hyphenation.
};

} // namespace facebook::react
