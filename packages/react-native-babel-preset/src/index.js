/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {version: packageVersion} = require('../package.json');
const main = require('./configs/main');

module.exports = function (babel, options) {
  return main(options, babel);
};

let cacheKey;
module.exports.getCacheKey = () => {
  if (cacheKey != null) {
    // Memoize
    return cacheKey;
  }
  if (!packageVersion.endsWith('-main')) {
    // Assume the integrity of package contents for published npm releases.
    cacheKey = packageVersion;
    return cacheKey;
  }
  // For anyone working with a `-main` version, contents may vary over time
  // even though the version does not. Hash the relevant contents of this
  // package. Lazy-load dependencies we only need on this slow path.
  const {createHash} = require('crypto');
  const {readFileSync} = require('fs');
  const key = createHash('md5');
  [
    readFileSync(__filename),
    readFileSync(require.resolve('./configs/main.js')),
    readFileSync(require.resolve('./configs/hmr.js')),
    readFileSync(require.resolve('./configs/lazy-imports.js')),
    readFileSync(require.resolve('./passthrough-syntax-plugins.js')),
    readFileSync(require.resolve('./plugin-warn-on-deep-imports.js')),
  ].forEach(part => key.update(part));
  cacheKey = key.digest('hex');
  return cacheKey;
};

module.exports.getPreset = main.getPreset;
module.exports.passthroughSyntaxPlugins = require('./passthrough-syntax-plugins');
