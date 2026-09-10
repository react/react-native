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
const SRC = "import foo from './foo';\nexport const bar = foo;";

// The transformer memoizes its resolved Babel config in a module-level
// closure, so a fresh module instance is required for every distinct config.
beforeEach(() => {
  jest.resetModules();
});

function transformToCode({
  experimentalImportSupport,
  extendsBabelConfigPath,
}: {
  experimentalImportSupport: boolean,
  extendsBabelConfigPath?: string,
}): string {
  const {transform} = require('../index.js');
  const {ast} = transform({
    filename: path.join(PROJECT_ROOT, 'App.js'),
    src: SRC,
    plugins: [],
    options: {
      dev: true,
      enableBabelRuntime: false,
      enableBabelRCLookup: false,
      experimentalImportSupport,
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

function isLowered(code: string): boolean {
  return code.includes('require(') && !/^import\b/m.test(code);
}

describe.each([
  ['no project Babel config', undefined],
  ['a project Babel config naming the preset', PROJECT_BABEL_CONFIG],
])('with %s', (_name, extendsBabelConfigPath) => {
  test('lowers import/export when experimentalImportSupport is off', () => {
    const code = transformToCode({
      experimentalImportSupport: false,
      extendsBabelConfigPath,
    });

    expect(isLowered(code)).toBe(true);
  });

  test('keeps import/export when experimentalImportSupport is on', () => {
    // Metro lowers ESM itself in this mode. If the preset lowered it first,
    // Metro's plugin would find nothing to do and the option would be a no-op.
    const code = transformToCode({
      experimentalImportSupport: true,
      extendsBabelConfigPath,
    });

    expect(isLowered(code)).toBe(false);
    expect(code).toContain("import foo from './foo'");
  });
});
