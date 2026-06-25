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

export type StateType = {
  state: string,
};

export enum StatusRegularEnum {
  Active,
  Paused,
  Off,
}

export enum StatusStrEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export enum StatusNumEnum {
  Active = 2,
  Paused = 1,
  Off = 0,
}

export enum StatusLowerCaseEnum {
  Active = 'active',
  Paused = 'paused',
  Off = 'off',
}

export type StateTypeWithEnums = {
  state: string,
  regular: StatusRegularEnum,
  str: StatusStrEnum,
  num: StatusNumEnum,
  lowerCase: StatusLowerCaseEnum,
};

export interface Spec extends TurboModule {
  readonly getStatusRegular: (statusProp: StateType) => StatusRegularEnum;
  readonly getStatusStr: (statusProp: StateType) => StatusStrEnum;
  readonly getStatusNum: (statusProp: StateType) => StatusNumEnum;
  readonly getStatusLowerCase: (statusProp: StateType) => StatusLowerCaseEnum;
  readonly getStateType: (
    a: StatusRegularEnum,
    b: StatusStrEnum,
    c: StatusNumEnum,
    d: StatusLowerCaseEnum,
  ) => StateType;
  readonly getStateTypeWithEnums: (
    paramOfTypeWithEnums: StateTypeWithEnums,
  ) => StateTypeWithEnums;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NativeEnumTurboModule',
) as Spec;
