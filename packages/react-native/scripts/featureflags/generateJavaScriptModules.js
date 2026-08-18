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

import NativeReactNativeFeatureFlagsCPP from './templates/js/NativeReactNativeFeatureFlags.cpp-template';
import NativeReactNativeFeatureFlagsH from './templates/js/NativeReactNativeFeatureFlags.h-template';
import NativeReactNativeFeatureFlagsJS from './templates/js/NativeReactNativeFeatureFlags.js-template';
import ReactNativeFeatureFlagsJS from './templates/js/ReactNativeFeatureFlags.js-template';
import path from 'node:path';

export default function generateCommonCxxModules(
  generatorConfig: GeneratorConfig,
): GeneratorResult {
  const {jsPath, commonNativeModuleCxxPath, featureFlagDefinitions} =
    generatorConfig;

  return {
    [path.join(jsPath, 'ReactNativeFeatureFlags.js')]:
      ReactNativeFeatureFlagsJS(featureFlagDefinitions),
    [path.join(jsPath, 'specs', 'NativeReactNativeFeatureFlags.js')]:
      NativeReactNativeFeatureFlagsJS(featureFlagDefinitions),
    [path.join(commonNativeModuleCxxPath, 'NativeReactNativeFeatureFlags.h')]:
      NativeReactNativeFeatureFlagsH(featureFlagDefinitions),
    [path.join(commonNativeModuleCxxPath, 'NativeReactNativeFeatureFlags.cpp')]:
      NativeReactNativeFeatureFlagsCPP(featureFlagDefinitions),
  };
}
