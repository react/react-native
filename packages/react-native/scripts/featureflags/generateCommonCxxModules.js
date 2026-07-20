/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {GeneratorConfig, GeneratorResult} from './types';

import ReactNativeFeatureFlagsCPP from './templates/common-cxx/ReactNativeFeatureFlags.cpp-template';
import ReactNativeFeatureFlagsH from './templates/common-cxx/ReactNativeFeatureFlags.h-template';
import ReactNativeFeatureFlagsAccessorCPP from './templates/common-cxx/ReactNativeFeatureFlagsAccessor.cpp-template';
import ReactNativeFeatureFlagsAccessorH from './templates/common-cxx/ReactNativeFeatureFlagsAccessor.h-template';
import ReactNativeFeatureFlagsDefaultsH from './templates/common-cxx/ReactNativeFeatureFlagsDefaults.h-template';
import ReactNativeFeatureFlagsDynamicProviderH from './templates/common-cxx/ReactNativeFeatureFlagsDynamicProvider.h-template';
import ReactNativeFeatureFlagsOverrides from './templates/common-cxx/ReactNativeFeatureFlagsOverridesOSS_Stage_.h-template';
import ReactNativeFeatureFlagsProviderH from './templates/common-cxx/ReactNativeFeatureFlagsProvider.h-template';
import path from 'node:path';

export default function generateCommonCxxModules(
  generatorConfig: GeneratorConfig,
): GeneratorResult {
  const {commonCxxPath, featureFlagDefinitions} = generatorConfig;

  return {
    [path.join(commonCxxPath, 'ReactNativeFeatureFlags.h')]:
      ReactNativeFeatureFlagsH(featureFlagDefinitions),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlags.cpp')]:
      ReactNativeFeatureFlagsCPP(featureFlagDefinitions),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsAccessor.h')]:
      ReactNativeFeatureFlagsAccessorH(featureFlagDefinitions),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsAccessor.cpp')]:
      ReactNativeFeatureFlagsAccessorCPP(featureFlagDefinitions),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsDefaults.h')]:
      ReactNativeFeatureFlagsDefaultsH(featureFlagDefinitions),
    [path.join(
      commonCxxPath,
      'ReactNativeFeatureFlagsOverridesOSSExperimental.h',
    )]: ReactNativeFeatureFlagsOverrides(
      featureFlagDefinitions,
      'experimental',
    ),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsOverridesOSSCanary.h')]:
      ReactNativeFeatureFlagsOverrides(featureFlagDefinitions, 'canary'),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsProvider.h')]:
      ReactNativeFeatureFlagsProviderH(featureFlagDefinitions),
    [path.join(commonCxxPath, 'ReactNativeFeatureFlagsDynamicProvider.h')]:
      ReactNativeFeatureFlagsDynamicProviderH(featureFlagDefinitions),
  };
}
