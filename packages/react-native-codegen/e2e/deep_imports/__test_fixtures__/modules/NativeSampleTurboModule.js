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
    const1: boolean,
    const2: number,
    const3: string,
  };
  readonly voidFunc: () => void;
  readonly getBool: (arg: boolean) => boolean;
  readonly getNumber: (arg: number) => number;
  readonly getString: (arg: string) => string;
  readonly getArray: (arg: Array<any>) => Array<any>;
  readonly getObject: (arg: Object) => Object;
  readonly getObjectShape: (arg: {prop: number}) => {prop: number};
  readonly getAlias: (arg: Animal) => Animal;
  readonly getRootTag: (arg: RootTag) => RootTag;
  readonly getValue: (x: number, y: string, z: Object) => Object;
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly getValueWithPromise: (error: boolean) => Promise<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
