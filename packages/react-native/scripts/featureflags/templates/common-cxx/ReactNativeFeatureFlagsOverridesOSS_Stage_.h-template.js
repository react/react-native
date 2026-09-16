/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {FeatureFlagDefinitions, OSSReleaseStageValue} from '../../types';

import {
  DO_NOT_MODIFY_COMMENT,
  getCxxTypeFromDefaultValue,
  getCxxValueFromDefaultValue,
} from '../../utils';
import signedsource from 'signedsource';

function getClassName(ossReleaseStage: OSSReleaseStageValue): string {
  if (ossReleaseStage === 'experimental') {
    return 'ReactNativeFeatureFlagsOverridesOSSExperimental';
  } else if (ossReleaseStage === 'canary') {
    return 'ReactNativeFeatureFlagsOverridesOSSCanary';
  }

  return 'ReactNativeFeatureFlagsOverridesOSSStable';
}

function getParentClassName(ossReleaseStage: OSSReleaseStageValue): string {
  if (ossReleaseStage === 'experimental') {
    return 'ReactNativeFeatureFlagsOverridesOSSCanary';
  } else if (ossReleaseStage === 'canary') {
    return 'ReactNativeFeatureFlagsOverridesOSSStable';
  }

  return 'ReactNativeFeatureFlagsProvider';
}

export default function (
  definitions: FeatureFlagDefinitions,
  ossReleaseStage: OSSReleaseStageValue,
): string {
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

#include <react/featureflags/${getParentClassName(ossReleaseStage)}.h>

namespace facebook::react {

class ${getClassName(ossReleaseStage)} : public ${getParentClassName(ossReleaseStage)} {
 public:
    ${getClassName(ossReleaseStage)}() = default;

${Object.entries(definitions.common)
  .map(([flagName, flagConfig]) => {
    if (flagConfig.ossReleaseStage === ossReleaseStage) {
      return `  ${getCxxTypeFromDefaultValue(
        flagConfig.metadata.expectedReleaseValue,
      )} ${flagName}() override {
    return ${getCxxValueFromDefaultValue(flagConfig.metadata.expectedReleaseValue)};
  }`;
    }
  })
  .filter(Boolean)
  .join('\n\n')}
};

} // namespace facebook::react
`);
}
