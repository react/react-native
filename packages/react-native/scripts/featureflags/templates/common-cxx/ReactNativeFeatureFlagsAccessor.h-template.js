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

#pragma once

#include <react/cxxstableapi/UmbrellaGuard.h>

#include <react/featureflags/ReactNativeFeatureFlagsProvider.h>
#include <array>
#include <atomic>
#include <memory>
#include <optional>
#include <string>

namespace facebook::react {

class ReactNativeFeatureFlagsAccessor {
 public:
  ReactNativeFeatureFlagsAccessor();

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${getCxxTypeFromDefaultValue(flagConfig.defaultValue)} ${flagName}();`,
  )
  .join('\n')}

  void override(std::unique_ptr<ReactNativeFeatureFlagsProvider> provider);
  std::optional<std::string> getAccessedFeatureFlagNames() const;

 private:
  void markFlagAsAccessed(int position, const char* flagName);
  void ensureFlagsNotAccessed();

  std::unique_ptr<ReactNativeFeatureFlagsProvider> currentProvider_;
  bool wasOverridden_;

  std::array<std::atomic<const char*>, ${
    Object.keys(definitions.common).length
  }> accessedFeatureFlags_;

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  std::atomic<std::optional<${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )}>> ${flagName}_;`,
  )
  .join('\n')}
};

} // namespace facebook::react
`);
}
