/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

/* eslint-env node */

const createCacheKeyFunction =
  require('@jest/create-cache-key-function').default;
const path = require('path');

// NOTE: This file used to be at `react-native/jest/assetFileTransformer.js`
// To keep the mock `testUri` paths the same, we create a fake path that outputs the same relative path as before
const basePath = path.resolve(
  require.resolve('react-native/package.json'),
  '../jest/',
);

module.exports = {
  // Mocks asset requires to return the filename. Makes it possible to test that
  // the correct images are loaded for components. Essentially
  // require('img1.png') becomes `Object { "testUri": 'path/to/img1.png' }` in
  // the Jest snapshot.
  process: (_, filename) => ({
    code: `module.exports = {
      testUri:
        ${JSON.stringify(path.relative(basePath, filename).replace(/\\/g, '/'))}
    };`,
  }),
  getCacheKey: createCacheKeyFunction([__filename]),
};
