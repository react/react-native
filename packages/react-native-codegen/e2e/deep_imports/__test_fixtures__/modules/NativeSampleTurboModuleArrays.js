/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {
  RootTag,
  TurboModule,
} from 'react-native/Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type Animal = {
  name: string,
};

export interface Spec extends TurboModule {
  // Exported methods.
  readonly getConstants: () => {
    const1: Array<boolean>,
    const2: Array<number>,
    const3: Array<string>,
    id?: Array<?{prop: number}>,
  };
  readonly voidFunc: () => void;
  readonly getBool: (id: Array<boolean>) => Array<boolean>;
  readonly getNumber: (arg: Array<number>) => Array<number>;
  readonly getString: (arg: Array<string>) => Array<string>;
  readonly getArray: (arg: Array<Array<any>>) => Array<Array<any>>;
  readonly getObject: (arg: Array<Object>) => Array<Object>;
  readonly getObjectShape: (
    arg: Array<{prop: number}>,
  ) => Array<{prop: number}>;
  readonly getAlias: (arg: Array<Animal>) => Array<Animal>;
  readonly getRootTag: (arg: Array<RootTag>) => Array<RootTag>;
  readonly getValue: (
    x: Array<number>,
    y: Array<string>,
    z: Array<Object>,
  ) => Array<Object>;
  readonly getValueWithCallback: (
    callback: (value: Array<string>) => void,
  ) => void;
  readonly getValueWithPromise: (
    error: Array<boolean>,
  ) => Promise<Array<string>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleArrays',
) as Spec;
