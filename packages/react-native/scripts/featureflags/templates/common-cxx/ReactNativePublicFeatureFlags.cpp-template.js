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
#include "ReactNativePublicFeatureFlags.h"

namespace facebook::react {

${Object.entries(definitions.common)
  .filter(([_, flagConfig]) => flagConfig.dangerouslyExposeInPublicCppHeaders)
  .map(
    ([flagName, flagConfig]) =>
      `${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ReactNativeFeatureFlags_DO_NOT_USE::${flagName}() {
  return ReactNativeFeatureFlags::${flagName}();
}`,
  )
  .join('\n\n')}

} // namespace facebook::react
`);
}
