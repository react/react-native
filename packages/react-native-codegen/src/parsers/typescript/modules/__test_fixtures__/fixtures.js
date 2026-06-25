/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

// @licenselint-loose-mode

const EMPTY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_OBJECTS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  // Exported methods.
  readonly getObject: (arg: {const1: {const1: boolean}}) => {
    const1: {const1: boolean},
  };
  readonly getReadOnlyObject: (arg: Readonly<{const1: Readonly<{const1: boolean}>}>) => Readonly<{
    const1: {const1: boolean},
  }>;
  readonly getObject2: (arg: { a: String }) => Object;
  readonly getObjectInArray: (arg: {const1: {const1: boolean}}) => Array<{
    const1: {const1: boolean},
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_OBJECTS_WITH_NULLABLE_KEY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    isTesting: boolean;
    reactNativeVersion: {
      major: number;
      minor: number;
      patch?: number;
      prerelease: number | null | undefined;
    };
    forceTouchAvailable: boolean;
    osVersion: string;
    systemName: string;
    interfaceIdiom: string;
  };
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_PARAM_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly passBool?: (arg: boolean) => void;
  readonly passNumber: (arg: number) => void;
  readonly passBooleanLiteral: (arg: true) => void;
  readonly passNumberLiteral: (arg: 4) => void;
  readonly passString: (arg: string) => void;
  readonly passStringish: (arg: Stringish) => void;
  readonly passStringLiteral: (arg: 'A String Literal') => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ALIASES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type NumNum = number;
export type Num = (arg: NumNum) => void;
type Num2 = Num;
export type Void = void;
export type A = number;
export type B = number;
export type ObjectAlias = {
  x: number;
  y: number;
  label: string;
  truthy: boolean;
};
export type PureObjectAlias = ObjectAlias;
export type ReadOnlyAlias = Readonly<ObjectAlias>;

export interface Spec extends TurboModule {
  // Exported methods.
  readonly getNumber: Num2;
  readonly getVoid: () => Void;
  readonly getArray: (a: Array<A>) => {a: B};
  readonly getStringFromAlias: (a: ObjectAlias) => string;
  readonly getStringFromNullableAlias: (a: ObjectAlias | null) => string;
  readonly getStringFromPureAlias: (a: PureObjectAlias) => string;
  readonly getStringFromReadOnlyAlias: (a: ReadOnlyAlias) => string;
  readonly getStringFromNullableReadOnlyAlias: (a: ReadOnlyAlias | null) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_NESTED_ALIASES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type Bar = {
  z: number
};

type Foo = {
  bar1: Bar,
  bar2: Bar,
};

export interface Spec extends TurboModule {
  // Exported methods.
  foo1: (x: Foo) => Foo;
  foo2: (x: Foo) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NESTED_INTERFACES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

interface Bar {
  z: number
};

interface Base1 {
  bar1: Bar,
}

interface Base2 {
  bar2: Bar,
}

interface Base3 extends Base2 {
  bar3: Bar,
}

interface Foo extends Base1, Base3 {
  bar4: Bar,
};

export interface Spec extends TurboModule {
  // Exported methods.
  foo1: (x: Foo) => Foo;
  foo2: (x: Foo) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_INTERSECTION_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */


import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type Bar  = {
  z: number
};

type Base1 = {
  bar1: Bar,
}

type Base2 = {
  bar2: Bar,
}

type Base3 = Base2 & {
  bar3: Bar,
}

type Foo = Base1 & Base3 & {
  bar4: Bar,
};

export interface Spec extends TurboModule {
  // Exported methods.
  foo1: (x: Foo) => Foo;
  foo2: (x: Foo) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_FLOAT_AND_INT32 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {Int32, Float} from 'react-native/Libraries/Types/CodegenTypes';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getInt: (arg: Int32) => Int32;
  readonly getFloat: (arg: Float) => Float;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_SIMPLE_OBJECT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getObject: (o: Object) => Object,
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_UNSAFE_OBJECT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  readonly getUnsafeObject: (o: UnsafeObject) => UnsafeObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_PARTIALS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeObj = {
  a: string,
  b?: boolean,
};

export interface Spec extends TurboModule {
  getSomeObj: () => SomeObj;
  getPartialSomeObj: () => Partial<SomeObj>;
  getSomeObjFromPartialSomeObj: (value: Partial<SomeObj>) => SomeObj;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_PARTIALS_COMPLEX = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeObj = {
  a: string,
  b?: boolean,
};

export type PartialSomeObj = Partial<SomeObj>;

export interface Spec extends TurboModule {
  getPartialPartial: (value1: Partial<SomeObj>, value2: PartialSomeObj) => SomeObj;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ROOT_TAG = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {
  TurboModule,
  RootTag,
} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getRootTag: (rootTag: RootTag) => RootTag;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_NULLABLE_PARAM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly voidFunc: (arg: string | null | undefined) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_ARRAY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (arg: Array<string>) => (Array<(string)>);
  readonly getArray: (arg: ReadonlyArray<string>) => (ReadonlyArray<(string)>);
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_BASIC_ARRAY2 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (arg: string[]) => ((string)[]);
  readonly getArray: (arg: readonly string[]) => (readonly (string)[]);
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

type DisplayMetricsAndroid = {
  width: number;
};

export interface Spec extends TurboModule {
  readonly getConstants: () => {
    readonly Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid;
    };
  };
  readonly getConstants2: () => Readonly<{
    readonly Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid;
    };
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: Array<[string, string]>,
  ) => Array<string | number | boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  getArray(
    arg: [string, string][],
  ): (string | number | boolean)[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  readonly getArray: (arg: Array<SomeString>) => Array<string>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  readonly getArray: (arg: SomeString[]) => string[];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_ARRAY = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: Array<Array<Array<Array<Array<string>>>>>,
  ) => Array<Array<Array<string>>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_COMPLEX_ARRAY2 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArray: (
    arg: string[][][][][],
  ) => string[][][];
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_PROMISE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type String = string;
export type SomeObj = { a: string };

export interface Spec extends TurboModule {
  readonly getValueWithPromise: () => Promise<string>;
  readonly getValueWithPromiseDefinedSomewhereElse: () => Promise<String>;
  readonly getValueWithPromiseObjDefinedSomewhereElse: () => Promise<SomeObj>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_CALLBACK = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getValueWithCallback: (
    callback: (value: string, arr: Array<Array<string>>) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_UNION = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type ChooseInt = 1 | 2 | 3;
export type ChooseFloat = 1.44 | 2.88 | 5.76;
export type ChooseObject = {} | {low: string};
export type ChooseString = 'One' | 'Two' | 'Three';

export interface Spec extends TurboModule {
  readonly getUnion: (chooseInt: ChooseInt, chooseFloat: ChooseFloat, chooseObject: ChooseObject, chooseString: ChooseString) => ChooseObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_UNION_RETURN_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getStringUnion: () => 'light' | 'dark';
  readonly setStringUnion: (strings: 'light' | 'dark') => void;

  readonly getNumberUnion: () => 1 | 2;
  readonly setNumberUnion: (numbers: 1 | 2) => void;

  readonly getObjectUnion: () => {a: 1} | {b: 2};
  readonly setObjectUnion: (objects: {a: 1} | {b: 2}) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULE_WITH_EVENT_EMITTERS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type ObjectStruct = {
  a: number;
  b: string;
  c?: string | null;
};

export type MappedObject = {[key: string]: string};

export interface Spec extends TurboModule {
  readonly onEvent1: EventEmitter<void>;
  readonly onEvent2: EventEmitter<string>;
  readonly onEvent3: EventEmitter<number>;
  readonly onEvent4: EventEmitter<boolean>;
  readonly onEvent5: EventEmitter<ObjectStruct>;
  readonly onEvent6: EventEmitter<ObjectStruct[]>;
  readonly onEvent7: EventEmitter<MappedObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const ANDROID_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleAndroid',
);
`;

const IOS_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export enum Quality {
  SD,
  HD,
}

export enum Resolution {
  Low = 720,
  High = 1080,
}

export enum StringOptions {
  One = 'one',
  Two = 'two',
  Three = 'three',
}

export interface Spec extends TurboModule {
  readonly getEnums: (quality: Quality, resolution?: Resolution, stringOptions: StringOptions) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleIOS',
);
`;

const CXX_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export enum Quality {
  SD,
  HD,
}

export enum Resolution {
  Corrupted = -1,
  Low = 720,
  High = 1080,
}

export enum StringOptions {
  One = 'one',
  Two = 'two',
  Three = 'three',
}

export type ChooseInt = 1 | 2 | 3;
export type ChooseFloat = 1.44 | 2.88 | 5.76;
export type ChooseObject = {} | {low: string};
export type ChooseString = 'One' | 'Two' | 'Three';

export type BinaryTreeNode = {
  left?: BinaryTreeNode,
  value: number,
  right?: BinaryTreeNode,
};

export type GraphNode = {
  label: string,
  neighbors?: Array<GraphNode>,
};

export type CustomDeviceEvent = {
  type: string,
  level: number,
  degree?: number,
};

export interface Spec extends TurboModule {
  readonly getCallback: () => () => void;
  readonly getMixed: (arg: unknown) => unknown;
  readonly getEnums: (quality: Quality, resolution?: Resolution, stringOptions: StringOptions) => Quality;
  readonly getBinaryTreeNode: (arg: BinaryTreeNode) => BinaryTreeNode;
  readonly getGraphNode: (arg: GraphNode) => GraphNode;
  readonly getMap: (arg: {[a: string]: number | null;}) => {[b: string]: number | null;};
  readonly getAnotherMap: (arg: {[key: string]: string}) => {[key: string]: string};
  readonly getUnion: (chooseInt: ChooseInt, chooseFloat: ChooseFloat, chooseObject: ChooseObject, chooseString: ChooseString) => ChooseObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'SampleTurboModuleCxx',
);
`;

const NAMESPACED_NATIVE_MODULE_WITH_FLOAT_AND_INT32 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {CodegenTypes} from 'react-native';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getInt: (arg: CodegenTypes.Int32) => CodegenTypes.Int32;
  readonly getFloat: (arg: CodegenTypes.Float) => CodegenTypes.Float;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NAMESPACED_NATIVE_MODULE_WITH_UNSAFE_OBJECT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';
import type {CodegenTypes} from 'react-native';

export interface Spec extends TurboModule {
  readonly getUnsafeObject: (o: CodegenTypes.UnsafeObject) => CodegenTypes.UnsafeObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NAMESPACED_NATIVE_MODULE_WITH_EVENT_EMITTERS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {CodegenTypes} from 'react-native';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export type ObjectStruct = {
  a: number;
  b: string;
  c?: string | null;
};

export type MappedObject = {[key: string]: string};

export interface Spec extends TurboModule {
  readonly onEvent1: CodegenTypes.EventEmitter<void>;
  readonly onEvent2: CodegenTypes.EventEmitter<string>;
  readonly onEvent3: CodegenTypes.EventEmitter<number>;
  readonly onEvent4: CodegenTypes.EventEmitter<boolean>;
  readonly onEvent5: CodegenTypes.EventEmitter<ObjectStruct>;
  readonly onEvent6: CodegenTypes.EventEmitter<ObjectStruct[]>;
  readonly onEvent7: CodegenTypes.EventEmitter<MappedObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly getArrayBuffer: () => ArrayBuffer;
  readonly voidArrayBuffer: (arg: ArrayBuffer) => void;
  readonly voidNullableArrayBuffer: (arg: ArrayBuffer | null) => void;
  readonly promiseArrayBuffer: () => Promise<ArrayBuffer>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

module.exports = {
  NATIVE_MODULE_WITH_ARRAY_BUFFER,
  NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY,
  NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE,
  NATIVE_MODULE_WITH_ARRAY2_WITH_UNION_AND_TOUPLE,
  NATIVE_MODULE_WITH_FLOAT_AND_INT32,
  NATIVE_MODULE_WITH_ALIASES,
  NATIVE_MODULE_WITH_NESTED_ALIASES,
  NATIVE_MODULE_WITH_NESTED_INTERFACES,
  NATIVE_MODULE_WITH_INTERSECTION_TYPES,
  NATIVE_MODULE_WITH_PROMISE,
  NATIVE_MODULE_WITH_COMPLEX_OBJECTS,
  NATIVE_MODULE_WITH_COMPLEX_OBJECTS_WITH_NULLABLE_KEY,
  NATIVE_MODULE_WITH_SIMPLE_OBJECT,
  NATIVE_MODULE_WITH_UNSAFE_OBJECT,
  NATIVE_MODULE_WITH_PARTIALS,
  NATIVE_MODULE_WITH_PARTIALS_COMPLEX,
  NATIVE_MODULE_WITH_ROOT_TAG,
  NATIVE_MODULE_WITH_NULLABLE_PARAM,
  NATIVE_MODULE_WITH_BASIC_ARRAY,
  NATIVE_MODULE_WITH_BASIC_ARRAY2,
  NATIVE_MODULE_WITH_COMPLEX_ARRAY,
  NATIVE_MODULE_WITH_COMPLEX_ARRAY2,
  NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS,
  NATIVE_MODULE_WITH_ARRAY2_WITH_ALIAS,
  NATIVE_MODULE_WITH_BASIC_PARAM_TYPES,
  NATIVE_MODULE_WITH_CALLBACK,
  NATIVE_MODULE_WITH_UNION,
  NATIVE_MODULE_WITH_UNION_RETURN_TYPES,
  NATIVE_MODULE_WITH_EVENT_EMITTERS,
  EMPTY_NATIVE_MODULE,
  ANDROID_ONLY_NATIVE_MODULE,
  IOS_ONLY_NATIVE_MODULE,
  CXX_ONLY_NATIVE_MODULE,

  NAMESPACED_NATIVE_MODULE_WITH_FLOAT_AND_INT32,
  NAMESPACED_NATIVE_MODULE_WITH_UNSAFE_OBJECT,
  NAMESPACED_NATIVE_MODULE_WITH_EVENT_EMITTERS,
};
