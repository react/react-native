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

import JReactNativeFeatureFlagsCxxInteropCPP from './templates/android/JReactNativeFeatureFlagsCxxInterop.cpp-template';
import JReactNativeFeatureFlagsCxxInteropH from './templates/android/JReactNativeFeatureFlagsCxxInterop.h-template';
import ReactNativeFeatureFlagsKt from './templates/android/ReactNativeFeatureFlags.kt-template';
import ReactNativeFeatureFlagsCxxAccessorKt from './templates/android/ReactNativeFeatureFlagsCxxAccessor.kt-template';
import ReactNativeFeatureFlagsCxxInteropKt from './templates/android/ReactNativeFeatureFlagsCxxInterop.kt-template';
import ReactNativeFeatureFlagsDefaultsKt from './templates/android/ReactNativeFeatureFlagsDefaults.kt-template';
import ReactNativeFeatureFlagsLocalAccessorKt from './templates/android/ReactNativeFeatureFlagsLocalAccessor.kt-template';
import ReactNativeFeatureFlagsOverrides from './templates/android/ReactNativeFeatureFlagsOverrides_RNOSS__Stage__Android.kt-template.js';
import ReactNativeFeatureFlagsProviderKt from './templates/android/ReactNativeFeatureFlagsProvider.kt-template';
import path from 'node:path';

export default function generateAndroidModules(
  generatorConfig: GeneratorConfig,
): GeneratorResult {
  const {androidPath, androidJniPath, featureFlagDefinitions} = generatorConfig;

  return {
    [path.join(androidPath, 'ReactNativeFeatureFlags.kt')]:
      ReactNativeFeatureFlagsKt(featureFlagDefinitions),
    [path.join(androidPath, 'ReactNativeFeatureFlagsCxxAccessor.kt')]:
      ReactNativeFeatureFlagsCxxAccessorKt(featureFlagDefinitions),
    [path.join(androidPath, 'ReactNativeFeatureFlagsLocalAccessor.kt')]:
      ReactNativeFeatureFlagsLocalAccessorKt(featureFlagDefinitions),
    [path.join(androidPath, 'ReactNativeFeatureFlagsCxxInterop.kt')]:
      ReactNativeFeatureFlagsCxxInteropKt(featureFlagDefinitions),
    [path.join(androidPath, 'ReactNativeFeatureFlagsDefaults.kt')]:
      ReactNativeFeatureFlagsDefaultsKt(featureFlagDefinitions),
    [path.join(
      androidPath,
      'ReactNativeFeatureFlagsOverrides_RNOSS_Experimental_Android.kt',
    )]: ReactNativeFeatureFlagsOverrides(
      featureFlagDefinitions,
      'experimental',
    ),
    [path.join(
      androidPath,
      'ReactNativeFeatureFlagsOverrides_RNOSS_Canary_Android.kt',
    )]: ReactNativeFeatureFlagsOverrides(featureFlagDefinitions, 'canary'),
    [path.join(androidPath, 'ReactNativeFeatureFlagsProvider.kt')]:
      ReactNativeFeatureFlagsProviderKt(featureFlagDefinitions),
    [path.join(androidJniPath, 'JReactNativeFeatureFlagsCxxInterop.h')]:
      JReactNativeFeatureFlagsCxxInteropH(featureFlagDefinitions),
    [path.join(androidJniPath, 'JReactNativeFeatureFlagsCxxInterop.cpp')]:
      JReactNativeFeatureFlagsCxxInteropCPP(featureFlagDefinitions),
  };
}
