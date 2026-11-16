/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/* eslint-env node */

'use strict';

// eslint-disable-next-line @react-native/monorepo/sort-imports
const {
  transformFromAstSync: babelTransformFromAstSync,
  transformSync: babelTransformSync,
} = require('@babel/core');
const generate = require('@babel/generator').default;
const createCacheKeyFunction =
  require('@jest/create-cache-key-function').default;
const metroBabelRegister = require('metro-babel-register');
const nullthrows = require('nullthrows');

if (process.env.FBSOURCE_ENV === '1') {
  // If we're running in the Meta-internal monorepo, use the central Babel
  // registration, which registers all of the relevant source directories
  // including Metro's root.
  //
  // $FlowExpectedError[cannot-resolve-module] - Won't resolve in OSS
  require('@fb-tools/babel-register');
} else {
  // Register Babel to allow local packages to be loaded from source
  require('../scripts/shared/babelRegister').registerForMonorepo();
}

const transformer = require('@react-native/metro-babel-transformer');
const metroTransformPlugins = require('metro-transform-plugins');

// Files matching this pattern will be transformed with the Node JS Babel
// transformer, rather than with the React Native Babel transformer. Scripts
// intended to run through Node JS should be included here.
const nodeFiles = /[\\/]metro(?:-[^/]*)[\\/]/;

// Get Babel config from metro-babel-register, without registering a require
// hook. This is used below to configure babelTransformSync under Jest.
const {only: _, ...nodeBabelOptions} = metroBabelRegister.config([]);

// Set BUILD_EXCLUDE_BABEL_REGISTER (see ../scripts/build/babel-register.js) to
// prevent inline Babel registration in code under test, normally required when
// running from source, but not in combination with the Jest transformer.
const babelPluginPreventBabelRegister = [
  require.resolve('babel-plugin-transform-define'),
  {
    'process.env.BUILD_EXCLUDE_BABEL_REGISTER': true,
  },
];

module.exports = {
  process(src /*: string */, file /*: string */) /*: {code: string, ...} */ {
    if (file.endsWith('.json')) {
      return {code: src};
    }
    if (nodeFiles.test(file)) {
      // node specific transforms only
      return babelTransformSync(src, {
        filename: file,
        sourceType: 'unambiguous',
        ...nodeBabelOptions,
        plugins: [
          ...(nodeBabelOptions.plugins ?? []),
          babelPluginPreventBabelRegister,
        ],
        ast: false,
      });
    }

    let {ast} = transformer.transform({
      filename: file,
      options: {
        ast: true, // needed for open source (?) https://github.com/facebook/react-native/commit/f8d6b97140cffe8d18b2558f94570c8d1b410d5c#r28647044
        dev: true,
        enableBabelRuntime: false,
        experimentalImportSupport: false,
        globalPrefix: '',
        hermesParser: true,
        hot: false,
        // $FlowFixMe[incompatible-type] TODO: Remove when `inlineRequires` has been removed from metro-babel-transformer in OSS
        inlineRequires: true,
        minify: false,
        platform: '',
        projectRoot: '',
        publicPath: '/assets',
        retainLines: true,
        sourceType: 'unambiguous', // b7 required. detects module vs script mode
      },
      src,
    });

    const babelTransformResult = babelTransformFromAstSync(ast, src, {
      ast: true,
      retainLines: true,
      plugins: [
        metroTransformPlugins.inlineRequiresPlugin,
        babelPluginPreventBabelRegister,
      ],
      sourceType: 'module',
    });
    ast = nullthrows(babelTransformResult.ast);

    return generate(
      ast,
      // $FlowFixMe[incompatible-type] Error found when improving flow typing for libs
      {
        code: true,
        comments: false,
        compact: false,
        filename: file,
        retainLines: true,
        sourceFileName: file,
        sourceMaps: true,
      },
      src,
    );
  },

  // $FlowFixMe[signature-verification-failure]
  getCacheKey: createCacheKeyFunction([
    __filename,
    require.resolve('@react-native/metro-babel-transformer'),
    require.resolve('@babel/core/package.json'),
  ]),
};
