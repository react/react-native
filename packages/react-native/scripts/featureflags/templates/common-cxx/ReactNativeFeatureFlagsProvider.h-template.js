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

namespace facebook::react {

class ReactNativeFeatureFlagsProvider {
 public:
  virtual ~ReactNativeFeatureFlagsProvider() = default;

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  virtual ${getCxxTypeFromDefaultValue(
        flagConfig.defaultValue,
      )} ${flagName}() = 0;`,
  )
  .join('\n')}
};

} // namespace facebook::react
`);
}
