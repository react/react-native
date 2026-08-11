/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSList.h>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * Represents a possible font-variant keyword.
 * https://drafts.csswg.org/css-fonts/#font-variant-prop
 */
enum class CSSFontVariant : std::underlying_type_t<CSSKeyword> {
  SmallCaps = to_underlying(CSSKeyword::SmallCaps),
  OldstyleNums = to_underlying(CSSKeyword::OldstyleNums),
  LiningNums = to_underlying(CSSKeyword::LiningNums),
  TabularNums = to_underlying(CSSKeyword::TabularNums),
  CommonLigatures = to_underlying(CSSKeyword::CommonLigatures),
  NoCommonLigatures = to_underlying(CSSKeyword::NoCommonLigatures),
  DiscretionaryLigatures = to_underlying(CSSKeyword::DiscretionaryLigatures),
  NoDiscretionaryLigatures =
      to_underlying(CSSKeyword::NoDiscretionaryLigatures),
  HistoricalLigatures = to_underlying(CSSKeyword::HistoricalLigatures),
  NoHistoricalLigatures = to_underlying(CSSKeyword::NoHistoricalLigatures),
  Contextual = to_underlying(CSSKeyword::Contextual),
  NoContextual = to_underlying(CSSKeyword::NoContextual),
  ProportionalNums = to_underlying(CSSKeyword::ProportionalNums),
  StylisticOne = to_underlying(CSSKeyword::StylisticOne),
  StylisticTwo = to_underlying(CSSKeyword::StylisticTwo),
  StylisticThree = to_underlying(CSSKeyword::StylisticThree),
  StylisticFour = to_underlying(CSSKeyword::StylisticFour),
  StylisticFive = to_underlying(CSSKeyword::StylisticFive),
  StylisticSix = to_underlying(CSSKeyword::StylisticSix),
  StylisticSeven = to_underlying(CSSKeyword::StylisticSeven),
  StylisticEight = to_underlying(CSSKeyword::StylisticEight),
  StylisticNine = to_underlying(CSSKeyword::StylisticNine),
  StylisticTen = to_underlying(CSSKeyword::StylisticTen),
  StylisticEleven = to_underlying(CSSKeyword::StylisticEleven),
  StylisticTwelve = to_underlying(CSSKeyword::StylisticTwelve),
  StylisticThirteen = to_underlying(CSSKeyword::StylisticThirteen),
  StylisticFourteen = to_underlying(CSSKeyword::StylisticFourteen),
  StylisticFifteen = to_underlying(CSSKeyword::StylisticFifteen),
  StylisticSixteen = to_underlying(CSSKeyword::StylisticSixteen),
  StylisticSeventeen = to_underlying(CSSKeyword::StylisticSeventeen),
  StylisticEighteen = to_underlying(CSSKeyword::StylisticEighteen),
  StylisticNineteen = to_underlying(CSSKeyword::StylisticNineteen),
  StylisticTwenty = to_underlying(CSSKeyword::StylisticTwenty),
};

static_assert(CSSDataType<CSSFontVariant>);

/**
 * Represents a whitespace-separated list of at least one font-variant.
 */
using CSSFontVariantList = CSSWhitespaceSeparatedList<CSSFontVariant>;

} // namespace facebook::react
