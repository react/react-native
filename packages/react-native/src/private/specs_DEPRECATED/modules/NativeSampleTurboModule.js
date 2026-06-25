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
} from '../../../../Libraries/TurboModule/RCTExport';
import type {
  EventEmitter,
  UnsafeObject,
} from '../../../../Libraries/Types/CodegenTypes';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export enum EnumInt {
  A = 23,
  B = 42,
}

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export interface Spec extends TurboModule {
  readonly onPress: EventEmitter<void>;
  readonly onClick: EventEmitter<string>;
  readonly onChange: EventEmitter<ObjectStruct>;
  readonly onSubmit: EventEmitter<ObjectStruct[]>;
  // Exported methods.
  readonly getConstants: () => {
    const1: boolean,
    const2: number,
    const3: string,
  };
  readonly voidFunc: () => void;
  readonly getBool: (arg: boolean) => boolean;
  readonly getEnum?: (arg: EnumInt) => EnumInt;
  readonly getNumber: (arg: number) => number;
  readonly getString: (arg: string) => string;
  readonly getArray: (arg: Array<any>) => Array<any>;
  readonly getObject: (arg: Object) => Object;
  readonly getUnsafeObject: (arg: UnsafeObject) => UnsafeObject;
  readonly getRootTag: (arg: RootTag) => RootTag;
  readonly getValue: (x: number, y: string, z: Object) => Object;
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly getValueWithPromise: (error: boolean) => Promise<string>;
  readonly voidFuncThrows?: () => void;
  readonly getObjectThrows?: (arg: Object) => Object;
  readonly promiseThrows?: () => Promise<void>;
  readonly voidFuncAssert?: () => void;
  readonly getObjectAssert?: (arg: Object) => Object;
  readonly promiseAssert?: () => Promise<void>;

  // Android-only
  readonly getImageUrl?: () => Promise<string | null>;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModule',
) as Spec;
