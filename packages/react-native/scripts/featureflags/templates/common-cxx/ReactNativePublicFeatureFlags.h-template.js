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

#include <string>

#ifndef RN_EXPORT
#define RN_EXPORT __attribute__((visibility("default")))
#endif

namespace facebook::react {

/**
 * This class provides public access to select internal React Native feature flags.
 */
class ReactNativeFeatureFlags_DO_NOT_USE {
 public:
${Object.entries(definitions.common)
  .filter(([_, flagConfig]) => flagConfig.dangerouslyExposeInPublicCppHeaders)
  .map(
    ([flagName, flagConfig]) =>
      `  /**
   * ${flagConfig.metadata.description}
   */
  RN_EXPORT static ${getCxxTypeFromDefaultValue(flagConfig.defaultValue)} ${flagName}();`,
  )
  .join('\n\n')}
};

} // namespace facebook::react
`);
}
