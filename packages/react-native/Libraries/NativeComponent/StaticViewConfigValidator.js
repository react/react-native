/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import * as ReactNativeFeatureFlags from '../../src/private/featureflags/ReactNativeFeatureFlags';
import {type ViewConfig} from '../Renderer/shims/ReactNativeTypes';

export type Difference =
  | {
      type: 'missing',
      path: Array<string>,
      nativeValue: unknown,
    }
  | {
      type: 'unequal',
      path: Array<string>,
      nativeValue: unknown,
      staticValue: unknown,
    };

export type ValidationResult = ValidResult | InvalidResult;
type ValidResult = {
  type: 'valid',
};
type InvalidResult = {
  type: 'invalid',
  differences: Array<Difference>,
};

/**
 * During the migration from native view configs to static view configs, this is
 * used to validate that the two are equivalent.
 */
export function validate(
  name: string,
  nativeViewConfig: ViewConfig,
  staticViewConfig: ViewConfig,
): ValidationResult {
  const differences: Array<Difference> = [];
  accumulateDifferences(
    differences,
    [],
    {
      bubblingEventTypes: nativeViewConfig.bubblingEventTypes,
      directEventTypes: nativeViewConfig.directEventTypes,
      uiViewClassName: nativeViewConfig.uiViewClassName,
      validAttributes: nativeViewConfig.validAttributes,
    },
    {
      bubblingEventTypes: staticViewConfig.bubblingEventTypes,
      directEventTypes: staticViewConfig.directEventTypes,
      uiViewClassName: staticViewConfig.uiViewClassName,
      validAttributes: staticViewConfig.validAttributes,
    },
  );

  if (differences.length === 0) {
    return {type: 'valid'};
  }

  return {
    type: 'invalid',
    differences,
  };
}

export function stringifyValidationResult(
  name: string,
  validationResult: InvalidResult,
): string {
  const {differences} = validationResult;
  return [
    `StaticViewConfigValidator: Invalid static view config for '${name}'.`,
    '',
    ...differences.map(difference => {
      const {type, path} = difference;
      switch (type) {
        case 'missing':
          return `- '${path.join('.')}' is missing.`;
        case 'unequal':
          return `- '${path.join('.')}' is the wrong value.`;
      }
    }),
    '',
  ].join('\n');
}

function accumulateDifferences(
  differences: Array<Difference>,
  path: Array<string>,
  nativeObject: {...},
  staticObject: {...},
): void {
  for (const nativeKey in nativeObject) {
    // $FlowFixMe[invalid-computed-prop]
    const nativeValue = nativeObject[nativeKey];

    if (!staticObject.hasOwnProperty(nativeKey)) {
      differences.push({
        path: [...path, nativeKey],
        type: 'missing',
        nativeValue,
      });
      continue;
    }

    // $FlowFixMe[invalid-computed-prop]
    const staticValue = staticObject[nativeKey];

    const nativeValueIfObject = ifObject(nativeValue);
    if (nativeValueIfObject != null) {
      const staticValueIfObject = ifObject(staticValue);
      if (staticValueIfObject != null) {
        path.push(nativeKey);
        accumulateDifferences(
          differences,
          path,
          nativeValueIfObject,
          staticValueIfObject,
        );
        path.pop();
        continue;
      }
    }

    if (
      nativeValue !== staticValue &&
      !ReactNativeFeatureFlags.enableNativeCSSParsing()
    ) {
      differences.push({
        path: [...path, nativeKey],
        type: 'unequal',
        nativeValue,
        staticValue,
      });
    }
  }
}

function ifObject(value: unknown): ?{...} {
  return typeof value === 'object' && !Array.isArray(value) ? value : null;
}
