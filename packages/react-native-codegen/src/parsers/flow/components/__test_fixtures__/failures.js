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

const COMMANDS_DEFINED_INLINE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props
|}>;

export const Commands = codegenNativeCommands<{
  +hotspotUpdate: (ref: React.RefSetter<'RCTView'>, x: Int32, y: Int32) => void,
}>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_MULTIPLE_TIMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.RefSetter<'RCTView'>, x: Int32, y: Int32) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});
export const Commands2 = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITHOUT_REF = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  +hotspotUpdate: (x: Int32, y: Int32) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_NULLABLE_REF = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  +hotspotUpdate: (viewRef: ?React.RefSetter<'RCTView'>, x: Int32, y: Int32) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['hotspotUpdate'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITH_MISMATCHED_METHOD_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.RefSetter<'RCTView'>, x: Int32, y: Int32) => void;
  +scrollTo: (
    viewRef: React.RefSetter<'RCTView'>,
    y: Int32,
    animated: boolean,
  ) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>({
  supportedCommands: ['scrollTo'],
});

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const COMMANDS_DEFINED_WITHOUT_METHOD_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeCommands = require('codegenNativeCommands');
const codegenNativeComponent = require('codegenNativeComponent');

import type {Int32} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

interface NativeCommands {
  +hotspotUpdate: (viewRef: React.RefSetter<'RCTView'>, x: Int32, y: Int32) => void;
  +scrollTo: (
    viewRef: React.RefSetter<'RCTView'>,
    y: Int32,
    animated: boolean,
  ) => void;
}

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  // No props or events
|}>;

export const Commands = codegenNativeCommands<NativeCommands>();

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NULLABLE_WITH_DEFAULT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {WithDefault, Float} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  nullable_with_default: ?WithDefault<Float, 1.0>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

const codegenNativeComponent = require('codegenNativeComponent');

import type {WithDefault, Float} from 'CodegenTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  required_key_with_default: WithDefault<Float, 1.0>,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_CONFLICT_NAMES = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,
  isEnabled: string,

  isEnabled: boolean,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_CONFLICT_WITH_SPREAD_PROPS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

type PropsInFile = $ReadOnly<{|
  isEnabled: boolean,
|}>;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  ...PropsInFile,
  isEnabled: boolean,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROPS_SPREAD_CONFLICTS_WITH_PROPS = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

type PropsInFile = $ReadOnly<{|
  isEnabled: boolean,
|}>;

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  isEnabled: boolean,
  ...PropsInFile,
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_NUMBER_TYPE = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp: number
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_MIXED_ENUM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp?: WithDefault<'foo' | 1, 1>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ENUM_BOOLEAN = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp?: WithDefault<false | true, false>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_MIXED_ENUM = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp?: WithDefault<$ReadOnlyArray<'foo' | 1>, 1>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_ENUM_BOOLEAN = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp?: WithDefault<$ReadOnlyArray<false | true>, false>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

const PROP_ARRAY_ENUM_INT = `
/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {ViewProps} from 'ViewPropTypes';
import type {HostComponent} from 'react-native';

const codegenNativeComponent = require('codegenNativeComponent');

export type ModuleProps = $ReadOnly<{|
  ...ViewProps,

  someProp?: WithDefault<$ReadOnlyArray<0 | 1>, 0>
|}>;

export default codegenNativeComponent<ModuleProps>(
  'Module',
) as HostComponent<ModuleProps>;
`;

module.exports = {
  COMMANDS_DEFINED_INLINE,
  COMMANDS_DEFINED_MULTIPLE_TIMES,
  COMMANDS_DEFINED_WITH_MISMATCHED_METHOD_NAMES,
  COMMANDS_DEFINED_WITHOUT_METHOD_NAMES,
  COMMANDS_DEFINED_WITHOUT_REF,
  COMMANDS_DEFINED_WITH_NULLABLE_REF,
  NULLABLE_WITH_DEFAULT,
  NON_OPTIONAL_KEY_WITH_DEFAULT_VALUE,
  PROPS_CONFLICT_NAMES,
  PROPS_CONFLICT_WITH_SPREAD_PROPS,
  PROPS_SPREAD_CONFLICTS_WITH_PROPS,
  PROP_NUMBER_TYPE,
  PROP_MIXED_ENUM,
  PROP_ENUM_BOOLEAN,
  PROP_ARRAY_MIXED_ENUM,
  PROP_ARRAY_ENUM_BOOLEAN,
  PROP_ARRAY_ENUM_INT,
};
