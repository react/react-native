/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type Boolean = boolean;
type AnotherBoolean = Boolean;

export interface Spec extends TurboModule {
  readonly getBoolean: (arg: boolean) => boolean;
  readonly getBooleanWithAlias: (arg: Boolean) => AnotherBoolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
