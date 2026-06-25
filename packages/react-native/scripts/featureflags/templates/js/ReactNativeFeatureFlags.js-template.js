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

import {DO_NOT_MODIFY_COMMENT} from '../../utils';
import signedsource from 'signedsource';

export default function (definitions: FeatureFlagDefinitions): string {
  return signedsource.signFile(`/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${signedsource.getSigningToken()}
 * @flow strict
 * @noformat
 */

${DO_NOT_MODIFY_COMMENT}

import {
  type Getter,
  type OverridesFor,
  createJavaScriptFlagGetter,
  createNativeFlagGetter,
  setOverrides,
} from './ReactNativeFeatureFlagsBase';

export type ReactNativeFeatureFlagsJsOnly = Readonly<{
${Object.entries(definitions.jsOnly)
  .map(
    ([flagName, flagConfig]) =>
      `  ${flagName}: Getter<${typeof flagConfig.defaultValue}>,`,
  )
  .join('\n')}
}>;

export type ReactNativeFeatureFlagsJsOnlyOverrides = OverridesFor<ReactNativeFeatureFlagsJsOnly>;

export type ReactNativeFeatureFlags = Readonly<{
  ...ReactNativeFeatureFlagsJsOnly,
${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `  ${flagName}: Getter<${typeof flagConfig.defaultValue}>,`,
  )
  .join('\n')}
}>;

${Object.entries(definitions.jsOnly)
  .map(
    ([flagName, flagConfig]) =>
      `/**
 * ${flagConfig.metadata.description}
 */
export const ${flagName}: Getter<${typeof flagConfig.defaultValue}> = createJavaScriptFlagGetter('${flagName}', ${JSON.stringify(
        flagConfig.defaultValue,
      )});`,
  )
  .join('\n\n')}

${Object.entries(definitions.common)
  .map(
    ([flagName, flagConfig]) =>
      `/**
 * ${flagConfig.metadata.description}
 */
export const ${flagName}: Getter<${typeof flagConfig.defaultValue}> = createNativeFlagGetter('${flagName}', ${JSON.stringify(
        flagConfig.defaultValue,
      )});`,
  )
  .join('\n')}

/**
 * Overrides the feature flags with the provided methods.
 * NOTE: Only JS-only flags can be overridden from JavaScript using this API.
 */
export const override = setOverrides;
`);
}
