/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type GenericObject = Object;
type AnotherGenericObject = GenericObject;

export interface Spec extends TurboModule {
  readonly getGenericObject: (arg: Object) => Object;
  readonly getGenericObjectReadOnly: (arg: Object) => Readonly<{a: string}>;
  readonly getGenericObjectWithAlias: (
    arg: GenericObject,
  ) => AnotherGenericObject;
  readonly difficultObject: (A: {
    D: boolean,
    E: {
      D: boolean,
      E: number,
      F: string,
    },
    F: string,
  }) => {
    D: boolean,
    E: {
      D: boolean,
      E: {
        D: boolean,
        E: number,
        F: string,
      },
      F: string,
    },
    F: string,
  };
  readonly getConstants: () => {
    D: boolean,
    E: {
      D: boolean,
      E: {
        D: boolean,
        E: {
          D: boolean,
          E: number,
          F: string,
        },
        F: string,
      },
      F: string,
    },
    F: string,
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
