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

const {getReactNativePackage} = require('../shared/monorepoUtils');
const {updateHermesVersionsToPrebuilt} = require('./utils/hermes-utils');

async function main() {
  const {packageJson} = await getReactNativePackage();
  const hermesCompilerVersion = packageJson.dependencies?.['hermes-compiler'];

  if (hermesCompilerVersion != null && hermesCompilerVersion !== '0.0.0') {
    console.log(
      `Skipping hermes prebuilt update: hermes-compiler is pinned to ${hermesCompilerVersion}`,
    );
    return;
  }

  await updateHermesVersionsToPrebuilt();
}

if (require.main === module) {
  void main();
}
