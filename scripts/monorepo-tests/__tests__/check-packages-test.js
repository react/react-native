/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {REPO_ROOT} from '../../shared/consts';
import {
  getReactNativePackage,
  getWorkspaceRoot,
} from '../../shared/monorepoUtils';
import {globSync} from 'tinyglobby';

describe('package manifests', () => {
  test('the workspace root must not declare runtime dependencies', async () => {
    const {packageJson} = await getWorkspaceRoot();
    expect(packageJson).not.toHaveProperty('dependencies');
  });

  test('the react-native package must not declare devDependencies', async () => {
    const {packageJson} = await getReactNativePackage();
    expect(packageJson).not.toHaveProperty('devDependencies');
  });
});

describe('package file structure', () => {
  test('packages must not contain .npmignore files', () => {
    // Publishing must be controlled via the package.json "files" field, which is
    // easier to audit and does not silently expand what gets shipped to npm.
    const npmignoreFiles = globSync('{packages,private}/**/.npmignore', {
      cwd: REPO_ROOT,
      dot: true,
      ignore: ['**/node_modules/**'],
    });

    expect(npmignoreFiles).toEqual([]);
  });
});
