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

// $FlowExpectedError[untyped-import] - Preset is untyped
const preset = require('../index');
const babel = require('@babel/core');

const MOCK_FILENAME = '/absolute/path/to/input.js';

function transformWithCaller(
  code: string,
  options: {[string]: unknown},
  caller: {
    enableBabelRuntime?: boolean | string,
    babelRuntimeModuleName?: string,
  },
): string | null {
  const result = babel.transformSync(code, {
    babelrc: false,
    configFile: false,
    filename: MOCK_FILENAME,
    presets: [[preset, options]],
    caller: {...caller, name: 'test'},
    sourceMaps: false,
    compact: false,
  });
  return result?.code ?? null;
}

describe('babel runtime caller options', () => {
  it('uses caller-provided babelRuntimeModuleName for runtime helpers', () => {
    const code = 'const {a, ...rest} = obj;';
    const result = transformWithCaller(
      code,
      {dev: false},
      {babelRuntimeModuleName: '@react-native/babel-runtime'},
    );
    expect(result).toContain(
      '@react-native/babel-runtime/helpers/objectWithoutProperties',
    );
    expect(result).not.toContain('@babel/runtime/helpers');
  });

  it('options babelRuntimeModuleName takes precedence over caller', () => {
    const code = 'const {a, ...rest} = obj;';
    const result = transformWithCaller(
      code,
      {dev: false, babelRuntimeModuleName: '@from/options'},
      {babelRuntimeModuleName: '@from/caller'},
    );
    expect(result).toContain('@from/options/helpers/objectWithoutProperties');
    expect(result).not.toContain('@from/caller');
  });

  it('uses caller-provided enableBabelRuntime version to select the helper interop', () => {
    // A default import triggers the `interopRequireDefault` helper, whose import
    // form depends on the runtime version. Modern versions append `.default`.
    const code = "import foo from './foo';\nfoo();";
    const result = transformWithCaller(
      code,
      {dev: false},
      {enableBabelRuntime: '7.25.0'},
    );
    expect(result).toContain(
      'require("@babel/runtime/helpers/interopRequireDefault").default',
    );
  });

  it('options enableBabelRuntime takes precedence over caller', () => {
    const code = "import foo from './foo';\nfoo();";
    const result = transformWithCaller(
      code,
      {dev: false, enableBabelRuntime: '7.0.0'},
      {enableBabelRuntime: '7.25.0'},
    );
    // Options version (7.0.0) uses the legacy interop form without `.default`,
    // overriding the caller version (7.25.0) that would produce `.default`.
    expect(result).toContain(
      'require("@babel/runtime/helpers/interopRequireDefault")',
    );
    expect(result).not.toContain(
      'require("@babel/runtime/helpers/interopRequireDefault").default',
    );
  });

  it('has no effect when caller options are absent', () => {
    const code = "import foo from './foo';\nfoo();";
    const result = transformWithCaller(code, {dev: false}, {});
    // Default runtime version uses the legacy interop form (no `.default`).
    expect(result).toContain(
      'require("@babel/runtime/helpers/interopRequireDefault")',
    );
    expect(result).not.toContain(
      'require("@babel/runtime/helpers/interopRequireDefault").default',
    );
  });

  it('does not add the runtime plugin when caller disables enableBabelRuntime', () => {
    const code = 'const {a, ...rest} = obj;';
    const result = transformWithCaller(
      code,
      {dev: false},
      {
        enableBabelRuntime: false,
        babelRuntimeModuleName: '@react-native/babel-runtime',
      },
    );
    expect(result).not.toContain('@react-native/babel-runtime');
    expect(result).not.toContain('@babel/runtime/helpers');
  });

  it('options enableBabelRuntime false takes precedence over caller true', () => {
    const code = 'const {a, ...rest} = obj;';
    const result = transformWithCaller(
      code,
      {dev: false, enableBabelRuntime: false},
      {enableBabelRuntime: '7.25.0'},
    );
    expect(result).not.toContain('@babel/runtime/helpers');
  });
});
