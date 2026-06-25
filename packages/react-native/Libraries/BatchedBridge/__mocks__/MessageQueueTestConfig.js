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

import type {ModuleConfig} from '../NativeModules';

const remoteModulesConfig: ReadonlyArray<ModuleConfig> = [
  [
    'RemoteModule1',
    null,
    ['remoteMethod', 'promiseMethod', 'promiseReturningMethod', 'syncMethod'],
    [2 /* promiseReturningMethod */],
    [3 /* syncMethod */],
  ],
  [
    'RemoteModule2',
    null,
    ['remoteMethod', 'promiseMethod', 'promiseReturningMethod', 'syncMethod'],
    [2 /* promiseReturningMethod */],
    [3 /* syncMethod */],
  ],
];

const MessageQueueTestConfig = {
  remoteModuleConfig: remoteModulesConfig,
};

// eslint-disable-next-line @react-native/monorepo/no-commonjs-exports
module.exports = MessageQueueTestConfig;
