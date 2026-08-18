/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const {setVersion} = require('../set-version');
const path = require('node:path');

jest.mock('../../shared/consts', () => ({
  REPO_ROOT: path.join(__dirname, '__fixtures__', 'set-version'),
  PACKAGES_DIR: path.join(__dirname, '__fixtures__', 'set-version', 'packages'),
  REACT_NATIVE_PACKAGE_DIR: path.join(
    __dirname,
    '__fixtures__',
    'set-version',
    'packages',
    'react-native',
  ),
}));

let customWriteFileExpect = null;
const writeFileMock = jest.fn().mockImplementation((filePath, content) => {
  if (customWriteFileExpect != null) {
    customWriteFileExpect(filePath, content);
  }

  const normalizedFilePath = path
    .relative(path.join(__dirname, '__fixtures__'), filePath)
    .split(path.sep)
    .join('/');

  if (!filePath.endsWith('package.json')) {
    // Updated source and build files are already validated in the tests for
    // `set-rn-artifacts-version.js`. We also want to avoid polluting this test's
    // snapshots with \@\generated.
    expect('[omitted]').toMatchSnapshot(normalizedFilePath);
    return;
  }

  expect(content).toMatchSnapshot(normalizedFilePath);
});

describe('setVersion', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  beforeAll(() => {
    jest.mock('node:fs', () => {
      // $FlowFixMe[underconstrained-implicit-instantiation]
      const originalFs = jest.requireActual('node:fs');

      return {
        ...originalFs,
        writeFileSync: writeFileMock,
        promises: {
          ...originalFs.promises,
          writeFile: writeFileMock,
        },
      };
    });
  });

  test('updates monorepo for release-candidate', async () => {
    await setVersion('0.80.0-rc.3');
  });

  test('updates monorepo for stable version', async () => {
    await setVersion('0.80.1');
  });

  test('updates monorepo for nightly', async () => {
    await setVersion('0.81.0-nightly-29282302-abcd1234');
  });

  test('updates monorepo on main after release cut', async () => {
    customWriteFileExpect = (filePath /*: string */, content /*: string */) => {
      const reactNativePath = path.join('react-native', 'package.json');
      if (filePath.endsWith(reactNativePath)) {
        expect(JSON.parse(content).version).toBe('1000.0.0');
      }
      const templatePath = path.join(
        'react-native',
        'template',
        'package.json',
      );
      if (filePath.endsWith(templatePath)) {
        expect(JSON.parse(content).dependencies['react-native']).toBe(
          '1000.0.0',
        );
      }
    };

    await setVersion('0.82.0-main', true);
  });
});
