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

export type String = string;
type CB = (value: String) => void;

export interface Spec extends TurboModule {
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly getValueWithCallbackWithAlias: (c: CB) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
