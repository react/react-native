/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <memory>
#include <optional>

#include <folly/dynamic.h>
#include <react/renderer/core/MediaFeatures.h>
#include <react/renderer/core/Props.h>
#include <react/renderer/core/RawProps.h>

namespace facebook::react {

/*
 * Returns the value of the last condition in `conditionalValue` that matches
 * `features`, or its default if none matches. Returns null for an invalid
 * value. The format, with processed values:
 *
 *   {
 *     "default": <value>,
 *     "conditions": [{"query": {"colorScheme": "dark"}, "value": <value>}]
 *   }
 */
folly::dynamic resolveConditionalValue(const folly::dynamic &conditionalValue, const MediaFeatures &features);

MediaFeatureSet getMediaFeatureDependencies(const folly::dynamic &conditionalValue);

struct ConditionalValues {
  /*
   * The conditional values by prop name, in the format of
   * `resolveConditionalValue`.
   */
  folly::dynamic values;

  /*
   * The media features that the queries of `values` read.
   */
  MediaFeatureSet dependencies{0};

  MediaFeatures resolvedFor;

  bool isOutdatedFor(const MediaFeatures &features) const
  {
    return (resolvedFor.differences(features) & dependencies) != 0;
  }
};

/*
 * JavaScript sends a conditional value under its own prop, wrapped in this key:
 * `{"opacity": {"$conditionalValue": {"default": 1, "conditions": [...]}}}`.
 */
inline constexpr const char *kConditionalValueKey = "$conditionalValue";

/*
 * JavaScript adds this prop to a payload that has a conditional value, so that
 * other payloads skip the search.
 */
inline constexpr const char *kHasConditionalValuesPropName = "$hasConditionalValues";

struct ConditionalValuesResolution {
  /*
   * The raw props to use instead of the given ones: each conditional value
   * resolved, and no `$hasConditionalValues` prop.
   */
  RawProps rawProps;

  /*
   * The conditional values of the new props. Null if there are none.
   */
  std::shared_ptr<const ConditionalValues> conditionalValues;
};

/*
 * Resolves the conditional values in `rawProps` for the media features in
 * `contextContainer`, and merges them with the ones of `sourceProps`. A plain
 * value removes the conditional value of the same prop. Stored values that are
 * outdated for these media features are resolved again. Returns nullopt if
 * nothing changes. Does not need `parse`.
 */
std::optional<ConditionalValuesResolution>
resolveConditionalValues(const Props *sourceProps, const RawProps &rawProps, const ContextContainer *contextContainer);

} // namespace facebook::react
