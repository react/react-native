/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import RCTDeviceEventEmitter from '../EventEmitter/RCTDeviceEventEmitter';
import NativeSettingsManager from './NativeSettingsManager';
import invariant from 'invariant';

type SettingsValues = {[string]: unknown, ...};
type SettingsCallback = () => void;
type SettingsType = {
  _settings: ?SettingsValues,
  get<T = unknown>(key: string): ?T,
  set(settings: SettingsValues): void,
  watchKeys(keys: string | Array<string>, callback: SettingsCallback): number,
  clearWatch(watchId: number): void,
  _sendObservations(body: SettingsValues): void,
};
type AssignSettings = (
  target: SettingsValues,
  source: SettingsValues,
) => SettingsValues;

declare function castSetting<T>(value: unknown): T;
function castSetting(value: unknown) {
  return value;
}

const assignSettings: AssignSettings = Object.assign;
const maybeNativeSettingsManager: ?typeof NativeSettingsManager =
  NativeSettingsManager;

const subscriptions: Array<{
  keys: Array<string>,
  callback: ?SettingsCallback,
  ...
}> = [];

/**
 * Wrapper around `NSUserDefaults`, a persistent key-value store available on
 * iOS.
 *
 * @see https://reactnative.dev/docs/settings
 * @platform ios
 */
function get<T = unknown>(this: unknown, key: string): ?T {
  const receiver = castSetting<SettingsType>(this);
  const settings = castSetting<SettingsValues>(receiver._settings);
  return castSetting(settings[key]);
}

function set(this: unknown, settings: SettingsValues): void {
  const receiver = castSetting<SettingsType>(this);
  receiver._settings = assignSettings(
    castSetting<SettingsValues>(receiver._settings),
    settings,
  );
  NativeSettingsManager.setValues(settings);
}

function _sendObservations(this: unknown, body: SettingsValues): void {
  const receiver = castSetting<SettingsType>(this);
  const settings = castSetting<SettingsValues>(receiver._settings);
  Object.keys(body).forEach(key => {
    const newValue = body[key];
    const didChange = settings[key] !== newValue;
    settings[key] = newValue;

    if (didChange) {
      subscriptions.forEach(sub => {
        if (sub.keys.indexOf(key) !== -1 && sub.callback) {
          sub.callback();
        }
      });
    }
  });
}

const Settings: SettingsType = {
  _settings:
    maybeNativeSettingsManager != null
      ? maybeNativeSettingsManager.getConstants().settings
      : maybeNativeSettingsManager,

  /**
   * Get the current value for the given key.
   */
  get,

  /**
   * Set one or more values by merging the provided object into the current
   * settings.
   */
  set,

  /**
   * Subscribe to changes for the specified keys. The callback is invoked
   * whenever a watched key's value changes. Returns a `watchId` that can be
   * passed to `clearWatch` to unsubscribe.
   */
  watchKeys(keys: string | Array<string>, callback: SettingsCallback): number {
    const watchedKeys = typeof keys === 'string' ? [keys] : keys;

    invariant(
      Array.isArray(watchedKeys),
      'keys should be a string or array of strings',
    );

    const sid = subscriptions.length;
    subscriptions.push({keys: watchedKeys, callback});
    return sid;
  },

  /**
   * Unsubscribe a watcher previously registered with `watchKeys`.
   */
  clearWatch(watchId: number) {
    if (watchId < subscriptions.length) {
      subscriptions[watchId] = {keys: [], callback: null};
    }
  },

  _sendObservations,
};

RCTDeviceEventEmitter.addListener(
  'settingsUpdated',
  Settings._sendObservations.bind(Settings),
);

export default Settings;
