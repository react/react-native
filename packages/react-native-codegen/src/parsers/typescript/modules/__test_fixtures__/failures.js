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

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT = `
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
  getString: (arg: string) => Array;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM = `
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
  getString: (arg: Array) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_NOT_ONLY_METHODS = `
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
  readonly getBool: (arg: boolean) => boolean;
  readonly getNumber: (arg: number) => number;
  readonly getString: (arg: string) => string;
  sampleBool: boolean,

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_UNNAMED_PARAMS = `
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
  readonly getBool: (boolean) => boolean;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');
`;

const NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE = `
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
  readonly getBool: (arg: boolean) => Promise;

}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT = `
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

export default TurboModuleRegistry.getEnforcing<Spec1>('SampleTurboModule1');
export default TurboModuleRegistry.getEnforcing<Spec2>('SampleTurboModule2');
`;

const TWO_NATIVE_EXTENDING_TURBO_MODULE = `
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
  readonly getSth: (a: number | null | undefined) => void;
}

export interface Spec2 extends TurboModule {
  readonly getSth: (a: number | null | undefined) => void;
}
`;

const EMPTY_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
}

export interface Spec extends TurboModule {
  readonly getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'EmptyEnumNativeModule',
);
`;

const MIXED_VALUES_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
  NUM = 1,
  STR = 'str',
}

export interface Spec extends TurboModule {
  readonly getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'MixedValuesEnumNativeModule',
);
`;

const NUMERIC_VALUES_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
  NUM = 1,
  NEGATIVE = -1,
  SUBFACTORIAL = !5,
}

export interface Spec extends TurboModule {
  readonly getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>(
  'NumericValuesEnumNativeModule',
);
`;

const MAP_WITH_EXTRA_KEYS_NATIVE_MODULE = `
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

type MapWithKey = {
  [a: string]: string | null,
  extra: string,
}

export interface Spec extends TurboModule {
  readonly getMap: (a: MapWithKey) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MapWithExtraKeysNativeModule');
`;

const NATIVE_MODULES_WITH_ARRAY_BUFFER_IN_OBJECT_PROPERTY = `
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

type Row = {
  buf: ArrayBuffer;
};

export interface Spec extends TurboModule {
  readonly useRow: (row: Row) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_PARAM = `
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
  readonly nested: (v: Array<Array<ArrayBuffer>>) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_OBJECT_PARAM = `
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
  readonly objArg: (v: {buffers: Array<ArrayBuffer>}) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_RETURN = `
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
  readonly getBuffers: () => Array<ArrayBuffer>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_RETURN = `
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
  readonly retNested: () => Array<Array<ArrayBuffer>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_OBJECT_RETURN = `
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
  readonly retObj: () => {buffers: Array<ArrayBuffer>};
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_PROMISE_RETURN = `
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
  readonly getAsyncBuffers: () => Promise<Array<ArrayBuffer>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_PROMISE_OBJECT = `
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
  readonly retPromiseObj: () => Promise<{buffers: Array<ArrayBuffer>}>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NULLABLE_ARRAY_BUFFER_ELEMENT_PARAM = `
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
  readonly nullableElements: (values: Array<ArrayBuffer | null>) => number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_CALLBACK_PARAM = `
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
  readonly withCallback: (cb: (bufs: Array<ArrayBuffer>) => void) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_CALLBACK_RETURN = `
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
  readonly withCallbackReturn: (cb: () => Array<ArrayBuffer>) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_ARRAY_IN_CALLBACK = `
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
  readonly nestedCallback: (
    cb: (x: {buffers: Array<ArrayBuffer>}) => void,
  ) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_EVENT_EMITTER = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type {TurboModule} from 'react-native/Libraries/TurboModule/RCTExport';
import type {EventEmitter} from 'react-native/Libraries/Types/CodegenTypes';
import * as TurboModuleRegistry from 'react-native/Libraries/TurboModule/TurboModuleRegistry';

export interface Spec extends TurboModule {
  readonly onBuffers: EventEmitter<Array<ArrayBuffer>>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

module.exports = {
  NATIVE_MODULES_WITH_UNNAMED_PARAMS,
  NATIVE_MODULES_WITH_PROMISE_WITHOUT_TYPE,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT_AS_PARAM,
  NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT,
  TWO_NATIVE_MODULES_EXPORTED_WITH_DEFAULT,
  NATIVE_MODULES_WITH_NOT_ONLY_METHODS,
  TWO_NATIVE_EXTENDING_TURBO_MODULE,
  EMPTY_ENUM_NATIVE_MODULE,
  MIXED_VALUES_ENUM_NATIVE_MODULE,
  NUMERIC_VALUES_ENUM_NATIVE_MODULE,
  MAP_WITH_EXTRA_KEYS_NATIVE_MODULE,
  NATIVE_MODULES_WITH_ARRAY_BUFFER_IN_OBJECT_PROPERTY,
  NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_PARAM,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_OBJECT_PARAM,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_RETURN,
  NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_RETURN,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_OBJECT_RETURN,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_PROMISE_RETURN,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_PROMISE_OBJECT,
  NATIVE_MODULE_WITH_NULLABLE_ARRAY_BUFFER_ELEMENT_PARAM,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_CALLBACK_PARAM,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_CALLBACK_RETURN,
  NATIVE_MODULE_WITH_NESTED_ARRAY_BUFFER_ARRAY_IN_CALLBACK,
  NATIVE_MODULE_WITH_ARRAY_BUFFER_ARRAY_IN_EVENT_EMITTER,
};
