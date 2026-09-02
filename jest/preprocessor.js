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

/**
 * Jest Transformer for React Native projects using Metro and Babel.
 * This file transforms source code for testing using appropriate Babel configurations.
 */

// Import Babel transform methods
const {
  transformFromAstSync: babelTransformFromAstSync,
  transformSync: babelTransformSync,
} = require('@babel/core');

// Babel generator to generate code from AST
const generate = require('@babel/generator').default;

// Jest helper to create stable cache keys
const createCacheKeyFunction = require('@jest/create-cache-key-function').default;

// Fetch Metro's Babel configuration
const metroBabelRegister = require('metro-babel-register');

// Utility to ensure a value is not null (throws error if null)
const nullthrows = require('nullthrows');

/**
 * Use Meta's internal Babel register if running in Meta monorepo.
 * Otherwise, register local packages manually to support source loading.
 */
if (process.env.FBSOURCE_ENV === '1') {
  // $FlowExpectedError[cannot-resolve-module] - Internal to Meta
  require('@fb-tools/babel-register');
} else {
  // Load and register Babel settings for monorepo from local script
  require('../scripts/shared/babelRegister').registerForMonorepo();
}

// React Native-specific transformer and inline requires plugin
const transformer = require('@react-native/metro-babel-transformer');
const metroTransformPlugins = require('metro-transform-plugins');

/**
 * Regex pattern to detect files that should be handled as Node.js scripts
 * instead of React Native modules.
 */
const nodeFiles = /[\\/]metro(?:-[^/]*)[\\/]/;

// Extract Babel config used for node transforms without registering hooks
const {only: _, ...nodeBabelOptions} = metroBabelRegister.config([]);

/**
 * Babel plugin that defines build-time constants and disables Babel registration
 * inside test environments to avoid conflicts.
 */
const babelPluginPreventBabelRegister = [
  require.resolve('babel-plugin-transform-define'),
  {
    'process.env.BUILD_EXCLUDE_BABEL_REGISTER': true,
  },
];

module.exports = {
  /**
   * Main processor function for Jest
   * Transforms .js files (or .json passthrough) using appropriate Babel logic
   */
  process(src /*: string */, file /*: string */) /*: {code: string, ...} */ {
    // Skip transformation for JSON files
    if (file.endsWith('.json')) {
      return {code: src};
    }

    // Apply node-specific transformation for matching files
    if (nodeFiles.test(file)) {
      return babelTransformSync(src, {
        filename: file,
        sourceType: 'script', // traditional Node.js script mode
        ...nodeBabelOptions,
        plugins: [
          ...(nodeBabelOptions.plugins ?? []),
          babelPluginPreventBabelRegister,
        ],
        ast: false,
      });
    }

    /**
     * Use the React Native Metro transformer to generate AST for other files
     */
    let {ast} = transformer.transform({
      filename: file,
      options: {
        ast: true, // Keep AST for further transformation
        dev: true, // Development mode
        enableBabelRuntime: false,
        experimentalImportSupport: false,
        globalPrefix: '',
        hermesParser: true,
        hot: false,
        inlineRequires: true, // Optimize startup time by inlining requires
        minify: false,
        platform: '',
        projectRoot: '',
        publicPath: '/assets',
        retainLines: true, // Keep original line numbers
        sourceType: 'unambiguous', // Let Babel decide between "script" and "module"
      },
      src,
    });

    /**
     * Run Babel transform on the AST with additional plugins
     */
    const babelTransformResult = babelTransformFromAstSync(ast, src, {
      ast: true,
      retainLines: true,
      plugins: [
        metroTransformPlugins.inlineRequiresPlugin, // Plugin to inline requires
        babelPluginPreventBabelRegister,            // Prevent re-registration
      ],
      sourceType: 'module',
    });

    // Throw error if AST transformation fails
    ast = nullthrows(babelTransformResult.ast);

    /**
     * Generate final JavaScript code from transformed AST
     */
    return generate(
      ast,
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

  /**
   * Generates a cache key used by Jest to speed up tests
   * It ensures the transformer is only rerun when one of the referenced files changes.
   */
  getCacheKey: createCacheKeyFunction([
    __filename,
    require.resolve('@react-native/metro-babel-transformer'),
    require.resolve('@babel/core/package.json'),
  ]),
};
