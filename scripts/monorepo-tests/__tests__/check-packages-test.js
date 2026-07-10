/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {PRIVATE_DIR, REPO_ROOT} from '../../shared/consts';
import {
  getPackages,
  getReactNativePackage,
  getWorkspaceRoot,
} from '../../shared/monorepoUtils';
import path from 'path';
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

  test('published packages must declare required fields', async () => {
    const packages = await getPackages({includeReactNative: true});
    const violations: Array<string> = [];

    for (const name of Object.keys(packages)) {
      const {packageJson} = packages[name];

      if (!packageJson.version) {
        violations.push(`${name}: missing "version"`);
      }
      if (packageJson.license == null || packageJson.license === '') {
        violations.push(`${name}: missing "license"`);
      }
      // "repository" is required for npm's trusted publishing / provenance (OIDC)
      if (
        packageJson.repository?.url == null ||
        packageJson.repository.url === ''
      ) {
        violations.push(`${name}: missing "repository.url"`);
      }
      if (
        packageJson.repository?.directory == null ||
        packageJson.repository.directory === ''
      ) {
        violations.push(`${name}: missing "repository.directory"`);
      }
      if (packageJson.files == null || packageJson.files.length === 0) {
        violations.push(`${name}: missing "files"`);
      }
    }

    expect(violations).toEqual([]);
  });

  test('packages under private/ must set "private": true', async () => {
    const packages = await getPackages({
      includeReactNative: true,
      includePrivate: true,
    });
    const notPrivate = Object.keys(packages)
      .filter(name => packages[name].path.startsWith(PRIVATE_DIR + path.sep))
      .filter(name => packages[name].packageJson.private !== true);

    expect(notPrivate).toEqual([]);
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
