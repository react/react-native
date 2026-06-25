/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <cstdint>
#include <optional>
#include <string_view>

#include <react/renderer/css/CSSDataType.h>
#include <react/utils/fnv1a.h>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * One of any predefined CSS keywords.
 * https://www.w3.org/TR/css-values-4/#keywords
 */
enum class CSSKeyword : uint8_t {
  Absolute,
  At,
  Auto,
  Baseline,
  Block,
  Bottom,
  Center,
  Clip,
  Column,
  ColumnReverse,
  CommonLigatures,
  Content,
  Contents,
  Contextual,
  Dashed,
  DiscretionaryLigatures,
  Dotted,
  Double,
  End,
  Fixed,
  Flex,
  FlexEnd,
  FlexStart,
  Grid,
  Groove,
  Hidden,
  HistoricalLigatures,
  Inherit,
  Initial,
  Inline,
  InlineBlock,
  InlineFlex,
  InlineGrid,
  Inset,
  Left,
  LiningNums,
  Ltr,
  MaxContent,
  Medium,
  MinContent,
  NoCommonLigatures,
  NoContextual,
  NoDiscretionaryLigatures,
  NoHistoricalLigatures,
  None,
  Normal,
  NoWrap,
  OldstyleNums,
  Outset,
  ProportionalNums,
  Relative,
  Ridge,
  Right,
  Row,
  RowReverse,
  Rtl,
  Scroll,
  SmallCaps,
  Solid,
  SpaceAround,
  SpaceBetween,
  SpaceEvenly,
  Start,
  Static,
  Sticky,
  Stretch,
  StylisticEight,
  StylisticEighteen,
  StylisticEleven,
  StylisticFifteen,
  StylisticFive,
  StylisticFour,
  StylisticFourteen,
  StylisticNine,
  StylisticNineteen,
  StylisticOne,
  StylisticSeven,
  StylisticSeventeen,
  StylisticSix,
  StylisticSixteen,
  StylisticTen,
  StylisticThirteen,
  StylisticThree,
  StylisticTwelve,
  StylisticTwenty,
  StylisticTwo,
  TabularNums,
  Thick,
  Thin,
  To,
  Top,
  Unset,
  Visible,
  Wrap,
  WrapReverse,
};

/**
 * Represents a constrained set of CSS keywords.
 */
template <typename T>
concept CSSKeywordSet =
    std::is_enum_v<T> && std::is_same_v<std::underlying_type_t<T>, std::underlying_type_t<CSSKeyword>>;

/**
 * CSS-wide keywords.
 * https://www.w3.org/TR/css-values-4/#common-keywords
 */
enum class CSSWideKeyword : std::underlying_type_t<CSSKeyword> {
  Inherit = to_underlying(CSSKeyword::Inherit),
  Initial = to_underlying(CSSKeyword::Initial),
  Unset = to_underlying(CSSKeyword::Unset),
};

#define CSS_DEFINE_KEYWORD(enumName, name)                                   \
  namespace detail::css::keywords {                                          \
  template <typename T>                                                      \
  concept has##enumName = (CSSKeywordSet<T> && requires() { T::enumName; }); \
  constexpr std::string_view enumName{name};                                 \
  static_assert(has##enumName<CSSKeyword>);                                  \
  }

CSS_DEFINE_KEYWORD(Absolute, "absolute")
CSS_DEFINE_KEYWORD(At, "at")
CSS_DEFINE_KEYWORD(Auto, "auto")
CSS_DEFINE_KEYWORD(Baseline, "baseline")
CSS_DEFINE_KEYWORD(Block, "block")
CSS_DEFINE_KEYWORD(Bottom, "bottom")
CSS_DEFINE_KEYWORD(Center, "center")
CSS_DEFINE_KEYWORD(Clip, "clip")
CSS_DEFINE_KEYWORD(Column, "column")
CSS_DEFINE_KEYWORD(ColumnReverse, "column-reverse")
CSS_DEFINE_KEYWORD(CommonLigatures, "common-ligatures")
CSS_DEFINE_KEYWORD(Content, "content")
CSS_DEFINE_KEYWORD(Contents, "contents")
CSS_DEFINE_KEYWORD(Contextual, "contextual")
CSS_DEFINE_KEYWORD(Dashed, "dashed")
CSS_DEFINE_KEYWORD(DiscretionaryLigatures, "discretionary-ligatures")
CSS_DEFINE_KEYWORD(Dotted, "dotted")
CSS_DEFINE_KEYWORD(Double, "double")
CSS_DEFINE_KEYWORD(End, "end")
CSS_DEFINE_KEYWORD(Fixed, "fixed")
CSS_DEFINE_KEYWORD(Flex, "flex")
CSS_DEFINE_KEYWORD(FlexEnd, "flex-end")
CSS_DEFINE_KEYWORD(FlexStart, "flex-start")
CSS_DEFINE_KEYWORD(Grid, "grid")
CSS_DEFINE_KEYWORD(Groove, "groove")
CSS_DEFINE_KEYWORD(Hidden, "hidden")
CSS_DEFINE_KEYWORD(HistoricalLigatures, "historical-ligatures")
CSS_DEFINE_KEYWORD(Inherit, "inherit")
CSS_DEFINE_KEYWORD(Initial, "initial")
CSS_DEFINE_KEYWORD(Inline, "inline")
CSS_DEFINE_KEYWORD(InlineBlock, "inline-block")
CSS_DEFINE_KEYWORD(InlineFlex, "inline-flex")
CSS_DEFINE_KEYWORD(InlineGrid, "inline-grid")
CSS_DEFINE_KEYWORD(Inset, "inset")
CSS_DEFINE_KEYWORD(Left, "left")
CSS_DEFINE_KEYWORD(LiningNums, "lining-nums")
CSS_DEFINE_KEYWORD(Ltr, "ltr")
CSS_DEFINE_KEYWORD(MaxContent, "max-content")
CSS_DEFINE_KEYWORD(Medium, "medium")
CSS_DEFINE_KEYWORD(MinContent, "min-content")
CSS_DEFINE_KEYWORD(NoCommonLigatures, "no-common-ligatures")
CSS_DEFINE_KEYWORD(NoContextual, "no-contextual")
CSS_DEFINE_KEYWORD(NoDiscretionaryLigatures, "no-discretionary-ligatures")
CSS_DEFINE_KEYWORD(NoHistoricalLigatures, "no-historical-ligatures")
CSS_DEFINE_KEYWORD(None, "none")
CSS_DEFINE_KEYWORD(Normal, "normal")
CSS_DEFINE_KEYWORD(NoWrap, "nowrap")
CSS_DEFINE_KEYWORD(OldstyleNums, "oldstyle-nums")
CSS_DEFINE_KEYWORD(Outset, "outset")
CSS_DEFINE_KEYWORD(ProportionalNums, "proportional-nums")
CSS_DEFINE_KEYWORD(Relative, "relative")
CSS_DEFINE_KEYWORD(Ridge, "ridge")
CSS_DEFINE_KEYWORD(Right, "right")
CSS_DEFINE_KEYWORD(Row, "row")
CSS_DEFINE_KEYWORD(RowReverse, "row-reverse")
CSS_DEFINE_KEYWORD(Rtl, "rtl")
CSS_DEFINE_KEYWORD(Scroll, "scroll")
CSS_DEFINE_KEYWORD(SmallCaps, "small-caps")
CSS_DEFINE_KEYWORD(Solid, "solid")
CSS_DEFINE_KEYWORD(SpaceAround, "space-around")
CSS_DEFINE_KEYWORD(SpaceBetween, "space-between")
CSS_DEFINE_KEYWORD(SpaceEvenly, "space-evenly")
CSS_DEFINE_KEYWORD(Start, "start")
CSS_DEFINE_KEYWORD(Static, "static")
CSS_DEFINE_KEYWORD(Sticky, "sticky")
CSS_DEFINE_KEYWORD(Stretch, "stretch")
CSS_DEFINE_KEYWORD(StylisticEight, "stylistic-eight")
CSS_DEFINE_KEYWORD(StylisticEighteen, "stylistic-eighteen")
CSS_DEFINE_KEYWORD(StylisticEleven, "stylistic-eleven")
CSS_DEFINE_KEYWORD(StylisticFifteen, "stylistic-fifteen")
CSS_DEFINE_KEYWORD(StylisticFive, "stylistic-five")
CSS_DEFINE_KEYWORD(StylisticFour, "stylistic-four")
CSS_DEFINE_KEYWORD(StylisticFourteen, "stylistic-fourteen")
CSS_DEFINE_KEYWORD(StylisticNine, "stylistic-nine")
CSS_DEFINE_KEYWORD(StylisticNineteen, "stylistic-nineteen")
CSS_DEFINE_KEYWORD(StylisticOne, "stylistic-one")
CSS_DEFINE_KEYWORD(StylisticSeven, "stylistic-seven")
CSS_DEFINE_KEYWORD(StylisticSeventeen, "stylistic-seventeen")
CSS_DEFINE_KEYWORD(StylisticSix, "stylistic-six")
CSS_DEFINE_KEYWORD(StylisticSixteen, "stylistic-sixteen")
CSS_DEFINE_KEYWORD(StylisticTen, "stylistic-ten")
CSS_DEFINE_KEYWORD(StylisticThirteen, "stylistic-thirteen")
CSS_DEFINE_KEYWORD(StylisticThree, "stylistic-three")
CSS_DEFINE_KEYWORD(StylisticTwelve, "stylistic-twelve")
CSS_DEFINE_KEYWORD(StylisticTwenty, "stylistic-twenty")
CSS_DEFINE_KEYWORD(StylisticTwo, "stylistic-two")
CSS_DEFINE_KEYWORD(TabularNums, "tabular-nums")
CSS_DEFINE_KEYWORD(Thick, "thick")
CSS_DEFINE_KEYWORD(Thin, "thin")
CSS_DEFINE_KEYWORD(To, "to")
CSS_DEFINE_KEYWORD(Top, "top")
CSS_DEFINE_KEYWORD(Unset, "unset")
CSS_DEFINE_KEYWORD(Visible, "visible")
CSS_DEFINE_KEYWORD(Wrap, "wrap")
CSS_DEFINE_KEYWORD(WrapReverse, "wrap-reverse")

#define CSS_HANDLE_KEYWORD(name)                                \
  case fnv1a(detail::css::keywords::name):                      \
    if constexpr (detail::css::keywords::has##name<KeywordT>) { \
      return KeywordT::name;                                    \
    }                                                           \
    break;

/**
 * Parses an ident token, case-insensitive, into a keyword.
 *
 * Returns KeywordT::Unset if the ident does not match any entries
 * in the keyword-set, or CSS-wide keywords.
 */
template <CSSKeywordSet KeywordT>
constexpr std::optional<KeywordT> parseCSSKeyword(std::string_view ident)
{
  switch (fnv1aLowercase(ident)) {
    CSS_HANDLE_KEYWORD(Absolute)
    CSS_HANDLE_KEYWORD(At)
    CSS_HANDLE_KEYWORD(Auto)
    CSS_HANDLE_KEYWORD(Baseline)
    CSS_HANDLE_KEYWORD(Block)
    CSS_HANDLE_KEYWORD(Bottom)
    CSS_HANDLE_KEYWORD(Center)
    CSS_HANDLE_KEYWORD(Clip)
    CSS_HANDLE_KEYWORD(Column)
    CSS_HANDLE_KEYWORD(ColumnReverse)
    CSS_HANDLE_KEYWORD(CommonLigatures)
    CSS_HANDLE_KEYWORD(Content)
    CSS_HANDLE_KEYWORD(Contents)
    CSS_HANDLE_KEYWORD(Contextual)
    CSS_HANDLE_KEYWORD(Dashed)
    CSS_HANDLE_KEYWORD(DiscretionaryLigatures)
    CSS_HANDLE_KEYWORD(Dotted)
    CSS_HANDLE_KEYWORD(Double)
    CSS_HANDLE_KEYWORD(End)
    CSS_HANDLE_KEYWORD(Fixed)
    CSS_HANDLE_KEYWORD(Flex)
    CSS_HANDLE_KEYWORD(FlexEnd)
    CSS_HANDLE_KEYWORD(FlexStart)
    CSS_HANDLE_KEYWORD(Grid)
    CSS_HANDLE_KEYWORD(Groove)
    CSS_HANDLE_KEYWORD(Hidden)
    CSS_HANDLE_KEYWORD(HistoricalLigatures)
    CSS_HANDLE_KEYWORD(Inherit)
    CSS_HANDLE_KEYWORD(Initial)
    CSS_HANDLE_KEYWORD(Inline)
    CSS_HANDLE_KEYWORD(InlineBlock)
    CSS_HANDLE_KEYWORD(InlineFlex)
    CSS_HANDLE_KEYWORD(InlineGrid)
    CSS_HANDLE_KEYWORD(Inset)
    CSS_HANDLE_KEYWORD(Left)
    CSS_HANDLE_KEYWORD(LiningNums)
    CSS_HANDLE_KEYWORD(Ltr)
    CSS_HANDLE_KEYWORD(MaxContent)
    CSS_HANDLE_KEYWORD(Medium)
    CSS_HANDLE_KEYWORD(MinContent)
    CSS_HANDLE_KEYWORD(NoCommonLigatures)
    CSS_HANDLE_KEYWORD(NoContextual)
    CSS_HANDLE_KEYWORD(NoDiscretionaryLigatures)
    CSS_HANDLE_KEYWORD(NoHistoricalLigatures)
    CSS_HANDLE_KEYWORD(None)
    CSS_HANDLE_KEYWORD(Normal)
    CSS_HANDLE_KEYWORD(NoWrap)
    CSS_HANDLE_KEYWORD(OldstyleNums)
    CSS_HANDLE_KEYWORD(Outset)
    CSS_HANDLE_KEYWORD(ProportionalNums)
    CSS_HANDLE_KEYWORD(Relative)
    CSS_HANDLE_KEYWORD(Ridge)
    CSS_HANDLE_KEYWORD(Right)
    CSS_HANDLE_KEYWORD(Row)
    CSS_HANDLE_KEYWORD(RowReverse)
    CSS_HANDLE_KEYWORD(Rtl)
    CSS_HANDLE_KEYWORD(Scroll)
    CSS_HANDLE_KEYWORD(SmallCaps)
    CSS_HANDLE_KEYWORD(Solid)
    CSS_HANDLE_KEYWORD(SpaceAround)
    CSS_HANDLE_KEYWORD(SpaceBetween)
    CSS_HANDLE_KEYWORD(SpaceEvenly)
    CSS_HANDLE_KEYWORD(Start)
    CSS_HANDLE_KEYWORD(Static)
    CSS_HANDLE_KEYWORD(Sticky)
    CSS_HANDLE_KEYWORD(Stretch)
    CSS_HANDLE_KEYWORD(StylisticEight)
    CSS_HANDLE_KEYWORD(StylisticEighteen)
    CSS_HANDLE_KEYWORD(StylisticEleven)
    CSS_HANDLE_KEYWORD(StylisticFifteen)
    CSS_HANDLE_KEYWORD(StylisticFive)
    CSS_HANDLE_KEYWORD(StylisticFour)
    CSS_HANDLE_KEYWORD(StylisticFourteen)
    CSS_HANDLE_KEYWORD(StylisticNine)
    CSS_HANDLE_KEYWORD(StylisticNineteen)
    CSS_HANDLE_KEYWORD(StylisticOne)
    CSS_HANDLE_KEYWORD(StylisticSeven)
    CSS_HANDLE_KEYWORD(StylisticSeventeen)
    CSS_HANDLE_KEYWORD(StylisticSix)
    CSS_HANDLE_KEYWORD(StylisticSixteen)
    CSS_HANDLE_KEYWORD(StylisticTen)
    CSS_HANDLE_KEYWORD(StylisticThirteen)
    CSS_HANDLE_KEYWORD(StylisticThree)
    CSS_HANDLE_KEYWORD(StylisticTwelve)
    CSS_HANDLE_KEYWORD(StylisticTwenty)
    CSS_HANDLE_KEYWORD(StylisticTwo)
    CSS_HANDLE_KEYWORD(TabularNums)
    CSS_HANDLE_KEYWORD(Thick)
    CSS_HANDLE_KEYWORD(Thin)
    CSS_HANDLE_KEYWORD(To)
    CSS_HANDLE_KEYWORD(Top)
    CSS_HANDLE_KEYWORD(Unset)
    CSS_HANDLE_KEYWORD(Visible)
    CSS_HANDLE_KEYWORD(Wrap)
    CSS_HANDLE_KEYWORD(WrapReverse)
    default:
      return std::nullopt;
  }

  return std::nullopt;
}

template <CSSKeywordSet KeywordT>
struct CSSDataTypeParser<KeywordT> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken &token) -> std::optional<KeywordT>
  {
    if (token.type() == CSSTokenType::Ident) {
      return parseCSSKeyword<KeywordT>(token.stringValue());
    }

    return {};
  }
};

static_assert(CSSDataType<CSSWideKeyword>);

} // namespace facebook::react
