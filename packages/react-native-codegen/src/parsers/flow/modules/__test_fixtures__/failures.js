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

const NATIVE_MODULES_WITH_ARRAY_WITH_NO_TYPE_FOR_CONTENT = `
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  getString: (arg : Array) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

const NATIVE_MODULES_WITH_READ_ONLY_OBJECT_NO_TYPE_FOR_CONTENT = `
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
  getString: (arg : $ReadOnly<>) => string;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getBool: (arg: boolean) => boolean;
  +getNumber: (arg: number) => number;
  +getString: (arg: string) => string;
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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getBool: (boolean) => boolean;

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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getBool: (arg: boolean) => Promise;

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
 * @flow strict-local
 * @format
 */

'use strict';

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
 * @flow strict-local
 * @format
 */

'use strict';

import type {TurboModule} from '../RCTExport';
import * as TurboModuleRegistry from '../TurboModuleRegistry';

export interface Spec extends TurboModule {
  +getSth: (a : ?number) => void
}

export interface Spec2 extends TurboModule {
  +getSth: (a : ?number) => void
}


`;

const EMPTY_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
}

export interface Spec extends TurboModule {
  +getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('EmptyEnumNativeModule');
`;

const MIXED_VALUES_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
  NUM = 1,
  STR = 'str',
}

export interface Spec extends TurboModule {
  +getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MixedValuesEnumNativeModule');
`;

const NUMERIC_VALUES_ENUM_NATIVE_MODULE = `
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

export enum SomeEnum {
  NUM = 1,
  NEGATIVE = -1,
  SUBFACTORIAL = !5,
}

export interface Spec extends TurboModule {
  +getEnums: (a: SomeEnum) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('NumericValuesEnumNativeModule');
`;

const MAP_WITH_EXTRA_KEYS_NATIVE_MODULE = `
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

type MapWithKey = {
  [a: string]: ?string,
  extra: string,
}

export interface Spec extends TurboModule {
  +getMap: (a: MapWithKey) => string;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MixedValuesEnumNativeModule');
`;

const NATIVE_MODULES_WITH_ARRAY_BUFFER_IN_OBJECT_PROPERTY = `
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

type Row = {
  buf: ArrayBuffer,
};

export interface Spec extends TurboModule {
  +useRow: (row: Row) => void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SampleTurboModule');

`;

module.exports = {
  NATIVE_MODULES_WITH_READ_ONLY_OBJECT_NO_TYPE_FOR_CONTENT,
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
};
