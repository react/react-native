/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <glog/logging.h>
#include <react/debug/react_native_expect.h>
#include <react/featureflags/ReactNativeFeatureFlags.h>
#include <react/renderer/components/view/CSSConversions.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawProps.h>
#include <react/renderer/css/CSSFilter.h>
#include <react/renderer/css/CSSValueParser.h>
#include <react/renderer/graphics/Filter.h>
#include <optional>
#include <string>
#include <unordered_map>

namespace facebook::react {

inline void
parseProcessedFilter(const PropsParserContext &context, const RawValue &value, std::vector<FilterFunction> &result)
{
  react_native_expect(value.hasType<std::vector<RawValue>>());
  if (!value.hasType<std::vector<RawValue>>()) {
    result = {};
    return;
  }

  std::vector<FilterFunction> filter{};
  auto rawFilter = static_cast<std::vector<RawValue>>(value);
  for (const auto &rawFilterPrimitive : rawFilter) {
    bool isMap = rawFilterPrimitive.hasType<std::unordered_map<std::string, RawValue>>();
    react_native_expect(isMap);
    if (!isMap) {
      // If a filter is malformed then we should not apply any of them which
      // is the web behavior.
      result = {};
      return;
    }

    auto rawFilterFunction = static_cast<std::unordered_map<std::string, RawValue>>(rawFilterPrimitive);
    FilterFunction filterFunction{};
    auto filterType = filterTypeFromString(rawFilterFunction.begin()->first);
    if (!filterType.has_value()) {
      LOG(ERROR) << "Could not parse FilterFunction: " << rawFilterFunction.begin()->first;
      result = {};
      return;
    }
    filterFunction.type = *filterType;
    if (filterFunction.type == FilterType::DropShadow) {
      auto rawDropShadow = static_cast<std::unordered_map<std::string, RawValue>>(rawFilterFunction.begin()->second);
      DropShadowParams dropShadowParams{};

      auto offsetX = rawDropShadow.find("offsetX");
      react_native_expect(offsetX != rawDropShadow.end());
      if (offsetX == rawDropShadow.end()) {
        result = {};
        return;
      }

      react_native_expect(offsetX->second.hasType<Float>());
      if (!offsetX->second.hasType<Float>()) {
        result = {};
        return;
      }
      dropShadowParams.offsetX = (Float)offsetX->second;

      auto offsetY = rawDropShadow.find("offsetY");
      react_native_expect(offsetY != rawDropShadow.end());
      if (offsetY == rawDropShadow.end()) {
        result = {};
        return;
      }
      react_native_expect(offsetY->second.hasType<Float>());
      if (!offsetY->second.hasType<Float>()) {
        result = {};
        return;
      }
      dropShadowParams.offsetY = (Float)offsetY->second;

      auto standardDeviation = rawDropShadow.find("standardDeviation");
      if (standardDeviation != rawDropShadow.end()) {
        react_native_expect(standardDeviation->second.hasType<Float>());
        if (!standardDeviation->second.hasType<Float>()) {
          result = {};
          return;
        }
        dropShadowParams.standardDeviation = (Float)standardDeviation->second;
      }

      auto color = rawDropShadow.find("color");
      if (color != rawDropShadow.end()) {
        fromRawValue(context.contextContainer, context.surfaceId, color->second, dropShadowParams.color);
      }

      filterFunction.parameters = dropShadowParams;
    } else {
      filterFunction.parameters = (float)rawFilterFunction.begin()->second;
    }
    filter.push_back(filterFunction);
  }

  result = filter;
}

inline FilterType filterTypeFromVariant(const CSSFilterFunction &filter)
{
  return std::visit(
      [](auto &&filter) -> FilterType {
        using FilterT = std::decay_t<decltype(filter)>;

        if constexpr (std::is_same_v<FilterT, CSSBlurFilter>) {
          return FilterType::Blur;
        }
        if constexpr (std::is_same_v<FilterT, CSSBrightnessFilter>) {
          return FilterType::Brightness;
        }
        if constexpr (std::is_same_v<FilterT, CSSContrastFilter>) {
          return FilterType::Contrast;
        }
        if constexpr (std::is_same_v<FilterT, CSSDropShadowFilter>) {
          return FilterType::DropShadow;
        }
        if constexpr (std::is_same_v<FilterT, CSSGrayscaleFilter>) {
          return FilterType::Grayscale;
        }
        if constexpr (std::is_same_v<FilterT, CSSHueRotateFilter>) {
          return FilterType::HueRotate;
        }
        if constexpr (std::is_same_v<FilterT, CSSInvertFilter>) {
          return FilterType::Invert;
        }
        if constexpr (std::is_same_v<FilterT, CSSOpacityFilter>) {
          return FilterType::Opacity;
        }
        if constexpr (std::is_same_v<FilterT, CSSSaturateFilter>) {
          return FilterType::Saturate;
        }
        if constexpr (std::is_same_v<FilterT, CSSSepiaFilter>) {
          return FilterType::Sepia;
        }
      },
      filter);
}

inline std::optional<FilterFunction> fromCSSFilter(const CSSFilterFunction &cssFilter)
{
  return std::visit(
      [&](auto &&filter) -> std::optional<FilterFunction> {
        using FilterT = std::decay_t<decltype(filter)>;

        if constexpr (std::is_same_v<FilterT, CSSBlurFilter>) {
          // TODO: support non-px values
          if (filter.amount.unit != CSSLengthUnit::Px) {
            return {};
          }
          return FilterFunction{
              .type = filterTypeFromVariant(cssFilter),
              .parameters = filter.amount.value,
          };
        }

        if constexpr (std::is_same_v<FilterT, CSSDropShadowFilter>) {
          // TODO: support non-px values
          if (filter.offsetX.unit != CSSLengthUnit::Px || filter.offsetY.unit != CSSLengthUnit::Px ||
              filter.standardDeviation.unit != CSSLengthUnit::Px) {
            return {};
          }

          return FilterFunction{
              .type = FilterType::DropShadow,
              .parameters = DropShadowParams{
                  .offsetX = filter.offsetX.value,
                  .offsetY = filter.offsetY.value,
                  .standardDeviation = filter.standardDeviation.value,
                  .color = fromCSSColor(filter.color),
              }};
        }

        if constexpr (
            std::is_same_v<FilterT, CSSBrightnessFilter> || std::is_same_v<FilterT, CSSContrastFilter> ||
            std::is_same_v<FilterT, CSSGrayscaleFilter> || std::is_same_v<FilterT, CSSInvertFilter> ||
            std::is_same_v<FilterT, CSSOpacityFilter> || std::is_same_v<FilterT, CSSSaturateFilter> ||
            std::is_same_v<FilterT, CSSSepiaFilter>) {
          return FilterFunction{
              .type = filterTypeFromVariant(cssFilter),
              .parameters = filter.amount,
          };
        }

        if constexpr (std::is_same_v<FilterT, CSSHueRotateFilter>) {
          return FilterFunction{
              .type = filterTypeFromVariant(cssFilter),
              .parameters = filter.degrees,
          };
        }
      },
      cssFilter);
}

inline void parseUnprocessedFilterString(std::string &&value, std::vector<FilterFunction> &result)
{
  auto filterList = parseCSSProperty<CSSFilterList>((std::string)value);
  if (!std::holds_alternative<CSSFilterList>(filterList)) {
    result = {};
    return;
  }

  for (const auto &cssFilter : std::get<CSSFilterList>(filterList)) {
    if (auto filter = fromCSSFilter(cssFilter)) {
      result.push_back(*filter);
    } else {
      result = {};
      return;
    }
  }
}

inline std::optional<FilterFunction> parseDropShadow(const PropsParserContext &context, const RawValue &value)
{
  if (value.hasType<std::string>()) {
    auto val = parseCSSProperty<CSSDropShadowFilter>(std::string("drop-shadow(") + (std::string)value + ")");
    if (std::holds_alternative<CSSDropShadowFilter>(val)) {
      return fromCSSFilter(std::get<CSSDropShadowFilter>(val));
    }
    return {};
  }

  if (!value.hasType<std::unordered_map<std::string, RawValue>>()) {
    return {};
  }
  auto rawDropShadow = static_cast<std::unordered_map<std::string, RawValue>>(value);

  DropShadowParams dropShadowParams{};

  auto offsetX = rawDropShadow.find("offsetX");
  if (offsetX == rawDropShadow.end()) {
    return {};
  }

  if (auto parsedOffsetX = coerceLength(offsetX->second)) {
    dropShadowParams.offsetX = *parsedOffsetX;
  } else {
    return {};
  }

  auto offsetY = rawDropShadow.find("offsetY");
  if (offsetY == rawDropShadow.end()) {
    return {};
  }

  if (auto parsedOffsetY = coerceLength(offsetY->second)) {
    dropShadowParams.offsetY = *parsedOffsetY;
  } else {
    return {};
  }

  auto standardDeviation = rawDropShadow.find("standardDeviation");
  if (standardDeviation != rawDropShadow.end()) {
    if (auto parsedStandardDeviation = coerceLength(standardDeviation->second)) {
      if (*parsedStandardDeviation < 0.0f) {
        return {};
      }
      dropShadowParams.standardDeviation = *parsedStandardDeviation;
    } else {
      return {};
    }
  }

  auto color = rawDropShadow.find("color");
  if (color != rawDropShadow.end()) {
    if (auto parsedColor = coerceColor(color->second, context)) {
      dropShadowParams.color = *parsedColor;
    } else {
      return {};
    }
  }

  return FilterFunction{.type = FilterType::DropShadow, .parameters = dropShadowParams};
}

inline std::optional<FilterFunction> parseFilterRawValue(const PropsParserContext &context, const RawValue &value)
{
  if (!value.hasType<std::unordered_map<std::string, RawValue>>()) {
    return {};
  }
  auto rawFilter = static_cast<std::unordered_map<std::string, RawValue>>(value);

  if (rawFilter.size() != 1) {
    return {};
  }

  const auto &filterKey = rawFilter.begin()->first;

  if (filterKey == "drop-shadow") {
    return parseDropShadow(context, rawFilter.begin()->second);
  } else if (filterKey == "blur") {
    if (auto length = coerceLength(rawFilter.begin()->second)) {
      if (*length < 0.0f) {
        return {};
      }
      return FilterFunction{.type = FilterType::Blur, .parameters = *length};
    }
    return {};
  } else if (filterKey == "hue-rotate") {
    if (auto angle = coerceAngle(rawFilter.begin()->second)) {
      return FilterFunction{.type = FilterType::HueRotate, .parameters = *angle};
    }
    return {};
  } else {
    auto filterType = filterTypeFromString(filterKey);
    if (!filterType.has_value()) {
      return {};
    }
    if (auto amount = coerceAmount(rawFilter.begin()->second)) {
      if (*amount < 0.0f) {
        return {};
      }
      return FilterFunction{.type = *filterType, .parameters = *amount};
    }
    return {};
  }
}

inline void parseUnprocessedFilterList(
    const PropsParserContext &context,
    std::vector<RawValue> &&value,
    std::vector<FilterFunction> &result)
{
  for (const auto &rawValue : value) {
    if (auto Filter = parseFilterRawValue(context, rawValue)) {
      result.push_back(*Filter);
    } else {
      result = {};
      return;
    }
  }
}

inline void
parseUnprocessedFilter(const PropsParserContext &context, const RawValue &value, std::vector<FilterFunction> &result)
{
  if (value.hasType<std::string>()) {
    parseUnprocessedFilterString((std::string)value, result);
  } else if (value.hasType<std::vector<RawValue>>()) {
    parseUnprocessedFilterList(context, (std::vector<RawValue>)value, result);
  } else {
    result = {};
  }
}

inline void fromRawValue(const PropsParserContext &context, const RawValue &value, std::vector<FilterFunction> &result)
{
  if (ReactNativeFeatureFlags::enableNativeCSSParsing()) {
    parseUnprocessedFilter(context, value, result);
  } else {
    parseProcessedFilter(context, value, result);
  }
}

} // namespace facebook::react
