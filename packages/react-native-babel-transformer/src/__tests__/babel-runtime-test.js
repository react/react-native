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

const generate = require('@babel/generator').default;
const path = require('node:path');

const PROJECT_ROOT = path.sep === '/' ? '/my/project' : 'C:\\my\\project';
const PROJECT_BABEL_CONFIG = path.join(
  __dirname,
  '__fixtures__',
  'babel.config.js',
);
// `import * as` uses the `interopRequireWildcard` helper, which
// `@babel/plugin-transform-runtime` imports only when told a `@babel/runtime`
// version of at least 7.14.0, and inlines otherwise.
const SRC = "import * as foo from './foo';\nexport const bar = foo;";

// The transformer memoizes its resolved Babel config in a module-level
// closure, so a fresh module instance is required for every distinct config.
beforeEach(() => {
  jest.resetModules();
});

const METRO_BABEL_RUNTIME = {
  babelRuntimeModuleName: 'metro:babel-runtime',
  babelRuntimeVersion: '7.29.0',
};

function transformToCode({
  babelRuntime,
  extendsBabelConfigPath,
}: {
  babelRuntime: ?Readonly<{
    babelRuntimeModuleName?: string,
    babelRuntimeVersion?: string,
  }>,
  extendsBabelConfigPath?: string,
}): string {
  const {transform} = require('../index.js');
  const {ast} = transform({
    filename: path.join(PROJECT_ROOT, 'App.js'),
    src: SRC,
    plugins: [],
    options: {
      ...babelRuntime,
      dev: true,
      enableBabelRuntime: true,
      enableBabelRCLookup: false,
      experimentalImportSupport: false,
      extendsBabelConfigPath,
      globalPrefix: '__metro__',
      hot: false,
      minify: false,
      platform: 'ios',
      publicPath: 'test',
      projectRoot: PROJECT_ROOT,
    },
  });
  return generate(ast).code;
}

describe.each([
  ['no project Babel config', undefined],
  ['a project Babel config naming the preset', PROJECT_BABEL_CONFIG],
])('with %s', (_name, extendsBabelConfigPath) => {
  test("imports helpers from Metro's own @babel/runtime when Metro passes it", () => {
    const code = transformToCode({
      extendsBabelConfigPath,
      babelRuntime: METRO_BABEL_RUNTIME,
    });

    expect(code).toContain(
      'require("metro:babel-runtime/helpers/interopRequireWildcard")',
    );
    expect(code).not.toContain('function _interopRequireWildcard(');
  });

  test('inlines newer helpers when Metro passes no @babel/runtime', () => {
    const code = transformToCode({
      extendsBabelConfigPath,
      babelRuntime: null,
    });

    expect(code).not.toContain('metro:babel-runtime');
    expect(code).toContain('function _interopRequireWildcard(');
  });

  test('ignores a @babel/runtime version without a module name', () => {
    const code = transformToCode({
      babelRuntime: {babelRuntimeVersion: '7.29.0'},
      extendsBabelConfigPath,
    });

    expect(code).toContain('function _interopRequireWildcard(');
  });
});
