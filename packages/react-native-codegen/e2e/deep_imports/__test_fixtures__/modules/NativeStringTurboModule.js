/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export type String = string;
type AnotherString = String;

export interface Spec extends TurboModule {
  readonly getString: (arg: string) => string;
  readonly getStringWithAlias: (arg: String) => AnotherString;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
