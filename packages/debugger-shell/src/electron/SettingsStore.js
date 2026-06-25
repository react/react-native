/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

// $FlowFixMe[unclear-type] We have no Flow types for the Electron API.
const {app} = require('electron') as any;
const fs = require('fs');
const path = require('path');

type Options = Readonly<{
  name?: string,
  defaults?: Object,
}>;

/**
 * A data persistence layer for storing application settings, modelled after
 * [`electron-store`](https://www.npmjs.com/package/electron-store).
 *
 * Values are saved in a `config.json` file in `app.getPath('userData')`.
 *
 * Compatibility:
 * - Maintains API and file format compatibility with `electron-store@8.2.0`.
 * - Supports the Electron main process only.
 */
export default class SettingsStore {
  #defaultValues: Object = {};
  path: string;

  constructor(options: Options = {}) {
    options = {
      name: 'config',
      ...options,
    };
    this.#defaultValues = {
      ...this.#defaultValues,
      ...options.defaults,
    };
    this.path = path.resolve(
      app.getPath('userData'),
      `${options.name ?? 'config'}.json`,
    );
  }

  get(key: string, defaultValue?: any): any {
    const store = this.store;
    return store[key] !== undefined ? store[key] : defaultValue;
  }

  set(key: string, value: any): void {
    const {store} = this;
    if (typeof key === 'object') {
      const object = key;
      for (const [k, v] of Object.entries(object)) {
        store[k] = v;
      }
    } else {
      store[key] = value;
    }
    this.store = store;
  }

  has(key: string): boolean {
    return key in this.store;
  }

  reset(...keys: Array<string>): void {
    for (const key of keys) {
      if (this.#defaultValues[key] != null) {
        this.set(key, this.#defaultValues[key]);
      }
    }
  }

  delete(key: string): void {
    const {store} = this;
    delete store[key];
    this.store = store;
  }

  clear(): void {
    this.store = {};
    for (const key of Object.keys(this.#defaultValues)) {
      this.reset(key);
    }
  }

  get store(): {[string]: unknown} {
    try {
      const data = fs.readFileSync(this.path, 'utf8');
      const deserializedData = this._deserialize(data);
      return {
        ...(deserializedData as any as {[string]: unknown}),
      };
    } catch (error) {
      if (error?.code === 'ENOENT') {
        this._ensureDirectory();
        return {};
      }
      throw error;
    }
  }

  set store(value: unknown): void {
    this._ensureDirectory();
    this._write(value);
  }

  _deserialize = (value: string): unknown => JSON.parse(value);
  _serialize = (value: unknown): string =>
    JSON.stringify(value, undefined, '\t') ?? '';

  _ensureDirectory(): void {
    fs.mkdirSync(path.dirname(this.path), {recursive: true});
  }

  _write(value: unknown): void {
    const data = this._serialize(value);

    fs.writeFileSync(this.path, data, {mode: 0o666});
  }
}
