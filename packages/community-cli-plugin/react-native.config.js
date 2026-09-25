/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {
  bundleCommand,
  codegenCommand,
  spmCommand,
  startCommand,
} = require('@react-native/community-cli-plugin');

module.exports = {
  commands: [bundleCommand, startCommand, spmCommand, codegenCommand],
};
