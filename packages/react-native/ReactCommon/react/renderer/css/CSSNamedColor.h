/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

#include <react/utils/fnv1a.h>

namespace facebook::react {

/**
 * Parse one of the given <named-color>, including the "transparent" special
 * keyword.
 * https://www.w3.org/TR/css-color-4/#named-colors
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseCSSNamedColor(std::string_view name) {
  switch (fnv1aLowercase(name)) {
    case fnv1a("aliceblue"):
      return CSSColor{240, 248, 255, 255};
    case fnv1a("antiquewhite"):
      return CSSColor{250, 235, 215, 255};
    case fnv1a("aqua"):
      return CSSColor{0, 255, 255, 255};
    case fnv1a("aquamarine"):
      return CSSColor{127, 255, 212, 255};
    case fnv1a("azure"):
      return CSSColor{240, 255, 255, 255};
    case fnv1a("beige"):
      return CSSColor{245, 245, 220, 255};
    case fnv1a("bisque"):
      return CSSColor{255, 228, 196, 255};
    case fnv1a("black"):
      return CSSColor{0, 0, 0, 255};
    case fnv1a("blanchedalmond"):
      return CSSColor{255, 235, 205, 255};
    case fnv1a("blue"):
      return CSSColor{0, 0, 255, 255};
    case fnv1a("blueviolet"):
      return CSSColor{138, 43, 226, 255};
    case fnv1a("brown"):
      return CSSColor{165, 42, 42, 255};
    case fnv1a("burlywood"):
      return CSSColor{222, 184, 135, 255};
    case fnv1a("cadetblue"):
      return CSSColor{95, 158, 160, 255};
    case fnv1a("chartreuse"):
      return CSSColor{127, 255, 0, 255};
    case fnv1a("chocolate"):
      return CSSColor{210, 105, 30, 255};
    case fnv1a("coral"):
      return CSSColor{255, 127, 80, 255};
    case fnv1a("cornflowerblue"):
      return CSSColor{100, 149, 237, 255};
    case fnv1a("cornsilk"):
      return CSSColor{255, 248, 220, 255};
    case fnv1a("crimson"):
      return CSSColor{220, 20, 60, 255};
    case fnv1a("cyan"):
      return CSSColor{0, 255, 255, 255};
    case fnv1a("darkblue"):
      return CSSColor{0, 0, 139, 255};
    case fnv1a("darkcyan"):
      return CSSColor{0, 139, 139, 255};
    case fnv1a("darkgoldenrod"):
      return CSSColor{184, 134, 11, 255};
    case fnv1a("darkgray"):
      return CSSColor{169, 169, 169, 255};
    case fnv1a("darkgreen"):
      return CSSColor{0, 100, 0, 255};
    case fnv1a("darkgrey"):
      return CSSColor{169, 169, 169, 255};
    case fnv1a("darkkhaki"):
      return CSSColor{189, 183, 107, 255};
    case fnv1a("darkmagenta"):
      return CSSColor{139, 0, 139, 255};
    case fnv1a("darkolivegreen"):
      return CSSColor{85, 107, 47, 255};
    case fnv1a("darkorange"):
      return CSSColor{255, 140, 0, 255};
    case fnv1a("darkorchid"):
      return CSSColor{153, 50, 204, 255};
    case fnv1a("darkred"):
      return CSSColor{139, 0, 0, 255};
    case fnv1a("darksalmon"):
      return CSSColor{233, 150, 122, 255};
    case fnv1a("darkseagreen"):
      return CSSColor{143, 188, 143, 255};
    case fnv1a("darkslateblue"):
      return CSSColor{72, 61, 139, 255};
    case fnv1a("darkslategray"):
      return CSSColor{47, 79, 79, 255};
    case fnv1a("darkslategrey"):
      return CSSColor{47, 79, 79, 255};
    case fnv1a("darkturquoise"):
      return CSSColor{0, 206, 209, 255};
    case fnv1a("darkviolet"):
      return CSSColor{148, 0, 211, 255};
    case fnv1a("deeppink"):
      return CSSColor{255, 20, 147, 255};
    case fnv1a("deepskyblue"):
      return CSSColor{0, 191, 255, 255};
    case fnv1a("dimgray"):
      return CSSColor{105, 105, 105, 255};
    case fnv1a("dimgrey"):
      return CSSColor{105, 105, 105, 255};
    case fnv1a("dodgerblue"):
      return CSSColor{30, 144, 255, 255};
    case fnv1a("firebrick"):
      return CSSColor{178, 34, 34, 255};
    case fnv1a("floralwhite"):
      return CSSColor{255, 250, 240, 255};
    case fnv1a("forestgreen"):
      return CSSColor{34, 139, 34, 255};
    case fnv1a("fuchsia"):
      return CSSColor{255, 0, 255, 255};
    case fnv1a("gainsboro"):
      return CSSColor{220, 220, 220, 255};
    case fnv1a("ghostwhite"):
      return CSSColor{248, 248, 255, 255};
    case fnv1a("gold"):
      return CSSColor{255, 215, 0, 255};
    case fnv1a("goldenrod"):
      return CSSColor{218, 165, 32, 255};
    case fnv1a("gray"):
      return CSSColor{128, 128, 128, 255};
    case fnv1a("green"):
      return CSSColor{0, 128, 0, 255};
    case fnv1a("greenyellow"):
      return CSSColor{173, 255, 47, 255};
    case fnv1a("grey"):
      return CSSColor{128, 128, 128, 255};
    case fnv1a("honeydew"):
      return CSSColor{240, 255, 240, 255};
    case fnv1a("hotpink"):
      return CSSColor{255, 105, 180, 255};
    case fnv1a("indianred"):
      return CSSColor{205, 92, 92, 255};
    case fnv1a("indigo"):
      return CSSColor{75, 0, 130, 255};
    case fnv1a("ivory"):
      return CSSColor{255, 255, 240, 255};
    case fnv1a("khaki"):
      return CSSColor{240, 230, 140, 255};
    case fnv1a("lavender"):
      return CSSColor{230, 230, 250, 255};
    case fnv1a("lavenderblush"):
      return CSSColor{255, 240, 245, 255};
    case fnv1a("lawngreen"):
      return CSSColor{124, 252, 0, 255};
    case fnv1a("lemonchiffon"):
      return CSSColor{255, 250, 205, 255};
    case fnv1a("lightblue"):
      return CSSColor{173, 216, 230, 255};
    case fnv1a("lightcoral"):
      return CSSColor{240, 128, 128, 255};
    case fnv1a("lightcyan"):
      return CSSColor{224, 255, 255, 255};
    case fnv1a("lightgoldenrodyellow"):
      return CSSColor{250, 250, 210, 255};
    case fnv1a("lightgray"):
      return CSSColor{211, 211, 211, 255};
    case fnv1a("lightgreen"):
      return CSSColor{144, 238, 144, 255};
    case fnv1a("lightgrey"):
      return CSSColor{211, 211, 211, 255};
    case fnv1a("lightpink"):
      return CSSColor{255, 182, 193, 255};
    case fnv1a("lightsalmon"):
      return CSSColor{255, 160, 122, 255};
    case fnv1a("lightseagreen"):
      return CSSColor{32, 178, 170, 255};
    case fnv1a("lightskyblue"):
      return CSSColor{135, 206, 250, 255};
    case fnv1a("lightslategray"):
      return CSSColor{119, 136, 153, 255};
    case fnv1a("lightslategrey"):
      return CSSColor{119, 136, 153, 255};
    case fnv1a("lightsteelblue"):
      return CSSColor{176, 196, 222, 255};
    case fnv1a("lightyellow"):
      return CSSColor{255, 255, 224, 255};
    case fnv1a("lime"):
      return CSSColor{0, 255, 0, 255};
    case fnv1a("limegreen"):
      return CSSColor{50, 205, 50, 255};
    case fnv1a("linen"):
      return CSSColor{250, 240, 230, 255};
    case fnv1a("magenta"):
      return CSSColor{255, 0, 255, 255};
    case fnv1a("maroon"):
      return CSSColor{128, 0, 0, 255};
    case fnv1a("mediumaquamarine"):
      return CSSColor{102, 205, 170, 255};
    case fnv1a("mediumblue"):
      return CSSColor{0, 0, 205, 255};
    case fnv1a("mediumorchid"):
      return CSSColor{186, 85, 211, 255};
    case fnv1a("mediumpurple"):
      return CSSColor{147, 112, 219, 255};
    case fnv1a("mediumseagreen"):
      return CSSColor{60, 179, 113, 255};
    case fnv1a("mediumslateblue"):
      return CSSColor{123, 104, 238, 255};
    case fnv1a("mediumspringgreen"):
      return CSSColor{0, 250, 154, 255};
    case fnv1a("mediumturquoise"):
      return CSSColor{72, 209, 204, 255};
    case fnv1a("mediumvioletred"):
      return CSSColor{199, 21, 133, 255};
    case fnv1a("midnightblue"):
      return CSSColor{25, 25, 112, 255};
    case fnv1a("mintcream"):
      return CSSColor{245, 255, 250, 255};
    case fnv1a("mistyrose"):
      return CSSColor{255, 228, 225, 255};
    case fnv1a("moccasin"):
      return CSSColor{255, 228, 181, 255};
    case fnv1a("navajowhite"):
      return CSSColor{255, 222, 173, 255};
    case fnv1a("navy"):
      return CSSColor{0, 0, 128, 255};
    case fnv1a("oldlace"):
      return CSSColor{253, 245, 230, 255};
    case fnv1a("olive"):
      return CSSColor{128, 128, 0, 255};
    case fnv1a("olivedrab"):
      return CSSColor{107, 142, 35, 255};
    case fnv1a("orange"):
      return CSSColor{255, 165, 0, 255};
    case fnv1a("orangered"):
      return CSSColor{255, 69, 0, 255};
    case fnv1a("orchid"):
      return CSSColor{218, 112, 214, 255};
    case fnv1a("palegoldenrod"):
      return CSSColor{238, 232, 170, 255};
    case fnv1a("palegreen"):
      return CSSColor{152, 251, 152, 255};
    case fnv1a("paleturquoise"):
      return CSSColor{175, 238, 238, 255};
    case fnv1a("palevioletred"):
      return CSSColor{219, 112, 147, 255};
    case fnv1a("papayawhip"):
      return CSSColor{255, 239, 213, 255};
    case fnv1a("peachpuff"):
      return CSSColor{255, 218, 185, 255};
    case fnv1a("peru"):
      return CSSColor{205, 133, 63, 255};
    case fnv1a("pink"):
      return CSSColor{255, 192, 203, 255};
    case fnv1a("plum"):
      return CSSColor{221, 160, 221, 255};
    case fnv1a("powderblue"):
      return CSSColor{176, 224, 230, 255};
    case fnv1a("purple"):
      return CSSColor{128, 0, 128, 255};
    case fnv1a("rebeccapurple"):
      return CSSColor{102, 51, 153, 255};
    case fnv1a("red"):
      return CSSColor{255, 0, 0, 255};
    case fnv1a("rosybrown"):
      return CSSColor{188, 143, 143, 255};
    case fnv1a("royalblue"):
      return CSSColor{65, 105, 225, 255};
    case fnv1a("saddlebrown"):
      return CSSColor{139, 69, 19, 255};
    case fnv1a("salmon"):
      return CSSColor{250, 128, 114, 255};
    case fnv1a("sandybrown"):
      return CSSColor{244, 164, 96, 255};
    case fnv1a("seagreen"):
      return CSSColor{46, 139, 87, 255};
    case fnv1a("seashell"):
      return CSSColor{255, 245, 238, 255};
    case fnv1a("sienna"):
      return CSSColor{160, 82, 45, 255};
    case fnv1a("silver"):
      return CSSColor{192, 192, 192, 255};
    case fnv1a("skyblue"):
      return CSSColor{135, 206, 235, 255};
    case fnv1a("slateblue"):
      return CSSColor{106, 90, 205, 255};
    case fnv1a("slategray"):
      return CSSColor{112, 128, 144, 255};
    case fnv1a("slategrey"):
      return CSSColor{112, 128, 144, 255};
    case fnv1a("snow"):
      return CSSColor{255, 250, 250, 255};
    case fnv1a("springgreen"):
      return CSSColor{0, 255, 127, 255};
    case fnv1a("steelblue"):
      return CSSColor{70, 130, 180, 255};
    case fnv1a("tan"):
      return CSSColor{210, 180, 140, 255};
    case fnv1a("teal"):
      return CSSColor{0, 128, 128, 255};
    case fnv1a("thistle"):
      return CSSColor{216, 191, 216, 255};
    case fnv1a("tomato"):
      return CSSColor{255, 99, 71, 255};
    case fnv1a("transparent"):
      return CSSColor{0, 0, 0, 0};
    case fnv1a("turquoise"):
      return CSSColor{64, 224, 208, 255};
    case fnv1a("violet"):
      return CSSColor{238, 130, 238, 255};
    case fnv1a("wheat"):
      return CSSColor{245, 222, 179, 255};
    case fnv1a("white"):
      return CSSColor{255, 255, 255, 255};
    case fnv1a("whitesmoke"):
      return CSSColor{245, 245, 245, 255};
    case fnv1a("yellow"):
      return CSSColor{255, 255, 0, 255};
    case fnv1a("yellowgreen"):
      return CSSColor{154, 205, 50, 255};
    default:
      return std::nullopt;
  }
}

} // namespace facebook::react
