/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

type SettingsStatic = {
  get<T = unknown>(key: string): ?T,
  set(settings: {[string]: unknown, ...}): void,
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
  return SettingsImpl as SettingsStatic;
}

const Settings: SettingsStatic = {
  get<T = unknown>(key: string): ?T {
    return getSettings().get<T>(key);
  },

  set(settings: {[string]: unknown, ...}): void {
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
