/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

const crypto = require('node:crypto');
const fs = require('node:fs');

module.exports = {
  getHasteName(filePath /*: string */) /*: ?string */ {
    if (filePath.endsWith('ReactNativeInternalFeatureFlags.js')) {
      return 'ReactNativeInternalFeatureFlags';
    }

    return null;
  },

  getCacheKey() /*: string */ {
    return crypto
      .createHash('sha1')
      .update(fs.readFileSync(__filename))
      .digest('hex');
  },
};
