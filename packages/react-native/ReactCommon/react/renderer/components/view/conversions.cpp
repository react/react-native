/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "conversions.h"

#include <react/debug/react_native_expect.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/css/CSSAngle.h>
#include <react/renderer/css/CSSNumber.h>
#include <react/renderer/css/CSSPercentage.h>
#include <react/renderer/css/CSSRatio.h>
#include <react/renderer/css/CSSTransform.h>
#include <react/renderer/css/CSSTransformOrigin.h>
#include <react/renderer/css/CSSValueParser.h>
#include <cmath>
#include <optional>
#include <string>
#include <type_traits>
#include <unordered_map>
#include <variant>
#include <vector>

namespace facebook::react {

void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    yoga::Style::SizeLength& result) {
  if (value.hasType<Float>()) {
    result = yoga::StyleSizeLength::points((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = yoga::StyleSizeLength::ofAuto();
      return;
    } else if (stringValue == "max-content") {
      result = yoga::StyleSizeLength::ofMaxContent();
      return;
    } else if (stringValue == "stretch") {
      result = yoga::StyleSizeLength::ofStretch();
      return;
    } else if (stringValue == "fit-content") {
      result = yoga::StyleSizeLength::ofFitContent();
      return;
    } else {
      auto parsed = parseCSSProperty<CSSNumber, CSSPercentage>(stringValue);
      if (std::holds_alternative<CSSPercentage>(parsed)) {
        result = yoga::StyleSizeLength::percent(
            std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result =
            yoga::StyleSizeLength::points(std::get<CSSNumber>(parsed).value);
        return;
      }
    }
  }
  result = yoga::StyleSizeLength::undefined();
}

void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    yoga::Style::Length& result) {
  if (value.hasType<Float>()) {
    result = yoga::StyleLength::points((float)value);
    return;
  } else if (value.hasType<std::string>()) {
    const auto stringValue = (std::string)value;
    if (stringValue == "auto") {
      result = yoga::StyleLength::ofAuto();
      return;
    } else {
      auto parsed = parseCSSProperty<CSSNumber, CSSPercentage>(stringValue);
      if (std::holds_alternative<CSSPercentage>(parsed)) {
        result =
            yoga::StyleLength::percent(std::get<CSSPercentage>(parsed).value);
        return;
      } else if (std::holds_alternative<CSSNumber>(parsed)) {
        result = yoga::StyleLength::points(std::get<CSSNumber>(parsed).value);
        return;
      }
    }
  }
  result = yoga::StyleLength::undefined();
}

void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    YGValue& result) {
  yoga::Style::Length length{};
  fromRawValue(context, value, length);
  result = (YGValue)length;
}

yoga::FloatOptional convertAspectRatio(
    const PropsParserContext& /*context*/,
    const RawValue& value) {
  if (value.hasType<float>()) {
    return yoga::FloatOptional((float)value);
  }
  if (ReactNativeFeatureFlags::enableNativeCSSParsing() &&
      value.hasType<std::string>()) {
    auto ratio = parseCSSProperty<CSSRatio>((std::string)value);
    if (std::holds_alternative<CSSRatio>(ratio)) {
      auto r = std::get<CSSRatio>(ratio);
      if (!r.isDegenerate()) {
        return yoga::FloatOptional(r.numerator / r.denominator);
      }
    }
  }
  return {};
}

namespace {

std::optional<Float> toRadians(const RawValue& value) {
  if (value.hasType<Float>()) {
    return (Float)value;
  }
  if (!value.hasType<std::string>()) {
    return {};
  }

  auto angle = parseCSSProperty<CSSAngle>((std::string)value);
  if (std::holds_alternative<CSSAngle>(angle)) {
    return static_cast<float>(
        std::get<CSSAngle>(angle).degrees * M_PI / 180.0f);
  }

  return {};
}

} // namespace

ValueUnit toValueUnit(const RawValue& value) {
  if (value.hasType<Float>()) {
    return ValueUnit((Float)value, UnitType::Point);
  }
  if (!value.hasType<std::string>()) {
    return {};
  }

  auto pct = parseCSSProperty<CSSPercentage>((std::string)value);
  if (std::holds_alternative<CSSPercentage>(pct)) {
    return ValueUnit(std::get<CSSPercentage>(pct).value, UnitType::Percent);
  }

  return {};
}

void fromRawValue(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    ValueUnit& result) {
  result = toValueUnit(value);
}

namespace {

ValueUnit cssLengthPercentageToValueUnit(
    const std::variant<CSSLength, CSSPercentage>& value) {
  if (std::holds_alternative<CSSLength>(value)) {
    auto len = std::get<CSSLength>(value);
    if (len.unit != CSSLengthUnit::Px) {
      return {};
    }
    return {len.value, UnitType::Point};
  } else {
    return {std::get<CSSPercentage>(value).value, UnitType::Percent};
  }
}

std::optional<TransformOperation> fromCSSTransformFunction(
    const CSSTransformFunction& cssTransform) {
  constexpr auto Zero = ValueUnit(0, UnitType::Point);
  constexpr auto One = ValueUnit(1, UnitType::Point);

  return std::visit(
      [&](auto&& func) -> std::optional<TransformOperation> {
        using T = std::decay_t<decltype(func)>;

        if constexpr (std::is_same_v<T, CSSRotate>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = Zero,
              .y = Zero,
              .z = ValueUnit(radians, UnitType::Point)};
        }

        if constexpr (std::is_same_v<T, CSSRotateX>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = ValueUnit(radians, UnitType::Point),
              .y = Zero,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSRotateY>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = Zero,
              .y = ValueUnit(radians, UnitType::Point),
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSRotateZ>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = Zero,
              .y = Zero,
              .z = ValueUnit(radians, UnitType::Point)};
        }

        if constexpr (std::is_same_v<T, CSSTranslate>) {
          auto x = cssLengthPercentageToValueUnit(func.x);
          auto y = cssLengthPercentageToValueUnit(func.y);
          if (!x || !y) {
            return std::nullopt;
          }
          return TransformOperation{
              .type = TransformOperationType::Translate,
              .x = x,
              .y = y,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSTranslateX>) {
          auto x = cssLengthPercentageToValueUnit(func.value);
          if (!x) {
            return std::nullopt;
          }
          return TransformOperation{
              .type = TransformOperationType::Translate,
              .x = x,
              .y = Zero,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSTranslateY>) {
          auto y = cssLengthPercentageToValueUnit(func.value);
          if (!y) {
            return std::nullopt;
          }
          return TransformOperation{
              .type = TransformOperationType::Translate,
              .x = Zero,
              .y = y,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSTranslate3D>) {
          auto x = cssLengthPercentageToValueUnit(func.x);
          auto y = cssLengthPercentageToValueUnit(func.y);
          if (!x || !y || func.z.unit != CSSLengthUnit::Px) {
            return std::nullopt;
          }
          return TransformOperation{
              .type = TransformOperationType::Translate,
              .x = x,
              .y = y,
              .z = ValueUnit(func.z.value, UnitType::Point)};
        }

        if constexpr (std::is_same_v<T, CSSScale>) {
          return TransformOperation{
              .type = TransformOperationType::Scale,
              .x = ValueUnit(func.x, UnitType::Point),
              .y = ValueUnit(func.y, UnitType::Point),
              .z = One};
        }

        if constexpr (std::is_same_v<T, CSSScaleX>) {
          return TransformOperation{
              .type = TransformOperationType::Scale,
              .x = ValueUnit(func.value, UnitType::Point),
              .y = One,
              .z = One};
        }

        if constexpr (std::is_same_v<T, CSSScaleY>) {
          return TransformOperation{
              .type = TransformOperationType::Scale,
              .x = One,
              .y = ValueUnit(func.value, UnitType::Point),
              .z = One};
        }

        if constexpr (std::is_same_v<T, CSSSkewX>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Skew,
              .x = ValueUnit(radians, UnitType::Point),
              .y = Zero,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSSkewY>) {
          auto radians = static_cast<float>(func.degrees * M_PI / 180.0f);
          return TransformOperation{
              .type = TransformOperationType::Skew,
              .x = Zero,
              .y = ValueUnit(radians, UnitType::Point),
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSPerspective>) {
          if (func.length.unit != CSSLengthUnit::Px) {
            return std::nullopt;
          }
          return TransformOperation{
              .type = TransformOperationType::Perspective,
              .x = ValueUnit(func.length.value, UnitType::Point),
              .y = Zero,
              .z = Zero};
        }

        if constexpr (std::is_same_v<T, CSSMatrix>) {
          return TransformOperation{
              .type = TransformOperationType::Arbitrary,
              .x = Zero,
              .y = Zero,
              .z = Zero};
        }
      },
      cssTransform);
}

void parseProcessedTransform(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    Transform& result) {
  auto transformMatrix = Transform{};
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = transformMatrix;
    return;
  }

  auto configurations = static_cast<std::vector<RawValue>>(value);
  for (const auto& configuration : configurations) {
    if (!configuration.hasType<std::unordered_map<std::string, RawValue>>()) {
      result = {};
      return;
    }

    auto configurationPair =
        static_cast<std::unordered_map<std::string, RawValue>>(configuration);
    if (configurationPair.size() != 1) {
      result = {};
      return;
    }

    auto pair = configurationPair.begin();
    auto operation = pair->first;
    auto& parameters = pair->second;
    auto Zero = ValueUnit(0, UnitType::Point);
    auto One = ValueUnit(1, UnitType::Point);

    if (operation == "matrix") {
      // T215634510: We should support matrix transforms as part of a list of
      // transforms
      if (configurations.size() > 1) {
        result = {};
        return;
      }

      if (!parameters.hasType<std::vector<Float>>()) {
        result = {};
        return;
      }

      auto numbers = (std::vector<Float>)parameters;
      if (numbers.size() != 9 && numbers.size() != 16) {
        result = {};
        return;
      }

      if (numbers.size() == 16) {
        size_t i = 0;

        for (auto number : numbers) {
          transformMatrix.matrix[i++] = number;
        }
      } else if (numbers.size() == 9) {
        // We need to convert the 2d transform matrix into a 3d one as such:
        // [
        //   x00, x01, 0, x02
        //   x10, x11, 0, x12
        //   0,   0,   1, 0
        //   x20, x21, 0, x22
        // ]
        transformMatrix.matrix[0] = numbers[0];
        transformMatrix.matrix[1] = numbers[1];
        transformMatrix.matrix[2] = 0;
        transformMatrix.matrix[3] = numbers[2];
        transformMatrix.matrix[4] = numbers[3];
        transformMatrix.matrix[5] = numbers[4];
        transformMatrix.matrix[6] = 0;
        transformMatrix.matrix[7] = numbers[5];
        transformMatrix.matrix[8] = 0;
        transformMatrix.matrix[9] = 0;
        transformMatrix.matrix[10] = 1;
        transformMatrix.matrix[11] = 0;
        transformMatrix.matrix[12] = numbers[6];
        transformMatrix.matrix[13] = numbers[7];
        transformMatrix.matrix[14] = 0;
        transformMatrix.matrix[15] = numbers[8];
      }
      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Arbitrary,
              .x = Zero,
              .y = Zero,
              .z = Zero});
    } else if (operation == "perspective") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Perspective,
              .x = ValueUnit((Float)parameters, UnitType::Point),
              .y = Zero,
              .z = Zero});
    } else if (operation == "rotateX") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = ValueUnit(*radians, UnitType::Point),
              .y = Zero,
              .z = Zero});
    } else if (operation == "rotateY") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = Zero,
              .y = ValueUnit(*radians, UnitType::Point),
              .z = Zero});
    } else if (operation == "rotateZ" || operation == "rotate") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Rotate,
              .x = Zero,
              .y = Zero,
              .z = ValueUnit(*radians, UnitType::Point)});
    } else if (operation == "scale") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      auto number = ValueUnit((Float)parameters, UnitType::Point);
      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Scale,
              .x = number,
              .y = number,
              .z = number});
    } else if (operation == "scaleX") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Scale,
              .x = ValueUnit((Float)parameters, UnitType::Point),
              .y = One,
              .z = One});
    } else if (operation == "scaleY") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Scale,
              .x = One,
              .y = ValueUnit((Float)parameters, UnitType::Point),
              .z = One});
    } else if (operation == "scaleZ") {
      if (!parameters.hasType<Float>()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Scale,
              .x = One,
              .y = One,
              .z = ValueUnit((Float)parameters, UnitType::Point)});
    } else if (operation == "translate") {
      if (!parameters.hasType<std::vector<RawValue>>()) {
        result = {};
        return;
      }

      auto numbers = (std::vector<RawValue>)parameters;
      if (numbers.size() != 2) {
        result = {};
        return;
      }

      auto valueX = toValueUnit(numbers[0]);
      if (!valueX) {
        result = {};
        return;
      }

      auto valueY = toValueUnit(numbers[1]);
      if (!valueY) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Translate,
              .x = valueX,
              .y = valueY,
              .z = Zero});
    } else if (operation == "translateX") {
      auto valueX = toValueUnit(parameters);
      if (!valueX) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Translate,
              .x = valueX,
              .y = Zero,
              .z = Zero});
    } else if (operation == "translateY") {
      auto valueY = toValueUnit(parameters);
      if (!valueY) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Translate,
              .x = Zero,
              .y = valueY,
              .z = Zero});
    } else if (operation == "skewX") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Skew,
              .x = ValueUnit(*radians, UnitType::Point),
              .y = Zero,
              .z = Zero});
    } else if (operation == "skewY") {
      auto radians = toRadians(parameters);
      if (!radians.has_value()) {
        result = {};
        return;
      }

      transformMatrix.operations.push_back(
          TransformOperation{
              .type = TransformOperationType::Skew,
              .x = Zero,
              .y = ValueUnit(*radians, UnitType::Point),
              .z = Zero});
    }
  }

  result = transformMatrix;
}

void parseUnprocessedTransformString(
    const std::string& value,
    Transform& result) {
  auto transformList = parseCSSProperty<CSSTransformList>(value);
  if (!std::holds_alternative<CSSTransformList>(transformList)) {
    result = {};
    return;
  }

  auto transformMatrix = Transform{};
  const auto& cssFuncs = std::get<CSSTransformList>(transformList);
  transformMatrix.operations.reserve(cssFuncs.size());
  for (const auto& cssFunc : cssFuncs) {
    auto op = fromCSSTransformFunction(cssFunc);
    if (!op.has_value()) {
      result = {};
      return;
    }

    if (op->type == TransformOperationType::Arbitrary) {
      // CSSMatrix: expand 6-value 2D matrix to 4x4 matrix
      if (std::holds_alternative<CSSMatrix>(cssFunc)) {
        const auto& m = std::get<CSSMatrix>(cssFunc);
        transformMatrix.matrix[0] = m.values[0];
        transformMatrix.matrix[1] = m.values[1];
        transformMatrix.matrix[2] = 0;
        transformMatrix.matrix[3] = 0;
        transformMatrix.matrix[4] = m.values[2];
        transformMatrix.matrix[5] = m.values[3];
        transformMatrix.matrix[6] = 0;
        transformMatrix.matrix[7] = 0;
        transformMatrix.matrix[8] = 0;
        transformMatrix.matrix[9] = 0;
        transformMatrix.matrix[10] = 1;
        transformMatrix.matrix[11] = 0;
        transformMatrix.matrix[12] = m.values[4];
        transformMatrix.matrix[13] = m.values[5];
        transformMatrix.matrix[14] = 0;
        transformMatrix.matrix[15] = 1;
      }
    }

    transformMatrix.operations.push_back(*op);
  }

  result = transformMatrix;
}

void parseUnprocessedTransform(
    const PropsParserContext& context,
    const RawValue& value,
    Transform& result) {
  if (value.hasType<std::string>()) {
    parseUnprocessedTransformString((std::string)value, result);
  } else {
    parseProcessedTransform(context, value, result);
  }
}

} // namespace

void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    Transform& result) {
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    parseUnprocessedTransform(context, value, result);
  } else {
    parseProcessedTransform(context, value, result);
  }
}

namespace {

void parseProcessedTransformOrigin(
    const PropsParserContext& /*context*/,
    const RawValue& value,
    TransformOrigin& result) {
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  auto origins = (std::vector<RawValue>)value;
  if (origins.size() != 3) {
    result = {};
    return;
  }

  TransformOrigin transformOrigin;

  for (size_t i = 0; i < 2; i++) {
    auto origin = toValueUnit(origins[i]);
    if (!origin) {
      result = {};
      return;
    }

    transformOrigin.xy[i] = origin;
  }

  if (!origins[2].hasType<Float>()) {
    result = {};
    return;
  }
  transformOrigin.z = (Float)origins[2];

  result = transformOrigin;
}

} // namespace

void parseUnprocessedTransformOriginString(
    const std::string& value,
    TransformOrigin& result) {
  auto cssOrigin = parseCSSProperty<CSSTransformOrigin>(value);
  if (!std::holds_alternative<CSSTransformOrigin>(cssOrigin)) {
    result = {};
    return;
  }

  const auto& origin = std::get<CSSTransformOrigin>(cssOrigin);
  TransformOrigin transformOrigin;

  auto x = cssLengthPercentageToValueUnit(origin.x);
  auto y = cssLengthPercentageToValueUnit(origin.y);
  if (!x || !y) {
    result = {};
    return;
  }

  transformOrigin.xy[0] = x;
  transformOrigin.xy[1] = y;

  if (origin.z.unit != CSSLengthUnit::Px) {
    result = {};
    return;
  }
  transformOrigin.z = origin.z.value;

  result = transformOrigin;
}

namespace {

void parseUnprocessedTransformOrigin(
    const PropsParserContext& context,
    const RawValue& value,
    TransformOrigin& result) {
  if (value.hasType<std::string>()) {
    parseUnprocessedTransformOriginString((std::string)value, result);
  } else {
    parseProcessedTransformOrigin(context, value, result);
  }
}

} // namespace

void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    TransformOrigin& result) {
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    parseUnprocessedTransformOrigin(context, value, result);
  } else {
    parseProcessedTransformOrigin(context, value, result);
  }
}

} // namespace facebook::react
