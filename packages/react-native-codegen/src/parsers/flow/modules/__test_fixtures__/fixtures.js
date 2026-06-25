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

'use strict';

const EMPTY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // no methods
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string;

export interface Spec extends TurboModule {
  // Exported methods.
  +getObject: (arg: {|const1: {|const1: boolean|}|}) => {|
    const1: {|const1: boolean|},
  |};
  +getReadOnlyObject: (arg: $ReadOnly<{|const1: $ReadOnly<{|const1: boolean|}>|}>) => $ReadOnly<{|
    const1: {|const1: boolean|},
  |}>;
  +getObject2: (arg: { a: String }) => Object;
  +getObjectInArray: (arg: {const1: {|const1: boolean|}}) => Array<{|
    const1: {const1: boolean},
  |}>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getConstants: () => {|
    isTesting: boolean,
    reactNativeVersion: {|
      major: number,
      minor: number,
      patch?: number,
      prerelease: ?number,
    |},
    forceTouchAvailable: boolean,
    osVersion: string,
    systemName: string,
    interfaceIdiom: string,
  |};
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +passBool?: (arg: boolean) => void;
  +passNumber: (arg: number) => void;
  +passBooleanLiteral: (arg: true) => void;
  +passNumberLiteral: (arg: 4) => void;
  +passString: (arg: string) => void;
  +passStringish: (arg: Stringish) => void;
  +passStringLiteral: (arg: 'A String Literal') => void;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type NumNum = number;
export type Num = (arg: NumNum) => void;
type Num2 = Num;
export type Void = void;
export type A = number;
export type B = number;
export type ObjectAlias = {|
  x: number,
  y: number,
  label: string,
  truthy: boolean,
|};
export type PureObjectAlias = ObjectAlias;
export type ReadOnlyAlias = $ReadOnly<ObjectAlias>;

export interface Spec extends TurboModule {
  // Exported methods.
  +getNumber: Num2;
  +getVoid: () => Void;
  +getArray: (a: Array<A>) => {| a: B |};
  +getStringFromAlias: (a: ObjectAlias) => string;
  +getStringFromNullableAlias: (a: ?ObjectAlias) => string;
  +getStringFromPureAlias: (a: PureObjectAlias) => string;
  +getStringFromReadOnlyAlias: (a: ReadOnlyAlias) => string;
  +getStringFromNullableReadOnlyAlias: (a: ?ReadOnlyAlias) => string;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type Bar = {|
  z: number
|};

type Foo = {|
  bar1: Bar,
  bar2: Bar,
|};

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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {Int32, Float} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  +getInt: (arg: Int32) => Int32;
  +getFloat: (arg: Float) => Float;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getObject: (o: Object) => Object,
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
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {UnsafeObject} from 'react-native/Libraries/Types/CodegenTypes';

export interface Spec extends TurboModule {
  +getUnsafeObject: (o: UnsafeObject) => UnsafeObject,
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type SomeObj = {|
  a: string,
  b?: boolean,
|};

export interface Spec extends TurboModule {
  +getSomeObj: () => SomeObj;
  +getPartialSomeObj: () => Partial<SomeObj>;
  +getSomeObjFromPartialSomeObj: (value: Partial<SomeObj>) => SomeObj;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type SomeObj = {|
  a: string,
  b?: boolean,
|};

export type PartialSomeObj = Partial<SomeObj>;

export interface Spec extends TurboModule {
  +getPartialPartial: (value1: Partial<SomeObj>, value2: PartialSomeObj) => SomeObj
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {RootTag, TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getRootTag: (rootTag: RootTag) => RootTag,
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Exported methods.
  +voidFunc: (arg: ?string) => void;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<string>) => Array<string>;
  +getArray: (arg: $ReadOnlyArray<string>) => $ReadOnlyArray<string>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

type DisplayMetricsAndroid = {|
 width: number,
|};

export interface Spec extends TurboModule {
  +getConstants: () => {|
    +Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid,
    },
  |};
  +getConstants2: () => $ReadOnly<{|
    +Dimensions: {
      windowPhysicalPixels: DisplayMetricsAndroid,
    },
  |}>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<[string, string]>) => Array<string | number | boolean>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type SomeString = string;

export interface Spec extends TurboModule {
  +getArray: (arg: Array<SomeString>) => Array<string>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArray: (arg: Array<Array<Array<Array<Array<string>>>>>) => Array<Array<Array<string>>>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type String = string;
export type SomeObj = {| a: string |};

export interface Spec extends TurboModule {
  +getValueWithPromise: () => Promise<string>;
  +getValueWithPromiseDefinedSomewhereElse: () => Promise<String>;
  +getValueWithPromiseObjDefinedSomewhereElse: () => Promise<SomeObj>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // Exported methods.
  +getValueWithCallback: (
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type ChooseInt = 1 | 2 | 3;
export type ChooseFloat = 1.44 | 2.88 | 5.76;
export type ChooseObject = {} | {low: string};
export type ChooseString = 'One' | 'Two' | 'Three';

export interface Spec extends TurboModule {
 +getUnion: (chooseInt: ChooseInt, chooseFloat: ChooseFloat, chooseObject: ChooseObject, chooseString: ChooseString) => ChooseObject;
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
 * @flow strict
 * @format
 */

import type {TurboModule} from '../../../../Libraries/TurboModule/RCTExport';

import * as TurboModuleRegistry from '../../../../Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getStringUnion: () => 'light' | 'dark';
  +setStringUnion: (strings: 'light' | 'dark') => void;

  +getNumberUnion: () => 1 | 2;
  +setNumberUnion: (numbers: 1 | 2) => void;

  +getObjectUnion: () => {a: 1} | {b: 2};
  +setObjectUnion: (objects: {a: 1} | {b: 2}) => void;
}

export default (TurboModuleRegistry.get<Spec>('SampleTurboModule'): ?Spec);
`;

const NATIVE_MODULE_WITH_EVENT_EMITTERS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import type {EventEmitter} from '../CodegenTypes';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export type MappedObject = {[string]: string};

export interface Spec extends TurboModule {
  +onEvent1: EventEmitter<void>;
  +onEvent2: EventEmitter<string>;
  +onEvent3: EventEmitter<number>;
  +onEvent4: EventEmitter<boolean>;
  +onEvent5: EventEmitter<ObjectStruct>;
  +onEvent6: EventEmitter<ObjectStruct[]>;
  +onEvent7: EventEmitter<MappedObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_OPAQUE_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export opaque type Task = mixed;
export opaque type TimeoutID = number;

export interface Spec extends TurboModule {
  +createTask: (callback: () => void) => Task;
  +cancelTask: (task: Task) => void;

  +setTimeout: (callback: () => void) => TimeoutID;
  +clearTimeout: (timeoutID: TimeoutID) => void;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  // no methods
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModuleAndroid');

`;

const IOS_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

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
  getEnums(quality: Quality, resolution?: Resolution, stringOptions: StringOptions): string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModuleIOS');

`;

const CXX_ONLY_NATIVE_MODULE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type ChooseInt = 1 | 2 | 3;
export type ChooseFloat = 1.44 | 2.88 | 5.76;
export type ChooseObject = {} | {low: string};
export type ChooseString = 'One' | 'Two' | 'Three';

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
  +getCallback: () => () => void;
  +getMixed: (arg: mixed) => mixed;
  +getEnums: (quality: Quality, resolution?: Resolution, stringOptions: StringOptions) => Quality;
  +getBinaryTreeNode: (arg: BinaryTreeNode) => BinaryTreeNode;
  +getGraphNode: (arg: GraphNode) => GraphNode;
  +getMap: (arg: {[a: string]: ?number}) => {[b: string]: ?number};
  +getAnotherMap: (arg: {[string]: string}) => {[string]: string};
  +getUnion: (chooseInt: ChooseInt, chooseFloat: ChooseFloat, chooseObject: ChooseObject, chooseString: ChooseString) => ChooseObject;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModuleCxx');

`;

const PROMISE_WITH_COMMONLY_USED_TYPES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type Season = 'Spring' | 'Summer' | 'Autumn' | 'Winter';

export type CustomObject = {|
  field1: Array<Object>,
  field2: boolean,
  field3: string,
  type: 'A_String_Literal',
|};

export interface Spec extends TurboModule {
  returnStringArray(): Promise<Array<string>>;
  returnObjectArray(): Promise<Array<Object>>;
  returnNullableNumber(): Promise<number | null>;
  returnEmpty(): Promise<empty>;
  returnUnsupportedIndex(): Promise<{ [string]: 'authorized' | 'denied' | 'undetermined' | true | false }>;
  returnSupportedIndex(): Promise<{ [string]: CustomObject }>;
  returnEnum() : Promise<Season>;
  returnObject() : Promise<CustomObject>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NAMESPACED_NATIVE_MODULE_WITH_FLOAT_AND_INT32 = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {CodegenTypes} from 'react-native';

export interface Spec extends TurboModule {
  +getInt: (arg: CodegenTypes.Int32) => CodegenTypes.Int32;
  +getFloat: (arg: CodegenTypes.Float) => CodegenTypes.Float;
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
 * @flow strict
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';
import type {CodegenTypes} from 'react-native';

export interface Spec extends TurboModule {
  +getUnsafeObject: (o: CodegenTypes.UnsafeObject) => CodegenTypes.UnsafeObject,
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import type {CodegenTypes} from 'react-native';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export type ObjectStruct = {
  a: number,
  b: string,
  c?: ?string,
};

export type MappedObject = {[string]: string};

export interface Spec extends TurboModule {
  +onEvent1: EventEmitter<void>;
  +onEvent2: EventEmitter<string>;
  +onEvent3: EventEmitter<number>;
  +onEvent4: EventEmitter<boolean>;
  +onEvent5: EventEmitter<ObjectStruct>;
  +onEvent6: EventEmitter<ObjectStruct[]>;
  +onEvent7: EventEmitter<MappedObject>;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getArrayBuffer: () => ArrayBuffer;
  +voidArrayBuffer: (arg: ArrayBuffer) => void;
  +voidNullableArrayBuffer: (arg: ?ArrayBuffer) => void;
  +promiseArrayBuffer: () => Promise<ArrayBuffer>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

module.exports = {
  NATIVE_MODULE_WITH_OBJECT_WITH_OBJECT_DEFINED_IN_FILE_AS_PROPERTY,
  NATIVE_MODULE_WITH_ARRAY_WITH_UNION_AND_TOUPLE,
  NATIVE_MODULE_WITH_FLOAT_AND_INT32,
  NATIVE_MODULE_WITH_ALIASES,
  NATIVE_MODULE_WITH_NESTED_ALIASES,
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
  NATIVE_MODULE_WITH_COMPLEX_ARRAY,
  NATIVE_MODULE_WITH_ARRAY_WITH_ALIAS,
  NATIVE_MODULE_WITH_BASIC_PARAM_TYPES,
  NATIVE_MODULE_WITH_CALLBACK,
  NATIVE_MODULE_WITH_UNION,
  NATIVE_MODULE_WITH_UNION_RETURN_TYPES,
  NATIVE_MODULE_WITH_EVENT_EMITTERS,
  NATIVE_MODULE_WITH_OPAQUE_TYPES,
  NATIVE_MODULE_WITH_ARRAY_BUFFER,
  EMPTY_NATIVE_MODULE,
  ANDROID_ONLY_NATIVE_MODULE,
  IOS_ONLY_NATIVE_MODULE,
  CXX_ONLY_NATIVE_MODULE,
  PROMISE_WITH_COMMONLY_USED_TYPES,

  NAMESPACED_NATIVE_MODULE_WITH_FLOAT_AND_INT32,
  NAMESPACED_NATIVE_MODULE_WITH_UNSAFE_OBJECT,
  NAMESPACED_NATIVE_MODULE_WITH_EVENT_EMITTERS,
};
