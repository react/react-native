/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions} from '../../types';

import {DO_NOT_MODIFY_COMMENT, getCxxTypeFromDefaultValue} from '../../utils';
import signedsource from 'signedsource';

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 */

${DO_NOT_MODIFY_COMMENT}

#include "ReactNativeFeatureFlags.h"

namespace facebook::react {

#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wglobal-constructors"
constinit std::unique_ptr<ReactNativeFeatureFlagsAccessor> accessor_;
#pragma GCC diagnostic pop

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ReactNativeFeatureFlags::${flagName}() {
  return getAccessor().${flagName}();
}`,
  )
  .join('\n\n')}

void ReactNativeFeatureFlags::override(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  getAccessor().override(std::move(provider));
}

void ReactNativeFeatureFlags::dangerouslyReset() {
  accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
}

std::optional<std::string> ReactNativeFeatureFlags::dangerouslyForceOverride(
    std::unique_ptr<ReactNativeFeatureFlagsProvider> provider) {
  auto accessor = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  accessor->override(std::move(provider));

  std::swap(accessor_, accessor);

  // Now accessor is the old accessor
  return accessor == nullptr ? std::nullopt
                             : accessor->getAccessedFeatureFlagNames();
}

ReactNativeFeatureFlagsAccessor& ReactNativeFeatureFlags::getAccessor() {
  if (accessor_ == nullptr) {
    accessor_ = std::make_unique<ReactNativeFeatureFlagsAccessor>();
  }
  return *accessor_;
}

} // namespace facebook::react
`);
}
