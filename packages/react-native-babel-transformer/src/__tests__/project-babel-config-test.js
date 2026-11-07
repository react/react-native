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
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// A project Babel config with a single plugin that renames `before` to `after`
// - enough to tell whether the transformer used the project's config. Output
// that keeps `const` also shows the default React Native preset was skipped,
// as it should be when the project has its own config.
const PROJECT_BABEL_CONFIG = `module.exports = {
  plugins: [
    () => ({
      visitor: {
        Identifier(path) {
          if (path.node.name === 'before') {
            path.node.name = 'after';
          }
        },
      },
    }),
  ],
};
`;

let projectRoot: string;

// The transformer memoizes its resolved Babel config in a module-level
// closure, so a fresh module instance is required for every project root.
beforeEach(() => {
  jest.resetModules();
  projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'metro-babel-config-'));
});

afterEach(() => {
  fs.rmSync(projectRoot, {force: true, recursive: true});
});

function transformToCode(): string {
  const {transform} = require('../index.js');
  const {ast} = transform({
    filename: path.join(projectRoot, 'App.js'),
    src: 'const before = 1;',
    plugins: [],
    options: {
      dev: true,
      enableBabelRuntime: false,
      enableBabelRCLookup: false,
      globalPrefix: '__metro__',
      hot: false,
      minify: false,
      platform: 'ios',
      publicPath: 'test',
      projectRoot,
    },
  });
  return generate(ast).code;
}

test.each([
  ['.babelrc.js', false],
  ['.babelrc.cjs', true],
  ['babel.config.js', false],
  ['babel.config.cjs', true],
])('uses %s from the project root', (configName, isModulePackage) => {
  // A `.cjs` config is what a `"type": "module"` project has to use, while a
  // `.js` config would be treated as an ES module there and fail to load.
  if (isModulePackage) {
    fs.writeFileSync(
      path.join(projectRoot, 'package.json'),
      JSON.stringify({type: 'module'}),
    );
  }
  fs.writeFileSync(path.join(projectRoot, configName), PROJECT_BABEL_CONFIG);

  expect(transformToCode()).toBe('const after = 1;');
});

test.each([
  ['.babelrc.js', 'babel.config.cjs'],
  ['.babelrc.cjs', 'babel.config.js'],
])('prefers %s over %s', (preferred, other) => {
  fs.writeFileSync(path.join(projectRoot, preferred), PROJECT_BABEL_CONFIG);
  fs.writeFileSync(path.join(projectRoot, other), 'module.exports = {};');

  expect(transformToCode()).toBe('const after = 1;');
});
