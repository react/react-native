/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConditionalValues.h"

namespace facebook::react {

namespace {

bool matchesColorScheme(const folly::dynamic& value, ColorScheme colorScheme) {
  if (!value.isString()) {
    return false;
  }
  const auto& name = value.getString();
  return (name == "light" && colorScheme == ColorScheme::Light) ||
      (name == "dark" && colorScheme == ColorScheme::Dark);
}

bool matchesQuery(const folly::dynamic& query, const MediaFeatures& features) {
  if (!query.isObject() || query.empty()) {
    return false;
  }
  for (const auto& [name, value] : query.items()) {
    if (name != "colorScheme" ||
        !matchesColorScheme(value, features.colorScheme)) {
      return false;
    }
  }
  return true;
}

// JavaScript adds the flag to each payload with a conditional value. Payloads
// that C++ makes, for example the merged `setNativeProps` props, can lose it.
bool mayHaveConditionalValues(const RawProps& rawProps) {
  if (rawProps.hasProperty(kHasConditionalValuesPropName)) {
    return true;
  }
  const auto* values = rawProps.getDynamic();
  if (values == nullptr || !values->isObject()) {
    return false;
  }
  for (const auto& item : values->items()) {
    if (item.second.isObject() && item.second.count(kConditionalValueKey) > 0) {
      return true;
    }
  }
  return false;
}

} // namespace

folly::dynamic resolveConditionalValue(
    const folly::dynamic& conditionalValue,
    const MediaFeatures& features) {
  if (!conditionalValue.isObject()) {
    return nullptr;
  }

  const auto* result = conditionalValue.get_ptr("default");

  const auto* conditions = conditionalValue.get_ptr("conditions");
  if (conditions != nullptr && conditions->isArray()) {
    for (const auto& condition : *conditions) {
      if (!condition.isObject()) {
        continue;
      }
      const auto* query = condition.get_ptr("query");
      const auto* value = condition.get_ptr("value");
      if (query != nullptr && value != nullptr &&
          matchesQuery(*query, features)) {
        result = value;
      }
    }
  }

  return result != nullptr ? *result : nullptr;
}

std::optional<ConditionalValuesResolution> resolveConditionalValues(
    const Props* sourceProps,
    const RawProps& rawProps,
    const ContextContainer* contextContainer) {
  const auto* sourceValues =
      sourceProps != nullptr ? sourceProps->conditionalValues.get() : nullptr;

  std::optional<MediaFeatures> features;
  if (!mayHaveConditionalValues(rawProps)) {
    if (sourceValues == nullptr) {
      return std::nullopt;
    }
    // Stale values are resolved again, even without new props.
    features = getMediaFeatures(contextContainer);
    if (*features == sourceProps->conditionalValuesFeatures) {
      // Only a new value for a prop with a conditional value changes something.
      auto isAnyReplaced = false;
      for (const auto& item : sourceValues->items()) {
        if (rawProps.hasProperty(item.first.c_str())) {
          isAnyReplaced = true;
          break;
        }
      }
      if (!isAnyReplaced) {
        return std::nullopt;
      }
    }
  }

  auto values = rawProps.toDynamic();
  if (!values.isObject()) {
    return std::nullopt;
  }
  values.erase(kHasConditionalValuesPropName);

  auto conditionalValues = sourceValues != nullptr
      ? *sourceValues
      : folly::dynamic(folly::dynamic::object());
  for (auto& item : values.items()) {
    const auto* conditionalValue = item.second.isObject()
        ? item.second.get_ptr(kConditionalValueKey)
        : nullptr;
    if (conditionalValue == nullptr) {
      // A plain value removes the conditional value of the same prop.
      conditionalValues.erase(item.first);
      continue;
    }
    if (!features) {
      features = getMediaFeatures(contextContainer);
    }
    conditionalValues[item.first] = *conditionalValue;
    item.second = resolveConditionalValue(*conditionalValue, *features);
  }

  auto sourceFeatures = sourceProps != nullptr
      ? sourceProps->conditionalValuesFeatures
      : MediaFeatures{};
  // All conditional values of the props are resolved for the same features.
  if (features && *features != sourceFeatures) {
    for (const auto& item : conditionalValues.items()) {
      if (values.count(item.first) == 0) {
        values[item.first] = resolveConditionalValue(item.second, *features);
      }
    }
  }

  return ConditionalValuesResolution{
      .rawProps = RawProps(std::move(values)),
      .conditionalValues = conditionalValues.empty()
          ? nullptr
          : std::make_shared<const folly::dynamic>(
                std::move(conditionalValues)),
      .features = features ? *features : sourceFeatures,
  };
}

} // namespace facebook::react
