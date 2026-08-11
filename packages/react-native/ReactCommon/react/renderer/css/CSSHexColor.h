/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <string_view>

#include <react/utils/toLower.h>

namespace facebook::react {

namespace detail {
enum class HexColorType {
  Long,
  Short,
};

constexpr uint8_t hexToNumeric(std::string_view hex, HexColorType hexType) {
  int result = 0;
  for (char c : hex) {
    int value = 0;
    if (c >= '0' && c <= '9') {
      value = c - '0';
    } else {
      value = toLower(c) - 'a' + 10;
    }
    result *= 16;
    result += value;
  }

  if (hexType == HexColorType::Short) {
    return static_cast<uint8_t>(result * 16 + result);
  } else {
    return static_cast<uint8_t>(result);
  }
}

constexpr bool isHexDigit(char c) {
  return (c >= '0' && c <= '9') || (toLower(c) >= 'a' && toLower(c) <= 'f');
}

constexpr bool isValidHexColor(std::string_view hex) {
  // The syntax of a <hex-color> is a <hash-token> token whose value consists
  // of 3, 4, 6, or 8 hexadecimal digits.
  if (hex.size() != 3 && hex.size() != 4 && hex.size() != 6 &&
      hex.size() != 8) {
    return false;
  }

  for (auto c : hex) {
    if (!isHexDigit(c)) {
      return false;
    }
  }

  return true;
}
} // namespace detail

/**
 * Parses a CSS <hex-color> value from hash token string value and returns a
 * CSSColor if it is valid.
 * https://www.w3.org/TR/css-color-4/#hex-color
 */
template <typename CSSColor>
constexpr std::optional<CSSColor> parseCSSHexColor(
    std::string_view hexColorValue) {
  if (detail::isValidHexColor(hexColorValue)) {
    if (hexColorValue.length() == 3) {
      return CSSColor{
          hexToNumeric(hexColorValue.substr(0, 1), detail::HexColorType::Short),
          hexToNumeric(hexColorValue.substr(1, 1), detail::HexColorType::Short),
          hexToNumeric(hexColorValue.substr(2, 1), detail::HexColorType::Short),
          255u};
    } else if (hexColorValue.length() == 4) {
      return CSSColor{
          hexToNumeric(hexColorValue.substr(0, 1), detail::HexColorType::Short),
          hexToNumeric(hexColorValue.substr(1, 1), detail::HexColorType::Short),
          hexToNumeric(hexColorValue.substr(2, 1), detail::HexColorType::Short),
          hexToNumeric(
              hexColorValue.substr(3, 1), detail::HexColorType::Short)};
    } else if (hexColorValue.length() == 6) {
      return CSSColor{
          hexToNumeric(hexColorValue.substr(0, 2), detail::HexColorType::Long),
          hexToNumeric(hexColorValue.substr(2, 2), detail::HexColorType::Long),
          hexToNumeric(hexColorValue.substr(4, 2), detail::HexColorType::Long),
          255u};
    } else if (hexColorValue.length() == 8) {
      return CSSColor{
          hexToNumeric(hexColorValue.substr(0, 2), detail::HexColorType::Long),
          hexToNumeric(hexColorValue.substr(2, 2), detail::HexColorType::Long),
          hexToNumeric(hexColorValue.substr(4, 2), detail::HexColorType::Long),
          hexToNumeric(hexColorValue.substr(6, 2), detail::HexColorType::Long)};
    }
  }
  return {};
}

} // namespace facebook::react
