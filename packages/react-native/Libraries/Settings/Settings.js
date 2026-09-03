/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from '../Utilities/Platform';

let Settings: {
  // $FlowFixMe[unclear-type]
  get(key: string): any,
  // $FlowFixMe[unclear-type]
  set(settings: Object): void,
  watchKeys(keys: string | Array<string>, callback: () => void): number,
  clearWatch(watchId: number): void,
  ...
};

if (Platform.OS === 'ios') {
  Settings = require('./Settings').default;
} else {
  Settings = require('./SettingsFallback').default;
}

export default Settings;
