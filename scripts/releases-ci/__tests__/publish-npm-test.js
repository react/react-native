/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const execMock = jest.fn();
const consoleLogMock = jest.fn();
const isTaggedLatestMock = jest.fn();
const setVersionMock = jest.fn();
const updateReactNativeArtifactsMock = jest.fn();
const publishAndroidArtifactsToMavenMock = jest.fn();
const publishExternalArtifactsToMavenMock = jest.fn();
const env = process.env;
const publishPackageMock = jest.fn();
const getNpmInfoMock = jest.fn();
const generateAndroidArtifactsMock = jest.fn();
const getPackagesMock = jest.fn();
const updateHermesVersionsToPrebuiltMock = jest.fn();
const getBranchName = jest.fn();

const {REPO_ROOT} = require('../../shared/consts');
const {publishNpm} = require('../publish-npm');
const path = require('path');

let consoleLog;

describe('publish-npm', () => {
  beforeAll(() => {
    jest
      .mock('shelljs', () => ({
        exec: execMock,
      }))
      .mock('../../releases/utils/scm-utils', () => ({
        exitIfNotOnGit: command => command(),
        getCurrentCommit: () => 'currentco_mmit',
        isTaggedLatest: isTaggedLatestMock,
        getBranchName: getBranchName,
      }))
      .mock('../../releases/utils/release-utils', () => ({
        generateAndroidArtifacts: generateAndroidArtifactsMock,
        publishAndroidArtifactsToMaven: publishAndroidArtifactsToMavenMock,
        publishExternalArtifactsToMaven: publishExternalArtifactsToMavenMock,
      }))
      .mock('../../releases/set-version', () => ({
        setVersion: setVersionMock,
      }))
      .mock('../../releases/set-rn-artifacts-version', () => ({
        updateReactNativeArtifacts: updateReactNativeArtifactsMock,
      }))
      .mock('../../releases/utils/npm-utils', () => ({
        ...jest.requireActual('../../releases/utils/npm-utils'),
        publishPackage: publishPackageMock,
        getNpmInfo: getNpmInfoMock,
      }))
      .mock('../../releases/utils/hermes-utils', () => ({
        updateHermesVersionsToPrebuilt: updateHermesVersionsToPrebuiltMock,
      }));
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  beforeEach(() => {
    consoleLog = console.log;
    // $FlowExpectedError[cannot-write]
    console.log = consoleLogMock;
  });

  afterEach(() => {
    process.env = env;
    // $FlowExpectedError[cannot-write]
    console.log = consoleLog;
    jest.resetModules();
    jest.resetAllMocks();
  });

  it('should fail when invalid build type is passed', async () => {
    // Call actual function
    // $FlowExpectedError[underconstrained-implicit-instantiation]
    const npmUtils = jest.requireActual('../../releases/utils/npm-utils');
    getNpmInfoMock.mockImplementation(npmUtils.getNpmInfo);

    await expect(async () => {
      // $FlowExpectedError[incompatible-type]
      await publishNpm('invalid');
    }).rejects.toThrow('Unsupported build type: invalid');
  });

  describe('dry-run', () => {
    beforeEach(() => {
      jest.mock('../../shared/monorepoUtils', () => ({
        ...jest.requireActual('../../shared/monorepoUtils'),
        getReactNativePackage: jest
          .fn()
          .mockResolvedValue({version: '1000.0.0'}),
      }));
    });

    it('should set version, hermes version, and not publish', async () => {
      const version = '1000.0.0-currentco';
      getNpmInfoMock.mockReturnValueOnce({
        version,
        tag: null,
      });
      getBranchName.mockReturnValueOnce('main');

      await publishNpm('dry-run');

      expect(updateHermesVersionsToPrebuiltMock).toHaveBeenCalled();
      expect(setVersionMock).not.toBeCalled();
      expect(updateReactNativeArtifactsMock).toBeCalledWith(version, 'dry-run');

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(consoleLogMock).toHaveBeenCalledWith(
        'Skipping `npm publish` because --dry-run is set.',
      );

      // Expect termination
      expect(publishAndroidArtifactsToMavenMock).not.toHaveBeenCalled();
      expect(publishExternalArtifactsToMavenMock).not.toHaveBeenCalled();
      expect(publishPackageMock).not.toHaveBeenCalled();
    });

    describe('when on stable branch', () => {
      it('main → RC0: should skip Hermes version', async () => {
        const version = '1000.0.0-currentco';
        getNpmInfoMock.mockReturnValueOnce({
          version,
          tag: null,
        });
        getBranchName.mockReturnValueOnce('0.83-stable');

        await publishNpm('dry-run');

        expect(updateHermesVersionsToPrebuiltMock).not.toHaveBeenCalled();
        expect(setVersionMock).not.toBeCalled();
        expect(updateReactNativeArtifactsMock).toBeCalledWith(
          version,
          'dry-run',
        );

        // Generate Android artifacts is now delegate to build_android entirely
        expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

        expect(consoleLogMock).toHaveBeenCalledWith(
          'Skipping `npm publish` because --dry-run is set.',
        );

        // Expect termination
        expect(publishAndroidArtifactsToMavenMock).not.toHaveBeenCalled();
        expect(publishExternalArtifactsToMavenMock).not.toHaveBeenCalled();
        expect(publishPackageMock).not.toHaveBeenCalled();
      });

      it('RC0 → RC1: should skip Hermes version and artifacts', async () => {
        const version = '0.83.0-rc.0';
        getNpmInfoMock.mockReturnValueOnce({
          version,
          tag: null,
        });
        getBranchName.mockReturnValueOnce('0.83-stable');
        jest.mock('../../shared/monorepoUtils', () => ({
          ...jest.requireActual('../../shared/monorepoUtils'),
          getReactNativePackage: jest
            .fn()
            .mockResolvedValue({version: '0.83.0-rc.0'}),
        }));

        await publishNpm('dry-run');

        expect(updateHermesVersionsToPrebuiltMock).not.toHaveBeenCalled();
        expect(setVersionMock).not.toBeCalled();
        expect(updateReactNativeArtifactsMock).not.toBeCalled();

        // Generate Android artifacts is now delegate to build_android entirely
        expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

        expect(consoleLogMock).toHaveBeenCalledWith(
          'Skipping `npm publish` because --dry-run is set.',
        );

        // Expect termination
        expect(publishAndroidArtifactsToMavenMock).not.toHaveBeenCalled();
        expect(publishExternalArtifactsToMavenMock).not.toHaveBeenCalled();
        expect(publishPackageMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('nightly', () => {
    beforeAll(() => {
      jest.mock('../../shared/monorepoUtils', () => ({
        ...jest.requireActual('../../shared/monorepoUtils'),
        getPackages: getPackagesMock,
      }));
    });

    afterAll(() => {
      jest.unmock('../../shared/monorepoUtils');
    });

    it('should publish', async () => {
      const expectedVersion = '0.82.0-nightly-20230420-currentco';
      getPackagesMock.mockImplementation(() => ({
        'monorepo/pkg-a': {
          name: 'monorepo/pkg-a',
          path: 'path/to/monorepo/pkg-a',
          packageJson: {version: expectedVersion},
        },
        'monorepo/pkg-b': {
          name: 'monorepo/pkg-b',
          path: 'path/to/monorepo/pkg-b',
          packageJson: {version: expectedVersion},
        },
      }));

      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));

      await publishNpm('nightly');

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(updateHermesVersionsToPrebuiltMock).toHaveBeenCalled();

      expect(publishPackageMock.mock.calls).toEqual([
        [
          'path/to/monorepo/pkg-a',
          {otp: undefined, tags: ['nightly'], access: 'public'},
        ],
        [
          'path/to/monorepo/pkg-b',
          {otp: undefined, tags: ['nightly'], access: 'public'},
        ],
        [
          path.join(REPO_ROOT, 'packages', 'react-native'),
          {otp: undefined, tags: ['nightly']},
        ],
      ]);
      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'nightly',
      );
      expect(publishExternalArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'nightly',
      );
      expect(consoleLogMock.mock.calls).toEqual([
        ['Publishing monorepo/pkg-a...'],
        [`Published monorepo/pkg-a@${expectedVersion} to npm`],
        ['Publishing monorepo/pkg-b...'],
        [`Published monorepo/pkg-b@${expectedVersion} to npm`],
        [`Published react-native@${expectedVersion} to npm`],
      ]);
    });

    it('should not publish when setting version fails', async () => {
      const expectedVersion = '0.82.0-nightly-20230420-currentco';
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));
      setVersionMock.mockImplementation(() => {
        throw new Error('something went wrong with setVersion');
      });

      await expect(async () => {
        await publishNpm('nightly');
      }).rejects.toThrow('something went wrong with setVersion');

      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();
      expect(publishAndroidArtifactsToMavenMock).not.toBeCalled();
      expect(publishExternalArtifactsToMavenMock).not.toHaveBeenCalled();
    });

    it('should fail to publish react-native if some monorepo packages fail', async () => {
      const expectedVersion = '0.82.0-nightly-20230420-currentco';

      getPackagesMock.mockImplementation(() => ({
        'monorepo/pkg-a': {
          name: 'monorepo/pkg-a',
          path: 'path/to/monorepo/pkg-a',
          packageJson: {version: expectedVersion},
        },
        'monorepo/pkg-b': {
          name: 'monorepo/pkg-b',
          path: 'path/to/monorepo/pkg-b',
          packageJson: {version: expectedVersion},
        },
        'monorepo/pkg-c': {
          name: 'monorepo/pkg-c',
          path: 'path/to/monorepo/pkg-c',
          packageJson: {version: expectedVersion},
        },
      }));

      publishPackageMock.mockImplementation(packagePath => {
        if (packagePath === 'path/to/monorepo/pkg-b') {
          return {code: 1};
        }
        return {code: 0};
      });
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'nightly',
      }));

      // We expect publish to fail on monorepo/pkg-b, and not publish anything-beyond
      await expect(async () => {
        await publishNpm('nightly');
      }).rejects.toThrow(
        `Failed to publish monorepo/pkg-b@${expectedVersion} to npm. Stopping all nightly publishes`,
      );

      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      // Note that we don't call `publishPackage` for react-native, or monorepo/pkg-c
      expect(publishPackageMock.mock.calls).toEqual([
        [
          'path/to/monorepo/pkg-a',
          {otp: undefined, tags: ['nightly'], access: 'public'},
        ],
        [
          'path/to/monorepo/pkg-b',
          {otp: undefined, tags: ['nightly'], access: 'public'},
        ],
      ]);

      expect(consoleLogMock.mock.calls).toEqual([
        ['Publishing monorepo/pkg-a...'],
        ['Published monorepo/pkg-a@0.82.0-nightly-20230420-currentco to npm'],
        ['Publishing monorepo/pkg-b...'],
      ]);
      expect(publishAndroidArtifactsToMavenMock).not.toHaveBeenCalled();
      expect(publishExternalArtifactsToMavenMock).not.toHaveBeenCalled();
    });
  });

  describe('release', () => {
    it('should publish non-latest', async () => {
      const expectedVersion = '0.81.1';
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: '0.81-stable',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));

      await publishNpm('release');

      expect(setVersionMock).not.toBeCalled();

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(publishExternalArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );

      expect(publishPackageMock.mock.calls).toEqual([
        [
          path.join(REPO_ROOT, 'packages', 'react-native'),
          {tags: ['0.81-stable']},
        ],
      ]);

      expect(consoleLogMock.mock.calls).toEqual([
        [`Published react-native@${expectedVersion} to npm`],
      ]);
    });

    it('should publish latest stable', async () => {
      const expectedVersion = '0.81.1';
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'latest',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));

      await publishNpm('release');

      expect(updateReactNativeArtifactsMock).not.toBeCalled();

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(publishExternalArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );

      expect(publishPackageMock.mock.calls).toEqual([
        [path.join(REPO_ROOT, 'packages', 'react-native'), {tags: ['latest']}],
      ]);

      expect(consoleLogMock.mock.calls).toEqual([
        [`Published react-native@${expectedVersion} to npm`],
      ]);
    });

    it('should fail to publish latest stable', async () => {
      const expectedVersion = '0.81.1';
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'latest',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 1,
      }));

      execMock.mockReturnValueOnce({code: 1});
      isTaggedLatestMock.mockReturnValueOnce(true);

      await expect(async () => {
        await publishNpm('release');
      }).rejects.toThrow(
        `Failed to publish react-native@${expectedVersion} to npm.`,
      );

      expect(updateReactNativeArtifactsMock).not.toHaveBeenCalled();

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(publishExternalArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );

      expect(publishPackageMock.mock.calls).toEqual([
        [path.join(REPO_ROOT, 'packages', 'react-native'), {tags: ['latest']}],
      ]);
      expect(consoleLogMock).not.toHaveBeenCalled();
    });

    it('should publish next', async () => {
      const expectedVersion = '0.81.0-rc.4';
      getNpmInfoMock.mockImplementation(() => ({
        version: expectedVersion,
        tag: 'next',
      }));
      publishPackageMock.mockImplementation(() => ({
        code: 0,
      }));

      await publishNpm('release');

      expect(setVersionMock).not.toBeCalled();

      // Generate Android artifacts is now delegate to build_android entirely
      expect(generateAndroidArtifactsMock).not.toHaveBeenCalled();

      expect(publishAndroidArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );
      expect(publishExternalArtifactsToMavenMock).toHaveBeenCalledWith(
        expectedVersion,
        'release',
      );

      expect(publishPackageMock.mock.calls).toEqual([
        [path.join(REPO_ROOT, 'packages', 'react-native'), {tags: ['next']}],
      ]);
      expect(consoleLogMock.mock.calls).toEqual([
        [`Published react-native@${expectedVersion} to npm`],
      ]);
    });
  });
});
