/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {CodegenTypes, TurboModule} from 'react-native';

import {TurboModuleRegistry} from 'react-native';

export enum EnumInt {
  IA = 23,
  IB = 42,
}

export enum EnumNone {
  NA,
  NB,
}

export enum EnumStr {
  SA = 's---a',
  SB = 's---b',
}

export type UnionFloat = 1.44 | 2.88 | 5.76;
export type UnionString = 'One' | 'Two' | 'Three';
export type UnionObject = {value: number} | {low: string};

export type ConstantsStruct = Readonly<{
  const1: boolean,
  const2: number,
  const3: string,
}>;

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export type ValueStruct = {
  x: number,
  y: string,
  z: ObjectStruct,
};

export type CustomHostObject = {};

export type BinaryTreeNode = {
  left?: BinaryTreeNode,
  value: number,
  right?: BinaryTreeNode,
};

export type GraphNode = {
  label: string,
  neighbors?: Array<GraphNode>,
};

export type MenuItem = {
  label: string,
  onPress: (value: string, flag: boolean) => void,
  shortcut?: ?string,
  items?: Array<MenuItem>,
};

export type CustomDeviceEvent = {
  type: string,
  level: number,
  degree?: ?number,
};

export interface Spec extends TurboModule {
  readonly onPress: CodegenTypes.EventEmitter<void>;
  readonly onClick: CodegenTypes.EventEmitter<string>;
  readonly onChange: CodegenTypes.EventEmitter<ObjectStruct>;
  readonly onSubmit: CodegenTypes.EventEmitter<ObjectStruct[]>;
  readonly onEvent: CodegenTypes.EventEmitter<EnumNone>;
  readonly getArray: (
    arg: Array<ObjectStruct | null>,
  ) => Array<ObjectStruct | null>;
  readonly getArrayBuffer: (payload: ArrayBuffer) => ArrayBuffer;
  readonly createNativeBuffer: (size: number) => ArrayBuffer;
  readonly processAsyncBuffer: (payload: ArrayBuffer) => Promise<number>;
  readonly getAsyncBuffer: (size: number) => Promise<ArrayBuffer>;
  readonly getBool: (arg: boolean) => boolean;
  readonly getConstants: () => ConstantsStruct;
  readonly getCustomEnum: (arg: EnumInt) => EnumInt;
  readonly getCustomHostObject: () => CustomHostObject;
  readonly consumeCustomHostObject: (
    customHostObject: CustomHostObject,
  ) => string;
  readonly getBinaryTreeNode: (arg: BinaryTreeNode) => BinaryTreeNode;
  readonly getGraphNode: (arg: GraphNode) => GraphNode;
  readonly getNumEnum: (arg: EnumInt) => EnumInt;
  readonly getStrEnum: (arg: EnumNone) => EnumStr;
  readonly getMap: (arg: {[key: string]: ?number}) => {[key: string]: ?number};
  readonly getNumber: (arg: number) => number;
  readonly getObject: (arg: ObjectStruct) => ObjectStruct;
  readonly getSet: (arg: Array<number>) => Array<number>;
  readonly getString: (arg: string) => string;
  readonly getUnion: (x: UnionFloat, y: UnionString, z: UnionObject) => string;
  readonly getValue: (x: number, y: string, z: ObjectStruct) => ValueStruct;
  readonly getValueWithCallback: (callback: (value: string) => void) => void;
  readonly setValueCallbackWithSubscription: (
    callback: (value: string) => void,
  ) => () => void;
  readonly getValueWithPromise: (error: boolean) => Promise<string>;
  readonly getWithWithOptionalArgs: (optionalArg?: boolean) => ?boolean;
  readonly voidFunc: () => void;
  readonly voidPromise: () => Promise<void>;
  readonly setMenu: (menuItem: MenuItem) => void;
  readonly emitCustomDeviceEvent: (eventName: string) => void;
  readonly voidFuncThrows: () => void;
  readonly getObjectThrows: (arg: ObjectStruct) => ObjectStruct;
  readonly promiseThrows: () => Promise<void>;
  readonly voidFuncAssert: () => void;
  readonly getObjectAssert: (arg: ObjectStruct) => ObjectStruct;
  readonly promiseAssert: () => Promise<void>;
}

export default TurboModuleRegistry.get<Spec>(
  'NativeCxxModuleExampleCxx',
) as ?Spec;
