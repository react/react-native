/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, RootTag, TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export enum EnumInt {
  A = 23,
  B = 42,
}

type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export interface Spec extends TurboModule {
  readonly onPress: CodegenTypes.EventEmitter<void>;
  readonly onClick: CodegenTypes.EventEmitter<string>;
  readonly onChange: CodegenTypes.EventEmitter<ObjectStruct>;
  readonly onSubmit: CodegenTypes.EventEmitter<ObjectStruct[]>;
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
  readonly getArray: (arg: Array<unknown>) => Array<unknown>;
  readonly getObject: (
    arg: CodegenTypes.UnsafeObject,
  ) => CodegenTypes.UnsafeObject;
  readonly getUnsafeObject: (
    arg: CodegenTypes.UnsafeObject,
  ) => CodegenTypes.UnsafeObject;
  readonly getRootTag: (arg: RootTag) => RootTag;
  readonly getValue: (
    x: number,
    y: string,
    z: CodegenTypes.UnsafeObject,
  ) => CodegenTypes.UnsafeObject;
  readonly getArrayBuffer: (buffer: ArrayBuffer) => ArrayBuffer;
  readonly createNativeBuffer: (size: number) => ArrayBuffer;
  readonly processAsyncBuffer: (payload: ArrayBuffer) => Promise<number>;
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly getValueWithPromise: (error: boolean) => Promise<string>;
  readonly voidFuncThrows?: () => void;
  readonly getObjectThrows?: (
    arg: CodegenTypes.UnsafeObject,
  ) => CodegenTypes.UnsafeObject;
  readonly promiseThrows?: () => Promise<void>;
  readonly voidFuncAssert?: () => void;
  readonly getObjectAssert?: (
    arg: CodegenTypes.UnsafeObject,
  ) => CodegenTypes.UnsafeObject;
  readonly promiseAssert?: () => Promise<void>;
  readonly getImageUrl?: () => Promise<string | null>;
  readonly requestSamplePermission?: () => Promise<boolean>;
  readonly pickMedia?: (mimeType: ?string) => Promise<string | null>;
  readonly pickMultipleMedia?: (
    mimeType: ?string,
    maxItems: number,
  ) => Promise<Array<string>>;
  readonly startSecondActivity?: () => void;
}

const RNTesterSampleTurboModule: Spec =
  TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

export default RNTesterSampleTurboModule;
