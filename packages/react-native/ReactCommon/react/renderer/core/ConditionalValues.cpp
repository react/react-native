/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "ConditionalValues.h"

namespace facebook::react {

namespace {

// The names of the media features in queries.
std::optional<MediaFeature> getMediaFeature(const folly::dynamic& name) {
  if (name == "colorScheme") {
    return MediaFeature::ColorScheme;
  }
  return std::nullopt;
}

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
    auto feature = getMediaFeature(name);
    if (!feature) {
      return false;
    }
    switch (*feature) {
      case MediaFeature::ColorScheme:
        if (!matchesColorScheme(value, features.colorScheme)) {
          return false;
        }
        break;
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

MediaFeatureSet getMediaFeatureDependencies(
    const folly::dynamic& conditionalValue) {
  const auto* conditions = conditionalValue.isObject()
      ? conditionalValue.get_ptr("conditions")
      : nullptr;
  if (conditions == nullptr || !conditions->isArray()) {
    return 0;
  }

  MediaFeatureSet dependencies = 0;
  for (const auto& condition : *conditions) {
    const auto* query =
        condition.isObject() ? condition.get_ptr("query") : nullptr;
    if (query == nullptr || !query->isObject()) {
      continue;
    }
    for (const auto& name : query->keys()) {
      if (auto feature = getMediaFeature(name)) {
        dependencies |= static_cast<MediaFeatureSet>(*feature);
      }
    }
  }
  return dependencies;
}

std::optional<ConditionalValuesResolution> resolveConditionalValues(
    const Props* sourceProps,
    const RawProps& rawProps,
    const ContextContainer* contextContainer) {
  const auto* source =
      sourceProps != nullptr ? sourceProps->conditionalValues.get() : nullptr;

  if (!mayHaveConditionalValues(rawProps)) {
    if (source == nullptr) {
      return std::nullopt;
    }
    // Only a new value for a prop with a conditional value changes something.
    auto isAnyReplaced = false;
    for (const auto& item : source->values.items()) {
      if (rawProps.hasProperty(item.first.c_str())) {
        isAnyReplaced = true;
        break;
      }
    }
    if (!isAnyReplaced) {
      return std::nullopt;
    }
  }

  auto values = rawProps.toDynamic();
  if (!values.isObject()) {
    return std::nullopt;
  }
  values.erase(kHasConditionalValuesPropName);

  auto conditionalValues = source != nullptr
      ? source->values
      : folly::dynamic(folly::dynamic::object());
  std::optional<MediaFeatures> features;
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

  if (conditionalValues.empty()) {
    return ConditionalValuesResolution{
        .rawProps = RawProps(std::move(values)), .conditionalValues = nullptr};
  }

  auto result = std::make_shared<ConditionalValues>();
  if (features) {
    // All values of the props must be resolved for the same media features.
    if (source != nullptr && source->isOutdatedFor(*features)) {
      for (const auto& item : conditionalValues.items()) {
        if (values.count(item.first) == 0) {
          values[item.first] = resolveConditionalValue(item.second, *features);
        }
      }
    }
    result->mediaFeatures = *features;
  } else {
    // Only stored values are left, so `source` is not null.
    result->mediaFeatures = source->mediaFeatures;
  }
  for (const auto& item : conditionalValues.items()) {
    result->dependencies |= getMediaFeatureDependencies(item.second);
  }
  result->values = std::move(conditionalValues);

  return ConditionalValuesResolution{
      .rawProps = RawProps(std::move(values)),
      .conditionalValues = std::move(result)};
}

} // namespace facebook::react
