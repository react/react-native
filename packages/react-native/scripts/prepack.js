/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {
  generateFBReactNativeSpecIOS,
} = require('./codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS');
const fs = require('node:fs');

function main() {
  console.info('[Prepack] Copying README.md');
  fs.copyFileSync('../../README.md', './README.md');
  generateFBReactNativeSpecIOS('.');
}

if (require.main === module) {
  main();
}
