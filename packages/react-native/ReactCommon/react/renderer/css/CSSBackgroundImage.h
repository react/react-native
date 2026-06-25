/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <optional>
#include <variant>

#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSColor.h>
#include <react/renderer/css/CSSCompoundDataType.h>
#include <react/renderer/css/CSSDataType.h>
#include <react/renderer/css/CSSLength.h>
#include <react/renderer/css/CSSLengthPercentage.h>
#include <react/renderer/css/CSSList.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/utils/TemplateStringLiteral.h>
#include <react/utils/fnv1a.h>
#include <react/utils/iequals.h>

namespace facebook::react {

enum class CSSGradientToKeyword : std::underlying_type_t<CSSKeyword> {
  To = to_underlying(CSSKeyword::To),
};

static_assert(CSSDataType<CSSGradientToKeyword>);

enum class CSSGradientDirectionKeyword : std::underlying_type_t<CSSKeyword> {
  Top = to_underlying(CSSKeyword::Top),
  Bottom = to_underlying(CSSKeyword::Bottom),
  Left = to_underlying(CSSKeyword::Left),
  Right = to_underlying(CSSKeyword::Right),
};

static_assert(CSSDataType<CSSGradientDirectionKeyword>);

enum class CSSGradientAtKeyword : std::underlying_type_t<CSSKeyword> {
  At = to_underlying(CSSKeyword::At),
};

static_assert(CSSDataType<CSSGradientAtKeyword>);

enum class CSSGradientPositionKeyword : std::underlying_type_t<CSSKeyword> {
  Top = to_underlying(CSSKeyword::Top),
  Bottom = to_underlying(CSSKeyword::Bottom),
  Left = to_underlying(CSSKeyword::Left),
  Right = to_underlying(CSSKeyword::Right),
  Center = to_underlying(CSSKeyword::Center),
};

static_assert(CSSDataType<CSSGradientPositionKeyword>);

enum class CSSLinearGradientDirectionKeyword : uint8_t {
  ToTopLeft,
  ToTopRight,
  ToBottomLeft,
  ToBottomRight,
};

struct CSSLinearGradientDirection {
  // angle or keyword like "to bottom"
  std::variant<CSSAngle, CSSLinearGradientDirectionKeyword> value;

  bool operator==(const CSSLinearGradientDirection &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSLinearGradientDirection> {
  static constexpr auto consume(CSSValueParser &parser) -> std::optional<CSSLinearGradientDirection>
  {
    return parseLinearGradientDirection(parser);
  }

 private:
  static constexpr std::optional<CSSLinearGradientDirection> parseLinearGradientDirection(CSSValueParser &parser)
  {
    auto angle = parser.parseNextValue<CSSAngle>();
    if (std::holds_alternative<CSSAngle>(angle)) {
      return CSSLinearGradientDirection{std::get<CSSAngle>(angle)};
    }
    auto toResult = parser.parseNextValue<CSSGradientToKeyword>();
    if (!std::holds_alternative<CSSGradientToKeyword>(toResult)) {
      // no direction found, default to 180 degrees (to bottom)
      return CSSLinearGradientDirection{CSSAngle{180.0f}};
    }

    parser.syntaxParser().consumeWhitespace();

    auto primaryResult = parser.parseNextValue<CSSGradientDirectionKeyword>();
    if (std::holds_alternative<std::monostate>(primaryResult)) {
      return {};
    }
    auto primaryDir = std::get<CSSGradientDirectionKeyword>(primaryResult);

    parser.syntaxParser().consumeWhitespace();

    auto secondaryPeek = parser.peekNextValue<CSSGradientDirectionKeyword>();
    std::optional<CSSGradientDirectionKeyword> secondaryDir;
    if (std::holds_alternative<CSSGradientDirectionKeyword>(secondaryPeek)) {
      auto kw = std::get<CSSGradientDirectionKeyword>(secondaryPeek);
      bool isCompatible = false;
      if (primaryDir == CSSGradientDirectionKeyword::Top || primaryDir == CSSGradientDirectionKeyword::Bottom) {
        isCompatible = (kw == CSSGradientDirectionKeyword::Left || kw == CSSGradientDirectionKeyword::Right);
      } else if (primaryDir == CSSGradientDirectionKeyword::Left || primaryDir == CSSGradientDirectionKeyword::Right) {
        isCompatible = (kw == CSSGradientDirectionKeyword::Top || kw == CSSGradientDirectionKeyword::Bottom);
      }
      if (isCompatible) {
        parser.parseNextValue<CSSGradientDirectionKeyword>();
        secondaryDir = kw;
      }
    }

    if (primaryDir == CSSGradientDirectionKeyword::Top) {
      if (secondaryDir == CSSGradientDirectionKeyword::Left) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToTopLeft};
      } else if (secondaryDir == CSSGradientDirectionKeyword::Right) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToTopRight};
      } else {
        // "to top" = 0 degrees
        return CSSLinearGradientDirection{CSSAngle{0.0f}};
      }
    } else if (primaryDir == CSSGradientDirectionKeyword::Bottom) {
      if (secondaryDir == CSSGradientDirectionKeyword::Left) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToBottomLeft};
      } else if (secondaryDir == CSSGradientDirectionKeyword::Right) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToBottomRight};
      } else {
        // "to bottom" = 180 degrees
        return CSSLinearGradientDirection{CSSAngle{180.0f}};
      }
    } else if (primaryDir == CSSGradientDirectionKeyword::Left) {
      if (secondaryDir == CSSGradientDirectionKeyword::Top) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToTopLeft};
      } else if (secondaryDir == CSSGradientDirectionKeyword::Bottom) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToBottomLeft};
      } else {
        // "to left" = 270 degrees
        return CSSLinearGradientDirection{CSSAngle{270.0f}};
      }
    } else if (primaryDir == CSSGradientDirectionKeyword::Right) {
      if (secondaryDir == CSSGradientDirectionKeyword::Top) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToTopRight};
      } else if (secondaryDir == CSSGradientDirectionKeyword::Bottom) {
        return CSSLinearGradientDirection{CSSLinearGradientDirectionKeyword::ToBottomRight};
      } else {
        // "to right" = 90 degrees
        return CSSLinearGradientDirection{CSSAngle{90.0f}};
      }
    }

    return {};
  }
};

static_assert(CSSDataType<CSSLinearGradientDirection>);

/**
 * Representation of a color hint (interpolation hint)
 */
struct CSSColorHint {
  std::variant<CSSLength, CSSPercentage> position{}; // Support both lengths and percentages

  bool operator==(const CSSColorHint &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSColorHint> {
  static auto consume(CSSValueParser &parser) -> std::optional<CSSColorHint>
  {
    return parseCSSColorHint(parser);
  }

 private:
  static std::optional<CSSColorHint> parseCSSColorHint(CSSValueParser &parser)
  {
    auto position = parser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<CSSLength>(position)) {
      return CSSColorHint{std::get<CSSLength>(position)};
    } else if (std::holds_alternative<CSSPercentage>(position)) {
      return CSSColorHint{std::get<CSSPercentage>(position)};
    }
    return {};
  }
};

static_assert(CSSDataType<CSSColorHint>);

struct CSSColorStop {
  CSSColor color{};
  std::optional<std::variant<CSSLength, CSSPercentage>> startPosition{};
  std::optional<std::variant<CSSLength, CSSPercentage>> endPosition{};

  bool operator==(const CSSColorStop &rhs) const
  {
    if (color != rhs.color) {
      return false;
    }

    if (startPosition.has_value() != rhs.startPosition.has_value()) {
      return false;
    }
    if (startPosition.has_value()) {
      if (startPosition->index() != rhs.startPosition->index()) {
        return false;
      }
      if (*startPosition != *rhs.startPosition) {
        return false;
      }
    }

    if (endPosition.has_value() != rhs.endPosition.has_value()) {
      return false;
    }
    if (endPosition.has_value()) {
      if (endPosition->index() != rhs.endPosition->index()) {
        return false;
      }
      if (*endPosition != *rhs.endPosition) {
        return false;
      }
    }

    return true;
  }
};

template <>
struct CSSDataTypeParser<CSSColorStop> {
  static constexpr auto consume(CSSValueParser &parser) -> std::optional<CSSColorStop>
  {
    return parseCSSColorStop(parser);
  }

 private:
  static constexpr std::optional<CSSColorStop> parseCSSColorStop(CSSValueParser &parser)
  {
    auto color = parser.parseNextValue<CSSColor>();
    if (!std::holds_alternative<CSSColor>(color)) {
      return {};
    }

    CSSColorStop colorStop;
    colorStop.color = std::get<CSSColor>(color);

    auto startPosition = parser.parseNextValue<CSSLengthPercentage>(CSSDelimiter::Whitespace);
    if (std::holds_alternative<CSSLength>(startPosition)) {
      colorStop.startPosition = std::get<CSSLength>(startPosition);
    } else if (std::holds_alternative<CSSPercentage>(startPosition)) {
      colorStop.startPosition = std::get<CSSPercentage>(startPosition);
    }

    if (colorStop.startPosition) {
      // Try to parse second optional position (supports both lengths and
      // percentages)
      auto endPosition = parser.parseNextValue<CSSLengthPercentage>(CSSDelimiter::Whitespace);
      if (std::holds_alternative<CSSLength>(endPosition)) {
        colorStop.endPosition = std::get<CSSLength>(endPosition);
      } else if (std::holds_alternative<CSSPercentage>(endPosition)) {
        colorStop.endPosition = std::get<CSSPercentage>(endPosition);
      }
    }
    return colorStop;
  }
};

static_assert(CSSDataType<CSSColorStop>);

struct CSSLinearGradientFunction {
  std::optional<CSSLinearGradientDirection> direction{};
  std::vector<std::variant<CSSColorStop, CSSColorHint>> items{}; // Color stops and color hints

  bool operator==(const CSSLinearGradientFunction &rhs) const = default;

  static std::pair<std::vector<std::variant<CSSColorStop, CSSColorHint>>, int> parseGradientColorStopsAndHints(
      CSSValueParser &parser)
  {
    std::vector<std::variant<CSSColorStop, CSSColorHint>> items;
    int colorStopCount = 0;

    std::optional<CSSColorStop> prevColorStop = std::nullopt;
    do {
      auto colorStop = parser.parseNextValue<CSSColorStop>();
      if (std::holds_alternative<CSSColorStop>(colorStop)) {
        auto parsedColorStop = std::get<CSSColorStop>(colorStop);
        items.emplace_back(parsedColorStop);
        prevColorStop = parsedColorStop;
        colorStopCount++;
      } else {
        auto colorHint = parser.parseNextValue<CSSColorHint>();
        if (std::holds_alternative<CSSColorHint>(colorHint)) {
          // color hint must be between two color stops
          if (!prevColorStop) {
            return {};
          }
          auto nextColorStop = parser.peekNextValue<CSSColorStop>(CSSDelimiter::Comma);
          if (!std::holds_alternative<CSSColorStop>(nextColorStop)) {
            return {};
          }
          items.emplace_back(std::get<CSSColorHint>(colorHint));
        } else {
          break; // No more valid items
        }
      }
    } while (parser.syntaxParser().consumeDelimiter(CSSDelimiter::Comma));

    return {items, colorStopCount};
  }
};

enum class CSSRadialGradientShape : uint8_t {
  Circle,
  Ellipse,
};

template <>
struct CSSDataTypeParser<CSSRadialGradientShape> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken &token) -> std::optional<CSSRadialGradientShape>
  {
    if (token.type() == CSSTokenType::Ident) {
      auto lowercase = fnv1aLowercase(token.stringValue());
      if (lowercase == fnv1a("circle")) {
        return CSSRadialGradientShape::Circle;
      } else if (lowercase == fnv1a("ellipse")) {
        return CSSRadialGradientShape::Ellipse;
      }
    }
    return {};
  }
};

static_assert(CSSDataType<CSSRadialGradientShape>);

enum class CSSRadialGradientSizeKeyword : uint8_t {
  ClosestSide,
  ClosestCorner,
  FarthestSide,
  FarthestCorner,
};

template <>
struct CSSDataTypeParser<CSSRadialGradientSizeKeyword> {
  static constexpr auto consumePreservedToken(const CSSPreservedToken &token)
      -> std::optional<CSSRadialGradientSizeKeyword>
  {
    if (token.type() == CSSTokenType::Ident) {
      auto lowercase = fnv1aLowercase(token.stringValue());
      if (lowercase == fnv1a("closest-side")) {
        return CSSRadialGradientSizeKeyword::ClosestSide;
      } else if (lowercase == fnv1a("closest-corner")) {
        return CSSRadialGradientSizeKeyword::ClosestCorner;
      } else if (lowercase == fnv1a("farthest-side")) {
        return CSSRadialGradientSizeKeyword::FarthestSide;
      } else if (lowercase == fnv1a("farthest-corner")) {
        return CSSRadialGradientSizeKeyword::FarthestCorner;
      }
    }
    return {};
  }
};

static_assert(CSSDataType<CSSRadialGradientSizeKeyword>);

struct CSSRadialGradientExplicitSize {
  std::variant<CSSLength, CSSPercentage> sizeX{};
  std::variant<CSSLength, CSSPercentage> sizeY{};

  bool operator==(const CSSRadialGradientExplicitSize &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRadialGradientExplicitSize> {
  static auto consume(CSSValueParser &syntaxParser) -> std::optional<CSSRadialGradientExplicitSize>
  {
    auto sizeX = syntaxParser.parseNextValue<CSSLengthPercentage>();
    if (std::holds_alternative<std::monostate>(sizeX)) {
      return {};
    }

    syntaxParser.syntaxParser().consumeWhitespace();

    auto sizeY = syntaxParser.parseNextValue<CSSLengthPercentage>();

    CSSRadialGradientExplicitSize result;
    if (std::holds_alternative<CSSLength>(sizeX)) {
      result.sizeX = std::get<CSSLength>(sizeX);
    } else {
      result.sizeX = std::get<CSSPercentage>(sizeX);
    }

    if (std::holds_alternative<CSSLength>(sizeY) || std::holds_alternative<CSSPercentage>(sizeY)) {
      if (std::holds_alternative<CSSLength>(sizeY)) {
        result.sizeY = std::get<CSSLength>(sizeY);
      } else {
        result.sizeY = std::get<CSSPercentage>(sizeY);
      }
    } else {
      result.sizeY = result.sizeX;
    }

    return result;
  }
};

static_assert(CSSDataType<CSSRadialGradientExplicitSize>);

using CSSRadialGradientSize = std::variant<CSSRadialGradientSizeKeyword, CSSRadialGradientExplicitSize>;

struct CSSRadialGradientPosition {
  std::optional<std::variant<CSSLength, CSSPercentage>> top{};
  std::optional<std::variant<CSSLength, CSSPercentage>> bottom{};
  std::optional<std::variant<CSSLength, CSSPercentage>> left{};
  std::optional<std::variant<CSSLength, CSSPercentage>> right{};

  bool operator==(const CSSRadialGradientPosition &rhs) const = default;
};

struct CSSRadialGradientFunction {
  std::optional<CSSRadialGradientShape> shape{};
  std::optional<CSSRadialGradientSize> size{};
  std::optional<CSSRadialGradientPosition> position{};
  std::vector<std::variant<CSSColorStop, CSSColorHint>> items{}; // Color stops and color hints

  bool operator==(const CSSRadialGradientFunction &rhs) const = default;
};

template <>
struct CSSDataTypeParser<CSSRadialGradientFunction> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSRadialGradientFunction>
  {
    if (!iequals(func.name, "radial-gradient")) {
      return {};
    }

    CSSRadialGradientFunction gradient;

    auto hasExplicitShape = false;
    auto hasExplicitSingleSize = false;
    auto shapeResult = parser.parseNextValue<CSSRadialGradientShape>();
    if (std::holds_alternative<CSSRadialGradientShape>(shapeResult)) {
      parser.syntaxParser().consumeWhitespace();
    }

    std::optional<CSSRadialGradientSize> sizeResult;

    auto sizeKeywordResult = parser.parseNextValue<CSSRadialGradientSizeKeyword>();

    if (std::holds_alternative<CSSRadialGradientSizeKeyword>(sizeKeywordResult)) {
      sizeResult = CSSRadialGradientSize{std::get<CSSRadialGradientSizeKeyword>(sizeKeywordResult)};
      parser.syntaxParser().consumeWhitespace();
    } else {
      auto explicitSizeResult = parser.parseNextValue<CSSRadialGradientExplicitSize>();
      if (std::holds_alternative<CSSRadialGradientExplicitSize>(explicitSizeResult)) {
        auto explicitSize = std::get<CSSRadialGradientExplicitSize>(explicitSizeResult);
        // negative value validation
        if (std::holds_alternative<CSSLength>(explicitSize.sizeX)) {
          const auto &lengthX = std::get<CSSLength>(explicitSize.sizeX);
          if (lengthX.value < 0) {
            return {};
          }
        } else if (std::holds_alternative<CSSPercentage>(explicitSize.sizeX)) {
          const auto &percentageX = std::get<CSSPercentage>(explicitSize.sizeX);
          if (percentageX.value < 0) {
            return {};
          }
        }
        if (std::holds_alternative<CSSLength>(explicitSize.sizeY)) {
          const auto &lengthY = std::get<CSSLength>(explicitSize.sizeY);
          if (lengthY.value < 0) {
            return {};
          }
        } else if (std::holds_alternative<CSSPercentage>(explicitSize.sizeY)) {
          const auto &percentageY = std::get<CSSPercentage>(explicitSize.sizeY);
          if (percentageY.value < 0) {
            return {};
          }
        }

        // check if it's a single size (both X and Y are the same), we use it
        // to set shape to circle
        if (explicitSize.sizeX == explicitSize.sizeY) {
          hasExplicitSingleSize = true;
        }

        sizeResult = CSSRadialGradientSize{explicitSize};
        parser.syntaxParser().consumeWhitespace();
      }
    }

    if (std::holds_alternative<CSSRadialGradientShape>(shapeResult)) {
      gradient.shape = std::get<CSSRadialGradientShape>(shapeResult);
      hasExplicitShape = true;
    } else {
      // default to ellipse
      gradient.shape = CSSRadialGradientShape::Ellipse;
    }

    if (sizeResult.has_value()) {
      gradient.size = *sizeResult;
    } else {
      // default to farthest corner
      gradient.size = CSSRadialGradientSize{CSSRadialGradientSizeKeyword::FarthestCorner};
    }

    if (!hasExplicitShape && hasExplicitSingleSize) {
      gradient.shape = CSSRadialGradientShape::Circle;
    }

    if (hasExplicitSingleSize && hasExplicitShape && gradient.shape.value() == CSSRadialGradientShape::Ellipse) {
      // if a single size is explicitly set and the shape is an ellipse do not
      // apply any gradient. Same as web.
      return {};
    }

    auto atResult = parser.parseNextValue<CSSGradientAtKeyword>();
    bool hasAtKeyword = std::holds_alternative<CSSGradientAtKeyword>(atResult);

    CSSRadialGradientPosition position;

    if (hasAtKeyword) {
      parser.syntaxParser().consumeWhitespace();
      std::vector<std::variant<CSSLength, CSSPercentage, CSSKeyword>> positionKeywordValues;
      for (int i = 0; i < 2; i++) {
        auto keywordFound = false;
        auto valueFound = false;

        auto positionKeywordResult = parser.parseNextValue<CSSGradientPositionKeyword>();
        std::optional<CSSKeyword> positionKeyword;
        if (std::holds_alternative<CSSGradientPositionKeyword>(positionKeywordResult)) {
          positionKeyword =
              static_cast<CSSKeyword>(to_underlying(std::get<CSSGradientPositionKeyword>(positionKeywordResult)));
        }

        if (positionKeyword) {
          // invalid position declaration of same keyword "at top 10% top 20%"
          for (const auto &existingValue : positionKeywordValues) {
            if (std::holds_alternative<CSSKeyword>(existingValue)) {
              if (std::get<CSSKeyword>(existingValue) == positionKeyword) {
                return {};
              }
            }
          }
          positionKeywordValues.emplace_back(*positionKeyword);
          keywordFound = true;
        }

        parser.syntaxParser().consumeWhitespace();

        auto lengthPercentageValue = parser.parseNextValue<CSSLengthPercentage>();

        std::optional<decltype(positionKeywordValues)::value_type> value;
        if (std::holds_alternative<CSSLength>(lengthPercentageValue)) {
          value = std::get<CSSLength>(lengthPercentageValue);
        } else if (std::holds_alternative<CSSPercentage>(lengthPercentageValue)) {
          value = std::get<CSSPercentage>(lengthPercentageValue);
        }
        if (value.has_value()) {
          positionKeywordValues.emplace_back(*value);
          valueFound = true;
        }

        parser.syntaxParser().consumeWhitespace();

        if (!keywordFound && !valueFound) {
          break;
        }
      }

      if (positionKeywordValues.empty()) {
        return {};
      }

      // 1. [ left | center | right | top | bottom | <length-percentage> ]
      if (positionKeywordValues.size() == 1) {
        auto value = positionKeywordValues[0];
        if (std::holds_alternative<CSSKeyword>(value)) {
          auto keyword = std::get<CSSKeyword>(value);
          if (keyword == CSSKeyword::Left) {
            position.top = CSSPercentage{50.0f};
            position.left = CSSPercentage{0.0f};
          } else if (keyword == CSSKeyword::Right) {
            position.top = CSSPercentage{50.0f};
            position.left = CSSPercentage{100.0f};
          } else if (keyword == CSSKeyword::Top) {
            position.top = CSSPercentage{0.0f};
            position.left = CSSPercentage{50.0f};
          } else if (keyword == CSSKeyword::Bottom) {
            position.top = CSSPercentage{100.0f};
            position.left = CSSPercentage{50.0f};
          } else if (keyword == CSSKeyword::Center) {
            position.left = CSSPercentage{50.0f};
            position.top = CSSPercentage{50.0f};
          } else {
            return {};
          }
        } else if ((std::holds_alternative<CSSLength>(value) || std::holds_alternative<CSSPercentage>(value))) {
          if (std::holds_alternative<CSSLength>(value)) {
            position.left = std::get<CSSLength>(value);
          } else {
            position.left = std::get<CSSPercentage>(value);
          }
          position.top = CSSPercentage{50.0f};
        } else {
          return {};
        }
      }

      else if (positionKeywordValues.size() == 2) {
        auto value1 = positionKeywordValues[0];
        auto value2 = positionKeywordValues[1];
        // 2. [ left | center | right ] && [ top | center | bottom ]
        if (std::holds_alternative<CSSKeyword>(value1) && std::holds_alternative<CSSKeyword>(value2)) {
          auto keyword1 = std::get<CSSKeyword>(value1);
          auto keyword2 = std::get<CSSKeyword>(value2);
          auto isHorizontal = [](CSSKeyword kw) {
            return kw == CSSKeyword::Left || kw == CSSKeyword::Center || kw == CSSKeyword::Right;
          };
          auto isVertical = [](CSSKeyword kw) {
            return kw == CSSKeyword::Top || kw == CSSKeyword::Center || kw == CSSKeyword::Bottom;
          };
          if (isHorizontal(keyword1) && isVertical(keyword2)) {
            // First horizontal, second vertical
            if (keyword1 == CSSKeyword::Left) {
              position.left = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Right) {
              position.right = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Center) {
              position.left = CSSPercentage{50.0f};
            }

            if (keyword2 == CSSKeyword::Top) {
              position.top = CSSPercentage{0.0f};
            } else if (keyword2 == CSSKeyword::Bottom) {
              position.bottom = CSSPercentage{0.0f};
            } else if (keyword2 == CSSKeyword::Center) {
              position.top = CSSPercentage{50.0f};
            }
          } else if (isVertical(keyword1) && isHorizontal(keyword2)) {
            // First vertical, second horizontal
            if (keyword1 == CSSKeyword::Top) {
              position.top = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Bottom) {
              position.bottom = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Center) {
              position.top = CSSPercentage{50.0f};
            }

            if (keyword2 == CSSKeyword::Left) {
              position.left = CSSPercentage{0.0f};
            } else if (keyword2 == CSSKeyword::Right) {
              position.left = CSSPercentage{100.0f};
            } else if (keyword2 == CSSKeyword::Center) {
              position.left = CSSPercentage{50.0f};
            }
          } else {
            return {};
          }
        }
        // 3. [ left | center | right | <length-percentage> ] [ top | center |
        // bottom | <length-percentage> ]
        else {
          if (std::holds_alternative<CSSKeyword>(value1)) {
            auto keyword1 = std::get<CSSKeyword>(value1);
            if (keyword1 == CSSKeyword::Left) {
              position.left = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Right) {
              position.right = CSSPercentage{0.0f};
            } else if (keyword1 == CSSKeyword::Center) {
              position.left = CSSPercentage{50.0f};
            } else {
              return {};
            }
          } else if ((std::holds_alternative<CSSLength>(value1) || std::holds_alternative<CSSPercentage>(value1))) {
            if (std::holds_alternative<CSSLength>(value1)) {
              position.left = std::get<CSSLength>(value1);
            } else {
              position.left = std::get<CSSPercentage>(value1);
            }
          } else {
            return {};
          }

          if (std::holds_alternative<CSSKeyword>(value2)) {
            auto keyword2 = std::get<CSSKeyword>(value2);
            if (keyword2 == CSSKeyword::Top) {
              position.top = CSSPercentage{0.0f};
            } else if (keyword2 == CSSKeyword::Bottom) {
              position.bottom = CSSPercentage{0.f};
            } else if (keyword2 == CSSKeyword::Center) {
              position.top = CSSPercentage{50.0f};
            } else {
              return {};
            }
          } else if ((std::holds_alternative<CSSLength>(value2) || std::holds_alternative<CSSPercentage>(value2))) {
            if (std::holds_alternative<CSSLength>(value2)) {
              position.top = std::get<CSSLength>(value2);
            } else {
              position.top = std::get<CSSPercentage>(value2);
            }
          } else {
            return {};
          }
        }
      }

      // 4. [ [ left | right ] <length-percentage> ] && [ [ top | bottom ]
      // <length-percentage> ]
      else if (positionKeywordValues.size() == 4) {
        auto value1 = positionKeywordValues[0];
        auto value2 = positionKeywordValues[1];
        auto value3 = positionKeywordValues[2];
        auto value4 = positionKeywordValues[3];

        if (!std::holds_alternative<CSSKeyword>(value1)) {
          return {};
        }
        if (!std::holds_alternative<CSSKeyword>(value3)) {
          return {};
        }
        if ((!std::holds_alternative<CSSLength>(value2) && !std::holds_alternative<CSSPercentage>(value2))) {
          return {};
        }
        if ((!std::holds_alternative<CSSLength>(value4) && !std::holds_alternative<CSSPercentage>(value4))) {
          return {};
        }

        auto parsedValue2 = std::holds_alternative<CSSLength>(value2)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(value2)}
            : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(value2)};
        auto parsedValue4 = std::holds_alternative<CSSLength>(value4)
            ? std::variant<CSSLength, CSSPercentage>{std::get<CSSLength>(value4)}
            : std::variant<CSSLength, CSSPercentage>{std::get<CSSPercentage>(value4)};
        auto keyword1 = std::get<CSSKeyword>(value1);
        auto keyword3 = std::get<CSSKeyword>(value3);

        if (keyword1 == CSSKeyword::Left) {
          position.left = parsedValue2;
        } else if (keyword1 == CSSKeyword::Right) {
          position.right = parsedValue2;
        } else if (keyword1 == CSSKeyword::Top) {
          position.top = parsedValue2;
        } else if (keyword1 == CSSKeyword::Bottom) {
          position.bottom = parsedValue2;
        } else {
          return {};
        }

        if (keyword3 == CSSKeyword::Left) {
          position.left = parsedValue4;
        } else if (keyword3 == CSSKeyword::Right) {
          position.right = parsedValue4;
        } else if (keyword3 == CSSKeyword::Top) {
          position.top = parsedValue4;
        } else if (keyword3 == CSSKeyword::Bottom) {
          position.bottom = parsedValue4;
        } else {
          return {};
        }
      } else {
        return {};
      }

      gradient.position = position;
    } else {
      // Default position
      position.top = CSSPercentage{50.0f};
      position.left = CSSPercentage{50.0f};
      gradient.position = position;
    }

    parser.syntaxParser().consumeDelimiter(CSSDelimiter::Comma);
    auto [items, colorStopCount] = CSSLinearGradientFunction::parseGradientColorStopsAndHints(parser);

    if (items.empty() || colorStopCount < 2) {
      return {};
    }

    gradient.items = std::move(items);
    return gradient;
  }
};

static_assert(CSSDataType<CSSRadialGradientFunction>);

template <>
struct CSSDataTypeParser<CSSLinearGradientFunction> {
  static auto consumeFunctionBlock(const CSSFunctionBlock &func, CSSValueParser &parser)
      -> std::optional<CSSLinearGradientFunction>
  {
    if (!iequals(func.name, "linear-gradient")) {
      return {};
    }

    CSSLinearGradientFunction gradient;

    auto parsedDirection = parser.parseNextValue<CSSLinearGradientDirection>();
    if (!std::holds_alternative<CSSLinearGradientDirection>(parsedDirection)) {
      return {};
    }

    parser.syntaxParser().consumeDelimiter(CSSDelimiter::Comma);

    gradient.direction = std::get<CSSLinearGradientDirection>(parsedDirection);

    auto [items, colorStopCount] = CSSLinearGradientFunction::parseGradientColorStopsAndHints(parser);

    if (items.empty() || colorStopCount < 2) {
      return {};
    }

    gradient.items = std::move(items);

    return gradient;
  }
};

static_assert(CSSDataType<CSSLinearGradientFunction>);

/**
 * Representation of <background-image>
 * https://www.w3.org/TR/css-backgrounds-3/#background-image
 */
using CSSBackgroundImage = CSSCompoundDataType<CSSLinearGradientFunction, CSSRadialGradientFunction>;

/**
 * Representation of <background-image-list>
 */
using CSSBackgroundImageList = CSSCommaSeparatedList<CSSBackgroundImage>;

} // namespace facebook::react
