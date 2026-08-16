/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <folly/dynamic.h>
#include <react/renderer/core/PropsParserContext.h>
#include <react/renderer/core/RawValue.h>
#include <react/renderer/core/StyleConditionPrimitives.h>

#include <cstdint>
#include <memory>
#include <optional>
#include <string>
#include <vector>

namespace facebook::react {

class Props;

struct MediaQueryCondition {
  std::optional<ColorScheme> colorScheme{};
  std::optional<Orientation> orientation{};

  bool operator==(const MediaQueryCondition& other) const = default;
};

/*
 * A single condition of a conditional style property: the media query plus the
 * value (kept as a raw, unparsed prop value) applied while it matches.
 */
struct StyleCondition {
  MediaQueryCondition query{};
  folly::dynamic value;
};

/*
 * A style property whose value is conditional: conditions are evaluated in
 * source order and the last matching one wins. When none match, the
 * property's inline default applies.
 */
struct StyleConditionProp {
  std::string property;
  std::vector<StyleCondition> conditions;
};

/*
 * Returns `true` if any entry of the resolution selects a condition.
 */
bool anyConditionMatches(const StyleConditionResolution& resolution);

/*
 * The parsed `styleConditions` prop plus its current resolution state.
 */
struct StyleConditionData {
  /*
   * The conditional props. Shared between the patched and unpatched props
   * objects.
   */
  std::shared_ptr<const std::vector<StyleConditionProp>> styleConditionProps;

  /*
   * The resolution currently applied to the owning props object. Freshly
   * parsed props carry their defaults, i.e. an all-`kNoMatchingCondition`
   * resolution.
   */
  StyleConditionResolution resolution;

  /*
   * The equivalent props object without any matched conditions applied; null
   * when the owning props object is itself unpatched.
   */
  std::shared_ptr<const Props> unpatchedProps;
};

/*
 * Parses the `styleConditions` style prop, the array of
 * `{property, conditions: [{query, value}]}` entries produced by JS
 * `StyleSheet.create` into `StyleConditionData` with an all-default
 * resolution.
 */
void fromRawValue(
    const PropsParserContext& context,
    const RawValue& value,
    std::shared_ptr<const StyleConditionData>& result);

/*
 * Evaluates every conditional prop against the passed colorScheme and
 * orientation and returns the per-prop resolution (last matching condition
 * wins).
 */
StyleConditionResolution evaluateStyleConditions(
    const std::vector<StyleConditionProp>& styleConditionProps,
    ColorScheme colorScheme,
    Orientation orientation);

/*
 * Builds a raw props patch containing the matched value of every resolved
 * conditional prop.
 */
folly::dynamic buildStyleConditionPatch(
    const std::vector<StyleConditionProp>& styleConditionProps,
    const StyleConditionResolution& resolution);

} // namespace facebook::react
