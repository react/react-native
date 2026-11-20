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

const path = require('node:path');

const PROJECT_ROOT = path.sep === '/' ? '/my/project' : 'C:\\my\\project';

// The transformer memoizes its resolved Babel config in a module-level
// closure, so a fresh module instance is required for every distinct config.
beforeEach(() => {
  jest.resetModules();
});

function getCallerSupportsInlineModules(
  supportsInlineModules: ?boolean,
): unknown {
  const {transform} = require('../index.js');
  let callerValue: unknown = null;
  transform({
    filename: path.join(PROJECT_ROOT, 'App.js'),
    src: 'export const foo = 1;',
    plugins: [
      api => {
        callerValue = api.caller(caller => caller?.supportsInlineModules);
        return {visitor: {}};
      },
    ],
    options: {
      ...(supportsInlineModules != null ? {supportsInlineModules} : null),
      dev: true,
      enableBabelRuntime: false,
      enableBabelRCLookup: false,
      globalPrefix: '__metro__',
      minify: false,
      platform: 'ios',
      publicPath: 'test',
      projectRoot: PROJECT_ROOT,
    },
  });
  return callerValue;
}

test.each([[true], [false], [undefined]])(
  'passes supportsInlineModules: %s to Babel through the caller',
  supportsInlineModules => {
    expect(getCallerSupportsInlineModules(supportsInlineModules)).toBe(
      supportsInlineModules,
    );
  },
);
