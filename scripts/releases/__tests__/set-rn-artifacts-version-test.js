/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const readFileMock = jest.fn();
const writeFileMock = jest.fn();

jest.mock('node:fs', () => ({
  ...jest.requireActual<$FlowFixMe>('node:fs'),
  promises: {
    ...jest.requireActual<$FlowFixMe>('node:fs').promises,
    readFile: readFileMock,
    writeFile: writeFileMock,
  },
}));

const {REPO_ROOT} = require('../../shared/consts');
const {updateReactNativeArtifacts} = require('../set-rn-artifacts-version');
const path = require('node:path');

describe('updateReactNativeArtifacts', () => {
  beforeAll(() => {
    readFileMock.mockImplementation(filePath => {
      if (
        filePath ===
        path.join(
          REPO_ROOT,
          'packages/react-native/ReactAndroid/gradle.properties',
        )
      ) {
        return 'VERSION_NAME=1000.0.0\n';
      }

      if (
        filePath ===
        path.join(
          REPO_ROOT,
          'packages/react-native/scripts/codegen/__tests__/__snapshots__/generate-artifacts-executor-test.js.snap',
        )
      ) {
        return `
version = "1000.0.0\\
other text
version = "1000.0.0\\
        `;
      }
    });
  });

  afterEach(() => {
    writeFileMock.mockReset();
  });

  test('should set nightly version', async () => {
    const version = '0.81.0-nightly-29282302-abcd1234';
    await updateReactNativeArtifacts(version, 'nightly');

    for (const [filePath, contents] of writeFileMock.mock.calls) {
      // Make snapshot names resilient to platform path sep differences
      expect(formatGeneratedFile(contents)).toMatchSnapshot(
        path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
      );
    }
  });

  test('should set release version', async () => {
    const version = '0.81.0';
    await updateReactNativeArtifacts(version, 'release');

    for (const [filePath, contents] of writeFileMock.mock.calls) {
      // Make snapshot names resilient to platform path sep differences
      expect(formatGeneratedFile(contents)).toMatchSnapshot(
        path.relative(REPO_ROOT, filePath).split(path.sep).join('/'),
      );
    }
  });
});

function formatGeneratedFile(source: string) {
  // Strip \@\generated annotation
  return source.replace(
    new RegExp('^ \\* @' + 'generated.*', 'gm'),
    ' * << GENERATED >>',
  );
}
