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

#include <react/utils/fnv1a.h>

namespace facebook::react {

/**
 * Unit for the CSS <length> type.
 * https://www.w3.org/TR/css-values-4/#lengths
 */
enum class CSSLengthUnit : uint8_t {
  Cap,
  Ch,
  Cm,
  Dvb,
  Dvh,
  Dvi,
  Dvmax,
  Dvmin,
  Dvw,
  Em,
  Ex,
  Ic,
  In,
  Lh,
  Lvb,
  Lvh,
  Lvi,
  Lvmax,
  Lvmin,
  Lvw,
  Mm,
  Pc,
  Pt,
  Px,
  Q,
  Rcap,
  Rch,
  Rem,
  Rex,
  Ric,
  Rlh,
  Svb,
  Svh,
  Svi,
  Svmax,
  Svmin,
  Svw,
  Vb,
  Vh,
  Vi,
  Vmax,
  Vmin,
  Vw,
};

/**
 * Parses a unit from a dimension token into a CSS length unit.
 */
constexpr std::optional<CSSLengthUnit> parseCSSLengthUnit(
    std::string_view unit) {
  switch (fnv1aLowercase(unit)) {
    case fnv1a("cap"):
      return CSSLengthUnit::Cap;
    case fnv1a("ch"):
      return CSSLengthUnit::Ch;
    case fnv1a("cm"):
      return CSSLengthUnit::Cm;
    case fnv1a("dvb"):
      return CSSLengthUnit::Dvb;
    case fnv1a("dvh"):
      return CSSLengthUnit::Dvh;
    case fnv1a("dvi"):
      return CSSLengthUnit::Dvi;
    case fnv1a("dvmax"):
      return CSSLengthUnit::Dvmax;
    case fnv1a("dvmin"):
      return CSSLengthUnit::Dvmin;
    case fnv1a("dvw"):
      return CSSLengthUnit::Dvw;
    case fnv1a("em"):
      return CSSLengthUnit::Em;
    case fnv1a("ex"):
      return CSSLengthUnit::Ex;
    case fnv1a("ic"):
      return CSSLengthUnit::Ic;
    case fnv1a("in"):
      return CSSLengthUnit::In;
    case fnv1a("lh"):
      return CSSLengthUnit::Lh;
    case fnv1a("lvb"):
      return CSSLengthUnit::Lvb;
    case fnv1a("lvh"):
      return CSSLengthUnit::Lvh;
    case fnv1a("lvi"):
      return CSSLengthUnit::Lvi;
    case fnv1a("lvmax"):
      return CSSLengthUnit::Lvmax;
    case fnv1a("lvmin"):
      return CSSLengthUnit::Lvmin;
    case fnv1a("lvw"):
      return CSSLengthUnit::Lvw;
    case fnv1a("mm"):
      return CSSLengthUnit::Mm;
    case fnv1a("pc"):
      return CSSLengthUnit::Pc;
    case fnv1a("pt"):
      return CSSLengthUnit::Pt;
    case fnv1a("px"):
      return CSSLengthUnit::Px;
    case fnv1a("q"):
      return CSSLengthUnit::Q;
    case fnv1a("rcap"):
      return CSSLengthUnit::Rcap;
    case fnv1a("rch"):
      return CSSLengthUnit::Rch;
    case fnv1a("rem"):
      return CSSLengthUnit::Rem;
    case fnv1a("rex"):
      return CSSLengthUnit::Rex;
    case fnv1a("ric"):
      return CSSLengthUnit::Ric;
    case fnv1a("rlh"):
      return CSSLengthUnit::Rlh;
    case fnv1a("svb"):
      return CSSLengthUnit::Svb;
    case fnv1a("svh"):
      return CSSLengthUnit::Svh;
    case fnv1a("svi"):
      return CSSLengthUnit::Svi;
    case fnv1a("svmax"):
      return CSSLengthUnit::Svmax;
    case fnv1a("svmin"):
      return CSSLengthUnit::Svmin;
    case fnv1a("svw"):
      return CSSLengthUnit::Svw;
    case fnv1a("vb"):
      return CSSLengthUnit::Vb;
    case fnv1a("vh"):
      return CSSLengthUnit::Vh;
    case fnv1a("vi"):
      return CSSLengthUnit::Vi;
    case fnv1a("vmax"):
      return CSSLengthUnit::Vmax;
    case fnv1a("vmin"):
      return CSSLengthUnit::Vmin;
    case fnv1a("vw"):
      return CSSLengthUnit::Vw;
    default:
      return std::nullopt;
  }
}

} // namespace facebook::react
