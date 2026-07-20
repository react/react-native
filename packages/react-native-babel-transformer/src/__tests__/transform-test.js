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

const {transform} = require('../index.js');
const path = require('node:path');

const PROJECT_ROOT = path.sep === '/' ? '/my/project' : 'C:\\my\\project';

it('exposes the correct absolute path to a source file to plugins', () => {
  let visitorFilename;
  let pluginCwd;
  transform({
    filename: 'foo.js',
    src: 'console.log("foo");',
    plugins: [
      (babel, opts, cwd) => {
        pluginCwd = cwd;
        return {
          visitor: {
            CallExpression: {
              enter: (_, state) => {
                visitorFilename = state.filename;
              },
            },
          },
        };
      },
    ],
    options: {
      dev: true,
      enableBabelRuntime: false,
      enableBabelRCLookup: false,
      globalPrefix: '__metro__',
      hot: false,
      // $FlowFixMe[incompatible-type] TODO: Remove when `inlineRequires` has been removed from metro-babel-transformer in OSS
      inlineRequires: true,
      minify: false,
      platform: null,
      publicPath: 'test',
      projectRoot: PROJECT_ROOT,
    },
  });
  expect(pluginCwd).toEqual(PROJECT_ROOT);
  expect(visitorFilename).toEqual(path.resolve(PROJECT_ROOT, 'foo.js'));
});
