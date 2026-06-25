/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <algorithm>
#include <cmath>
#include <cstdint>
#include <optional>
#include <string_view>
#include <tuple>

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/PackTraits.h>
#include <react/utils/fnv1a.h>

namespace facebook::react {

namespace detail {

constexpr uint8_t clamp255Component(float f)
{
  // Implementations should honor the precision of the channel as authored or
  // calculated wherever possible. If this is not possible, the channel should
  // be rounded towards +∞.
  // https://www.w3.org/TR/css-color-4/#rgb-functions
  auto i = static_cast<int32_t>(f);
  auto ceiled = f > i ? i + 1 : i;
  return static_cast<uint8_t>(std::clamp(ceiled, 0, 255));
}

constexpr std::optional<float> normalizeNumberComponent(const std::variant<std::monostate, CSSNumber> &component)
{
  if (std::holds_alternative<CSSNumber>(component)) {
    return std::get<CSSNumber>(component).value;
  }

  return {};
}

constexpr uint8_t clampAlpha(std::optional<float> alpha)
{
  return alpha.has_value() ? clamp255Component(*alpha * 255.0f) : static_cast<uint8_t>(255u);
}

inline float normalizeHue(float hue)
{
  auto rem = std::remainder(hue, 360.0f);
  return (rem < 0 ? rem + 360 : rem) / 360.0f;
}

inline std::optional<float> normalizeHueComponent(const std::variant<std::monostate, CSSNumber, CSSAngle> &component)
{
  if (std::holds_alternative<CSSNumber>(component)) {
    return normalizeHue(std::get<CSSNumber>(component).value);
  } else if (std::holds_alternative<CSSAngle>(component)) {
    return normalizeHue(std::get<CSSAngle>(component).degrees);
  }

  return {};
}

constexpr float hueToRgb(float p, float q, float t)
{
  if (t < 0.0f) {
    t += 1.0f;
  }
  if (t > 1.0f) {
    t -= 1.0f;
  }
  if (t < 1.0f / 6.0f) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1.0f / 2.0f) {
    return q;
  }
  if (t < 2.0f / 3.0f) {
    return p + (q - p) * (2.0f / 3.0f - t) * 6.0f;
  }
  return p;
}

inline std::tuple<uint8_t, uint8_t, uint8_t> hslToRgb(float h, float s, float l)
{
  s = std::clamp(s / 100.0f, 0.0f, 1.0f);
  l = std::clamp(l / 100.0f, 0.0f, 1.0f);

  auto q = l < 0.5f ? l * (1.0f + s) : l + s - l * s;
  auto p = 2.0f * l - q;

  auto r = hueToRgb(p, q, h + 1.0f / 3.0f);
  auto g = hueToRgb(p, q, h);
  auto b = hueToRgb(p, q, h - 1.0f / 3.0f);

  return {
      static_cast<uint8_t>(std::round(r * 255.0f)),
      static_cast<uint8_t>(std::round(g * 255.0f)),
      static_cast<uint8_t>(std::round(b * 255.0f)),
  };
}

inline std::tuple<uint8_t, uint8_t, uint8_t> hwbToRgb(float h, float w, float b)
{
  w = std::clamp(w / 100.0f, 0.0f, 1.0f);
  b = std::clamp(b / 100.0f, 0.0f, 1.0f);

  if (w + b >= 1.0f) {
    auto gray = w / (w + b);
    return {
        static_cast<uint8_t>(std::round(gray * 255.0f)),
        static_cast<uint8_t>(std::round(gray * 255.0f)),
        static_cast<uint8_t>(std::round(gray * 255.0f)),
    };
  }

  auto red = hueToRgb(0.0f, 1.0f, h + 1.0f / 3.0f) * (1.0f - w - b) + w;
  auto green = hueToRgb(0.0f, 1.0f, h) * (1.0f - w - b) + w;
  auto blue = hueToRgb(0.0f, 1.0f, h - 1.0f / 3.0f) * (1.0f - w - b) + w;

  return {
      static_cast<uint8_t>(std::round(red * 255.0f)),
      static_cast<uint8_t>(std::round(green * 255.0f)),
      static_cast<uint8_t>(std::round(blue * 255.0f)),
  };
}

template <typename... ComponentT>
  requires((std::is_same_v<CSSNumber, ComponentT> || std::is_same_v<CSSPercentage, ComponentT>) && ...)
constexpr std::optional<float> normalizeComponent(
    const std::variant<std::monostate, ComponentT...> &component,
    float baseValue)
{
  if constexpr (traits::containsType<CSSPercentage, ComponentT...>()) {
    if (std::holds_alternative<CSSPercentage>(component)) {
      return std::get<CSSPercentage>(component).value / 100.0f * baseValue;
    }
  }

  if constexpr (traits::containsType<CSSNumber, ComponentT...>()) {
    if (std::holds_alternative<CSSNumber>(component)) {
      return std::get<CSSNumber>(component).value;
    }
  }

  return {};
}

template <CSSDataType... FirstComponentAllowedTypesT>
constexpr bool isLegacyColorFunction(CSSValueParser &parser)
{
  auto saved = parser.syntaxParser();
  auto next = parser.parseNextValue<FirstComponentAllowedTypesT...>();
  if (std::holds_alternative<std::monostate>(next)) {
    parser.syntaxParser() = saved;
    return false;
  }

  parser.syntaxParser().consumeWhitespace();
  bool isLegacy = parser.syntaxParser().peek().type() == CSSTokenType::Comma;
  parser.syntaxParser() = saved;
  return isLegacy;
}

/**
 * Parses a legacy syntax rgb() or rgba() function and returns a CSSColor if it
 * is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-legacy-rgb-syntax
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseLegacyRgbFunction(CSSValueParser &parser)
{
  auto rawRed = parser.parseNextValue<CSSNumber, CSSPercentage>();
  bool usesNumber = std::holds_alternative<CSSNumber>(rawRed);

  auto red = normalizeComponent(rawRed, 255.0f);
  if (!red.has_value()) {
    return {};
  }

  auto green = usesNumber ? normalizeNumberComponent(parser.parseNextValue<CSSNumber>(CSSDelimiter::Comma))
                          : normalizeComponent(parser.parseNextValue<CSSPercentage>(CSSDelimiter::Comma), 255.0f);
  if (!green.has_value()) {
    return {};
  }

  auto blue = usesNumber ? normalizeNumberComponent(parser.parseNextValue<CSSNumber>(CSSDelimiter::Comma))
                         : normalizeComponent(parser.parseNextValue<CSSPercentage>(CSSDelimiter::Comma), 255.0f);
  if (!blue.has_value()) {
    return {};
  }

  auto alpha = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Comma), 1.0f);

  return CSSColor{
      .r = clamp255Component(*red),
      .g = clamp255Component(*green),
      .b = clamp255Component(*blue),
      .a = clampAlpha(alpha),
  };
}

/**
 * Parses a modern syntax rgb() or rgba() function and returns a CSSColor if it
 * is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-modern-rgb-syntax
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseModernRgbFunction(CSSValueParser &parser)
{
  auto red = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(), 255.0f);
  if (!red.has_value()) {
    return {};
  }

  auto green = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 255.0f);
  if (!green.has_value()) {
    return {};
  }

  auto blue = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 255.0f);
  if (!blue.has_value()) {
    return {};
  }

  auto alpha =
      normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::SolidusOrWhitespace), 1.0f);

  return CSSColor{
      .r = clamp255Component(*red),
      .g = clamp255Component(*green),
      .b = clamp255Component(*blue),
      .a = clampAlpha(alpha),
  };
}

/**
 * Parses an rgb() or rgba() function and returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#funcdef-rgb
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseRgbFunction(CSSValueParser &parser)
{
  if (isLegacyColorFunction<CSSNumber, CSSPercentage>(parser)) {
    return parseLegacyRgbFunction<CSSColor>(parser);
  } else {
    return parseModernRgbFunction<CSSColor>(parser);
  }
}

/**
 * Parses a legacy syntax hsl() or hsla() function and returns a CSSColor if it
 * is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-legacy-hsl-syntax
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseLegacyHslFunction(CSSValueParser &parser)
{
  auto h = normalizeHueComponent(parser.parseNextValue<CSSNumber, CSSAngle>());
  if (!h.has_value()) {
    return {};
  }

  auto s = normalizeComponent(parser.parseNextValue<CSSPercentage>(CSSDelimiter::Comma), 100.0f);
  if (!s.has_value()) {
    return {};
  }

  auto l = normalizeComponent(parser.parseNextValue<CSSPercentage>(CSSDelimiter::Comma), 100.0f);
  if (!l.has_value()) {
    return {};
  }

  auto a = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Comma), 1.0f);

  auto [r, g, b] = hslToRgb(*h, *s, *l);

  return CSSColor{
      .r = r,
      .g = g,
      .b = b,
      .a = clampAlpha(a),
  };
}

/**
 * Parses a modern syntax hsl() or hsla() function and returns a CSSColor if
 * it is valid. https://www.w3.org/TR/css-color-4/#typedef-modern-hsl-syntax
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseModernHslFunction(CSSValueParser &parser)
{
  auto h = normalizeHueComponent(parser.parseNextValue<CSSNumber, CSSAngle>());
  if (!h.has_value()) {
    return {};
  }

  auto s = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 100.0f);
  if (!s.has_value()) {
    return {};
  }

  auto l = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 100.0f);
  if (!l.has_value()) {
    return {};
  }

  auto a = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::SolidusOrWhitespace), 1.0f);

  auto [r, g, b] = hslToRgb(*h, *s, *l);

  return CSSColor{
      .r = r,
      .g = g,
      .b = b,
      .a = clampAlpha(a),
  };
}

/**
 * Parses an hsl() or hsla() function and returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#funcdef-hsl
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseHslFunction(CSSValueParser &parser)
{
  if (isLegacyColorFunction<CSSNumber, CSSAngle>(parser)) {
    return parseLegacyHslFunction<CSSColor>(parser);
  } else {
    return parseModernHslFunction<CSSColor>(parser);
  }
}

/**
 * Parses an hwb() function and returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#funcdef-hwb
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseHwbFunction(CSSValueParser &parser)
{
  auto h = normalizeHueComponent(parser.parseNextValue<CSSNumber, CSSAngle>());
  if (!h.has_value()) {
    return {};
  }

  auto w = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 100.0f);
  if (!w.has_value()) {
    return {};
  }

  auto b = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::Whitespace), 100.0f);
  if (!b.has_value()) {
    return {};
  }

  auto a = normalizeComponent(parser.parseNextValue<CSSNumber, CSSPercentage>(CSSDelimiter::SolidusOrWhitespace), 1.0f);

  auto [red, green, blue] = hwbToRgb(*h, *w, *b);

  return CSSColor{
      .r = red,
      .g = green,
      .b = blue,
      .a = clampAlpha(a),
  };
}

} // namespace detail

/**
 * Parses a CSS <color-function> value from function name and contents and
 * returns a CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#typedef-color-function
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseCSSColorFunction(std::string_view colorFunction, CSSValueParser &parser)
{
  switch (fnv1aLowercase(colorFunction)) {
    // CSS Color Module Level 4 treats the alpha variants of functions as the
    // same as non-alpha variants (alpha is optional for both).
    case fnv1a("rgb"):
    case fnv1a("rgba"):
      return detail::parseRgbFunction<CSSColor>(parser);
      break;
    case fnv1a("hsl"):
    case fnv1a("hsla"):
      return detail::parseHslFunction<CSSColor>(parser);
      break;
    case fnv1a("hwb"):
      return detail::parseHwbFunction<CSSColor>(parser);
      break;

    // TODO T213000437: support lab(), lch(), oklab(), oklch(), color(),
    // color-mix()
    default:
      return {};
  }

  return {};
}

} // namespace facebook::react
