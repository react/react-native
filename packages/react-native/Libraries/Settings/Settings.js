/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

type SettingsStatic = {
  get(key: string): any,
  set(settings: Object): void,
  watchKeys(keys: string | Array<string>, callback: () => void): number,
  clearWatch(watchId: number): void,
  ...
};

let SettingsImpl: ?SettingsStatic = null;

function getSettings(): SettingsStatic {
  if (SettingsImpl != null) {
    return SettingsImpl;
  }
  const Platform = require('../Utilities/Platform').default;
  if (Platform.OS === 'ios') {
    SettingsImpl = require('./Settings').default;
  } else {
    SettingsImpl = require('./SettingsFallback').default;
  }
  return (SettingsImpl: SettingsStatic);
}

const Settings: SettingsStatic = {
  get(key: string): any {
    return getSettings().get(key);
  },

  set(settings: Object): void {
    getSettings().set(settings);
  },

  watchKeys(keys: string | Array<string>, callback: () => void): number {
    return getSettings().watchKeys(keys, callback);
  },

  clearWatch(watchId: number): void {
    getSettings().clearWatch(watchId);
  },
};

export default Settings;
