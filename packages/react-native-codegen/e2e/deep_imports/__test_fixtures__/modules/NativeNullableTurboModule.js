/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export interface Spec extends TurboModule {
  readonly getBool: (a: ?boolean) => ?boolean;
  readonly getNumber: (a: ?number) => ?number;
  readonly getString: (a: ?number) => ?string;
  readonly getArray: (a: ?Array<any>) => ?Array<any>;
  readonly getObject: (a: ?Object) => ?Object;
  readonly getValueWithPromise: () => ?Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
