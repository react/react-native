/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {
  PRIVATE_DIR,
  REACT_NATIVE_PACKAGE_DIR,
  REPO_ROOT,
} from '../../shared/consts';
import {
  getPackages,
  getReactNativePackage,
  getWorkspaceRoot,
} from '../../shared/monorepoUtils';
import fs from 'node:fs/promises';
import path from 'node:path';
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

  test('the react-native peer for react must exactly match the synced renderer version', async () => {
    const {packageJson: rnPackageJson} = await getReactNativePackage();
    const reactPeer = rnPackageJson.peerDependencies?.react;
    expect(typeof reactPeer).toBe('string');

    // The embedded renderer only supports the exact React version it was
    // synced with (see #57079: a caret range lets package managers install a
    // React that the renderer rejects at runtime), so the peer must be
    // pinned to that exact version instead of a range.
    expect(reactPeer).toMatch(/^\d+\.\d+\.\d+$/);

    // The development pin in the workspace root must agree with the peer...
    const {packageJson: rootPackageJson} = await getWorkspaceRoot();
    expect(rootPackageJson.devDependencies?.react).toBe(reactPeer);

    // ...as must the version embedded in the synced renderer bundle.
    const rendererDev = await fs.readFile(
      path.join(
        REACT_NATIVE_PACKAGE_DIR,
        'Libraries/Renderer/implementations/ReactFabric-dev.js',
      ),
      'utf-8',
    );
    const embeddedVersions = rendererDev.match(/version: "(\d+\.\d+\.\d+)"/g);
    expect(embeddedVersions).toHaveLength(1);
    expect(embeddedVersions?.[0]).toBe(`version: "${reactPeer}"`);
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
