/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <numbers>
#include <optional>
#include <string_view>
#include <tuple>

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSKeyword.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/PackTraits.h>
#include <react/utils/fnv1a.h>
#include <react/utils/to_underlying.h>

namespace facebook::react {

/**
 * The `none` keyword, which modern color syntax accepts in place of any
 * component to represent a missing component.
 * https://www.w3.org/TR/css-color-4/#missing
 */
enum class CSSColorNoneKeyword : std::underlying_type_t<CSSKeyword> {
  None = to_underlying(CSSKeyword::None),
};

static_assert(CSSDataType<CSSColorNoneKeyword>);

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

// The color space conversions below follow the sample code of CSS Color 4,
// computed in double precision.
// https://www.w3.org/TR/css-color-4/#color-conversion-code

constexpr std::array<double, 3> multiplyMatrix3(
    const std::array<std::array<double, 3>, 3> &matrix,
    const std::array<double, 3> &vector)
{
  return {
      matrix[0][0] * vector[0] + matrix[0][1] * vector[1] + matrix[0][2] * vector[2],
      matrix[1][0] * vector[0] + matrix[1][1] * vector[1] + matrix[1][2] * vector[2],
      matrix[2][0] * vector[0] + matrix[2][1] * vector[1] + matrix[2][2] * vector[2],
  };
}

inline std::array<double, 3> xyzD65ToOklab(const std::array<double, 3> &xyz)
{
  static constexpr std::array<std::array<double, 3>, 3> kXyzToLms{{
      {0.8190224379967030, 0.3619062600528904, -0.1288737815209879},
      {0.0329836539323885, 0.9292868615863434, 0.0361446663506424},
      {0.0481771893596242, 0.2642395317527308, 0.6335478284694309},
  }};
  static constexpr std::array<std::array<double, 3>, 3> kLmsToOklab{{
      {0.2104542683093140, 0.7936177747023054, -0.0040720430116193},
      {1.9779985324311684, -2.4285922420485799, 0.4505937096174110},
      {0.0259040424655478, 0.7827717124575296, -0.8086757549230774},
  }};

  auto lms = multiplyMatrix3(kXyzToLms, xyz);
  return multiplyMatrix3(kLmsToOklab, {std::cbrt(lms[0]), std::cbrt(lms[1]), std::cbrt(lms[2])});
}

inline std::array<double, 3> oklabToXyzD65(const std::array<double, 3> &oklab)
{
  static constexpr std::array<std::array<double, 3>, 3> kOklabToLms{{
      {1.0000000000000000, 0.3963377773761749, 0.2158037573099136},
      {1.0000000000000000, -0.1055613458156586, -0.0638541728258133},
      {1.0000000000000000, -0.0894841775298119, -1.2914855480194092},
  }};
  static constexpr std::array<std::array<double, 3>, 3> kLmsToXyz{{
      {1.2268798758459243, -0.5578149944602171, 0.2813910456659647},
      {-0.0405757452148008, 1.1122868032803170, -0.0717110580655164},
      {-0.0763729366746601, -0.4214933324022432, 1.5869240198367816},
  }};

  auto lms = multiplyMatrix3(kOklabToLms, oklab);
  return multiplyMatrix3(kLmsToXyz, {lms[0] * lms[0] * lms[0], lms[1] * lms[1] * lms[1], lms[2] * lms[2] * lms[2]});
}

/**
 * Converts CIE Lab, relative to the D50 white point used by lab() and lch(),
 * to OKLab.
 */
inline std::array<double, 3> labToOklab(double l, double a, double b)
{
  constexpr double kKappa = 24389.0 / 27.0;
  constexpr double kEpsilon = 216.0 / 24389.0;
  static constexpr std::array<double, 3> kD50White{0.3457 / 0.3585, 1.0, (1.0 - 0.3457 - 0.3585) / 0.3585};
  // Bradford chromatic adaptation from the D50 to the D65 white point
  static constexpr std::array<std::array<double, 3>, 3> kD50ToD65{{
      {0.955473421488075, -0.02309845494876471, 0.06325924320057072},
      {-0.0283697093338637, 1.0099953980813041, 0.021041441191917323},
      {0.012314014864481998, -0.020507649298898964, 1.330365926242124},
  }};

  auto f1 = (l + 16.0) / 116.0;
  auto f0 = a / 500.0 + f1;
  auto f2 = f1 - b / 200.0;
  auto f0Cubed = f0 * f0 * f0;
  auto f2Cubed = f2 * f2 * f2;

  std::array<double, 3> xyzD50{
      (f0Cubed > kEpsilon ? f0Cubed : (116.0 * f0 - 16.0) / kKappa) * kD50White[0],
      (l > kKappa * kEpsilon ? f1 * f1 * f1 : l / kKappa) * kD50White[1],
      (f2Cubed > kEpsilon ? f2Cubed : (116.0 * f2 - 16.0) / kKappa) * kD50White[2],
  };

  return xyzD65ToOklab(multiplyMatrix3(kD50ToD65, xyzD50));
}

/**
 * Converts OKLab to gamma-encoded sRGB, without clipping out of gamut values.
 */
inline std::array<double, 3> oklabToSrgb(const std::array<double, 3> &oklab)
{
  static constexpr std::array<std::array<double, 3>, 3> kXyzToLinearSrgb{{
      {3.2409699419045226, -1.537383177570094, -0.4986107602930034},
      {-0.9692436362808796, 1.8759675015077202, 0.04155505740717559},
      {0.05563007969699366, -0.20397695888897652, 1.0569715142428786},
  }};

  auto linear = multiplyMatrix3(kXyzToLinearSrgb, oklabToXyzD65(oklab));
  std::array<double, 3> srgb{};
  for (size_t i = 0; i < 3; i++) {
    auto magnitude = std::abs(linear[i]);
    auto encoded = magnitude > 0.0031308 ? 1.055 * std::pow(magnitude, 1.0 / 2.4) - 0.055 : 12.92 * magnitude;
    srgb[i] = std::copysign(encoded, linear[i]);
  }
  return srgb;
}

/**
 * Converts gamma-encoded sRGB to OKLab.
 */
inline std::array<double, 3> srgbToOklab(const std::array<double, 3> &srgb)
{
  static constexpr std::array<std::array<double, 3>, 3> kLinearSrgbToXyz{{
      {0.41239079926595934, 0.357584339383878, 0.1804807884018343},
      {0.21263900587151027, 0.715168678767756, 0.07219231536073371},
      {0.01933081871559182, 0.11919477979462598, 0.9505321522496607},
  }};

  std::array<double, 3> linear{};
  for (size_t i = 0; i < 3; i++) {
    auto magnitude = std::abs(srgb[i]);
    auto decoded = magnitude > 0.04045 ? std::pow((magnitude + 0.055) / 1.055, 2.4) : magnitude / 12.92;
    linear[i] = std::copysign(decoded, srgb[i]);
  }
  return xyzD65ToOklab(multiplyMatrix3(kLinearSrgbToXyz, linear));
}

inline bool isInSrgbGamut(const std::array<double, 3> &srgb)
{
  return std::ranges::all_of(srgb, [](double channel) { return channel >= 0.0 && channel <= 1.0; });
}

inline std::array<double, 3> clipToSrgbGamut(const std::array<double, 3> &srgb)
{
  return {std::clamp(srgb[0], 0.0, 1.0), std::clamp(srgb[1], 0.0, 1.0), std::clamp(srgb[2], 0.0, 1.0)};
}

inline double deltaEOK(const std::array<double, 3> &reference, const std::array<double, 3> &sample)
{
  return std::hypot(reference[0] - sample[0], reference[1] - sample[1], reference[2] - sample[2]);
}

/**
 * Maps an OKLab color into the sRGB gamut by reducing its OKLCh chroma, while
 * preserving lightness and hue, until clipping the result is no longer
 * perceptibly different. Clipping each channel on its own instead would
 * visibly shift the hue and lightness of vivid colors.
 * https://www.w3.org/TR/css-color-4/#binsearch
 */
inline std::array<double, 3> gamutMapOklabToSrgb(const std::array<double, 3> &oklab)
{
  // The just noticeable difference, and the precision of the chroma search
  constexpr double kJnd = 0.02;
  constexpr double kEpsilon = 0.0001;

  auto [lightness, a, b] = oklab;
  if (lightness >= 1.0) {
    return {1.0, 1.0, 1.0};
  }
  if (lightness <= 0.0) {
    return {0.0, 0.0, 0.0};
  }

  auto srgb = oklabToSrgb(oklab);
  if (isInSrgbGamut(srgb)) {
    return srgb;
  }

  auto clipped = clipToSrgbGamut(srgb);
  if (deltaEOK(srgbToOklab(clipped), oklab) < kJnd) {
    return clipped;
  }

  auto hue = std::atan2(b, a);
  auto minChroma = 0.0;
  auto maxChroma = std::hypot(a, b);
  auto minChromaInGamut = true;

  while (maxChroma - minChroma > kEpsilon) {
    auto chroma = (minChroma + maxChroma) / 2.0;
    std::array<double, 3> current{lightness, chroma * std::cos(hue), chroma * std::sin(hue)};
    auto candidate = oklabToSrgb(current);

    if (minChromaInGamut && isInSrgbGamut(candidate)) {
      minChroma = chroma;
      continue;
    }

    clipped = clipToSrgbGamut(candidate);
    auto deltaE = deltaEOK(srgbToOklab(clipped), current);
    if (deltaE < kJnd) {
      if (kJnd - deltaE < kEpsilon) {
        return clipped;
      }
      minChromaInGamut = false;
      minChroma = chroma;
    } else {
      maxChroma = chroma;
    }
  }

  return clipped;
}

/**
 * Converts an OKLab color to an sRGB CSSColor, gamut mapping colors which are
 * outside of sRGB.
 */
template <typename CSSColor>
inline CSSColor oklabToCSSColor(const std::array<double, 3> &oklab, uint8_t alpha)
{
  auto [red, green, blue] = gamutMapOklabToSrgb(oklab);
  return CSSColor{
      .r = static_cast<uint8_t>(std::round(std::clamp(red, 0.0, 1.0) * 255.0)),
      .g = static_cast<uint8_t>(std::round(std::clamp(green, 0.0, 1.0) * 255.0)),
      .b = static_cast<uint8_t>(std::round(std::clamp(blue, 0.0, 1.0) * 255.0)),
      .a = alpha,
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

/**
 * Resolves a [<number> | <percentage> | none] color component, where a
 * percentage is relative to percentReference, and `none` (a missing component)
 * resolves to zero.
 * https://www.w3.org/TR/css-color-4/#missing
 */
template <typename ComponentVariantT>
constexpr std::optional<float> normalizeComponentOrNone(const ComponentVariantT &component, float percentReference)
{
  if (std::holds_alternative<CSSColorNoneKeyword>(component)) {
    return 0.0f;
  } else if (std::holds_alternative<CSSPercentage>(component)) {
    return std::get<CSSPercentage>(component).value / 100.0f * percentReference;
  } else if (std::holds_alternative<CSSNumber>(component)) {
    return std::get<CSSNumber>(component).value;
  }

  return {};
}

/**
 * Resolves a [<hue> | none] color component to degrees, where `none` (a
 * missing component) resolves to zero.
 * https://www.w3.org/TR/css-color-4/#hue-syntax
 */
template <typename ComponentVariantT>
constexpr std::optional<float> normalizeHueDegreesOrNone(const ComponentVariantT &component)
{
  if (std::holds_alternative<CSSColorNoneKeyword>(component)) {
    return 0.0f;
  } else if (std::holds_alternative<CSSNumber>(component)) {
    return std::get<CSSNumber>(component).value;
  } else if (std::holds_alternative<CSSAngle>(component)) {
    return std::get<CSSAngle>(component).degrees;
  }

  return {};
}

/**
 * Parses the optional `/ [<alpha-value> | none]` which ends a modern color
 * function. The alpha is opaque when omitted, and transparent when `none`.
 */
inline uint8_t parseSolidusAlphaComponent(CSSValueParser &parser)
{
  auto alpha = parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(CSSDelimiter::Solidus);
  if (std::holds_alternative<std::monostate>(alpha)) {
    return 255;
  }

  return clampAlpha(normalizeComponentOrNone(alpha, 1.0f));
}

/**
 * The Lab color spaces with a CSS color function for both their rectangular
 * (lab(), oklab()) and polar (lch(), oklch()) forms.
 */
enum class CSSLabColorSpace {
  CIELab,
  OKLab,
};

/**
 * The value which 100% refers to for the lightness component, which is also
 * the maximum lightness.
 */
constexpr float labLightnessReference(CSSLabColorSpace colorSpace)
{
  return colorSpace == CSSLabColorSpace::OKLab ? 1.0f : 100.0f;
}

/**
 * Converts the resolved lightness, a, and b of a color in the given color
 * space to OKLab.
 */
inline std::array<double, 3> labColorSpaceToOklab(CSSLabColorSpace colorSpace, double lightness, double a, double b)
{
  // Lightness is clamped to [0%, 100%] at parsed-value time, while a and b
  // are unbounded.
  lightness = std::clamp(lightness, 0.0, static_cast<double>(labLightnessReference(colorSpace)));
  return colorSpace == CSSLabColorSpace::OKLab ? std::array<double, 3>{lightness, a, b} : labToOklab(lightness, a, b);
}

/**
 * Parses a lab() or oklab() function and returns a CSSColor if it is valid.
 * These functions have no legacy comma-separated syntax.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 * https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseLabFunction(CSSValueParser &parser, CSSLabColorSpace colorSpace)
{
  // 100% of a and b is 125 for lab(), and 0.4 for oklab()
  auto axisReference = colorSpace == CSSLabColorSpace::OKLab ? 0.4f : 125.0f;

  auto l = normalizeComponentOrNone(
      parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(), labLightnessReference(colorSpace));
  if (!l.has_value()) {
    return {};
  }

  auto a = normalizeComponentOrNone(
      parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(CSSDelimiter::Whitespace), axisReference);
  if (!a.has_value()) {
    return {};
  }

  auto b = normalizeComponentOrNone(
      parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(CSSDelimiter::Whitespace), axisReference);
  if (!b.has_value()) {
    return {};
  }

  auto alpha = parseSolidusAlphaComponent(parser);

  if (!std::isfinite(*l) || !std::isfinite(*a) || !std::isfinite(*b)) {
    return {};
  }

  return oklabToCSSColor<CSSColor>(labColorSpaceToOklab(colorSpace, *l, *a, *b), alpha);
}

/**
 * Parses an lch() or oklch() function and returns a CSSColor if it is valid.
 * These functions have no legacy comma-separated syntax.
 * https://www.w3.org/TR/css-color-4/#specifying-lab-lch
 * https://www.w3.org/TR/css-color-4/#specifying-oklab-oklch
 */
template <typename CSSColor>
inline std::optional<CSSColor> parseLchFunction(CSSValueParser &parser, CSSLabColorSpace colorSpace)
{
  // 100% of chroma is 150 for lch(), and 0.4 for oklch()
  auto chromaReference = colorSpace == CSSLabColorSpace::OKLab ? 0.4f : 150.0f;

  auto l = normalizeComponentOrNone(
      parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(), labLightnessReference(colorSpace));
  if (!l.has_value()) {
    return {};
  }

  auto c = normalizeComponentOrNone(
      parser.parseNextValue<CSSNumber, CSSPercentage, CSSColorNoneKeyword>(CSSDelimiter::Whitespace), chromaReference);
  if (!c.has_value()) {
    return {};
  }

  auto h = normalizeHueDegreesOrNone(
      parser.parseNextValue<CSSNumber, CSSAngle, CSSColorNoneKeyword>(CSSDelimiter::Whitespace));
  if (!h.has_value()) {
    return {};
  }

  auto alpha = parseSolidusAlphaComponent(parser);

  if (!std::isfinite(*l) || !std::isfinite(*c) || !std::isfinite(*h)) {
    return {};
  }

  // Negative chroma is clamped to zero at parsed-value time
  auto chroma = std::max(static_cast<double>(*c), 0.0);
  auto hueRadians = std::fmod(static_cast<double>(*h), 360.0) * std::numbers::pi / 180.0;

  return oklabToCSSColor<CSSColor>(
      labColorSpaceToOklab(colorSpace, *l, chroma * std::cos(hueRadians), chroma * std::sin(hueRadians)), alpha);
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
    case fnv1a("lab"):
      return detail::parseLabFunction<CSSColor>(parser, detail::CSSLabColorSpace::CIELab);
      break;
    case fnv1a("lch"):
      return detail::parseLchFunction<CSSColor>(parser, detail::CSSLabColorSpace::CIELab);
      break;
    case fnv1a("oklab"):
      return detail::parseLabFunction<CSSColor>(parser, detail::CSSLabColorSpace::OKLab);
      break;
    case fnv1a("oklch"):
      return detail::parseLchFunction<CSSColor>(parser, detail::CSSLabColorSpace::OKLab);
      break;

    // TODO T213000437: support color(), color-mix()
    default:
      return {};
  }

  return {};
}

} // namespace facebook::react
