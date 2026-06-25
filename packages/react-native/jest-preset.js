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

try {
  module.exports = require('@react-native/jest-preset');
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND') {
    throw new Error(
      `The React Native Jest preset has moved to a separate package.
To migrate, please install "@react-native/jest-preset" and update your
jest.config.js to reference:
  preset: '@react-native/jest-preset'`,
    );
  } else {
    throw error;
  }
}
