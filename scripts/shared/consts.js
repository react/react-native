/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const path = require('path');

/**
 * The absolute path to the repo root.
 */
const REPO_ROOT /*: string */ = path.resolve(__dirname, '../..');

/**
 * The absolute path to the packages directory (note: this directory alone may
 * not match the "workspaces" config in package.json).
 */
const PACKAGES_DIR /*: string */ = path.join(REPO_ROOT, 'packages');

/**
 * The absolute path to the repo private directory.
 */
const PRIVATE_DIR /*: string */ = path.join(REPO_ROOT, 'private');

/**
 * The absolute path to the repo scripts directory.
 */
const SCRIPTS_DIR /*: string */ = path.join(REPO_ROOT, 'scripts');

/**
 * The absolute path to the react-native package.
 */
const REACT_NATIVE_PACKAGE_DIR /*: string */ = path.join(
  REPO_ROOT,
  'packages',
  'react-native',
);

/**
 * The absolute path to the rn-tester package.
 */
const RN_TESTER_DIR /*: string */ = path.join(
  REPO_ROOT,
  'packages',
  'rn-tester',
);

module.exports = {
  PACKAGES_DIR,
  PRIVATE_DIR,
  REACT_NATIVE_PACKAGE_DIR,
  REPO_ROOT,
  RN_TESTER_DIR,
  SCRIPTS_DIR,
};
