/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {transformSync} from '@babel/core';

const code = transformSync(
  fs.readFileSync(path.join(__dirname, '..', 'setup.js'), 'utf8'),
  {
    filename: 'setup.js',
    configFile: false,
    babelrc: false,
    plugins: [
      require.resolve('@babel/plugin-transform-flow-strip-types'),
      require.resolve('@babel/plugin-transform-modules-commonjs'),
    ],
  },
).code;

function runSetup(globals: {[string]: mixed}): void {
  // Execute the actual preset source and real property-descriptor operations.
  // Native module registrations are outside the globals contract tested here.
  vm.runInNewContext(code, {
    global: globals,
    Date,
    setTimeout,
    clearTimeout,
    exports: {},
    module: {exports: {}},
    require(name) {
      if (name === './mock') {
        return {__esModule: true, default() {}};
      }
      if (name === '@react-native/js-polyfills/error-guard') {
        return {};
      }
      throw new Error(`Unexpected setup import: ${name}`);
    },
    jest: {
      fn: implementation => implementation,
      now: () => Date.now(),
      requireActual: () => ({}),
      mock() {},
    },
  });
}

test.each(['absent', 'configurable', 'immutable-accessor', 'immutable-data'])(
  'initializes globals with a %s window binding',
  kind => {
    const globals = {};
    const hostWindow = {};
    if (kind === 'configurable') {
      Object.defineProperty(globals, 'window', {
        configurable: true,
        value: hostWindow,
      });
    } else if (kind === 'immutable-accessor') {
      Object.defineProperty(globals, 'window', {
        configurable: false,
        get: () => hostWindow,
      });
    } else if (kind === 'immutable-data') {
      Object.defineProperty(globals, 'window', {
        configurable: false,
        value: hostWindow,
      });
    }
    const before = Object.getOwnPropertyDescriptor(globals, 'window');
    expect(() => runSetup(globals)).not.toThrow();
    expect(globals.__DEV__).toBe(true);
    expect(typeof globals.requestAnimationFrame).toBe('function');
    if (before?.configurable === false) {
      expect(globals.window).toBe(hostWindow);
      expect(Object.getOwnPropertyDescriptor(globals, 'window')).toEqual(before);
    } else {
      expect(globals.window).toBe(globals);
      expect(Object.getOwnPropertyDescriptor(globals, 'window')?.writable).toBe(
        true,
      );
    }
  },
);
