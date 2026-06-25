/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// @flow
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

function main() {
 const packageJsonPath = path.join(__dirname, '../packages/react-native/package.json');
 const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
 const hermesCompilerVersion = packageJson.dependencies['hermes-compiler'];

 if (hermesCompilerVersion === '0.0.0') {
   console.log(`Hermes compiler version not set. Updating to the latest-v1 release.`);
   execSync('yarn workspace react-native add hermes-compiler@latest-v1 --exact', { stdio: 'inherit' });
 } else {
   console.log(`Hermes compiler version set to ${hermesCompilerVersion}. Not setting hermes.`);
 }
}

main();
