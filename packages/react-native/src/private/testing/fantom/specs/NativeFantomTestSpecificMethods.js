/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../../Libraries/TurboModule/RCTExport';
import type {Float, Int32} from '../../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../../Libraries/TurboModule/TurboModuleRegistry';

/**
 * This native module provides test-specific helpers that run native code
 * that isn't provided by React Native and cannot be specified in JavaScript
 * (e.g.: to test native hooks that don't have a consumer in any built-in APIs,
 * or call into methods that host platforms would generally call into).
 *
 * Feel free to add more methods here as needed by your tests, but make sure
 * that this is the only way to test the behavior.
 */
export interface Spec extends TurboModule {
  readonly registerForcedCloneCommitHook: () => void;
  readonly takeFunctionAndNoop: (fn: () => void) => void;
  readonly setRootNodeSize: (
    surfaceId: Int32,
    width: Float,
    height: Float,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeFantomTestSpecificMethodsCxx',
) as Spec;
