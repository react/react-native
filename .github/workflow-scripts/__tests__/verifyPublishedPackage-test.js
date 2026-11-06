/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const mockRun = jest.fn();
const mockSleep = jest.fn();
const mockGetNpmPackageInfo = jest.fn();
const silence = () => {};

const REACT_NATIVE_PACKAGE = 'react-native';

jest.mock('../utils.js', () => ({
  log: silence,
  run: mockRun,
  sleep: mockSleep,
  getNpmPackageInfo: mockGetNpmPackageInfo,
}));

const {verifyPublishedPackage} = require('../verifyPublishedPackage');

describe('#verifyPublishedPackage', () => {
  beforeEach(jest.clearAllMocks);

  it("waits on npm updating for version and not 'latest'", async () => {
    mockGetNpmPackageInfo
      // template@<version>
      .mockReturnValueOnce(Promise.reject('mock http/404'))
      .mockReturnValueOnce(Promise.resolve());
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });

    const version = '0.78.0';
    await verifyPublishedPackage(REACT_NATIVE_PACKAGE, version, null);

    expect(mockGetNpmPackageInfo).toHaveBeenLastCalledWith(
      REACT_NATIVE_PACKAGE,
      version,
    );
  });

  it('waits on npm updating version and latest tag', async () => {
    const version = '0.78.0';
    mockGetNpmPackageInfo
      // template@latest → unknown tag
      .mockReturnValueOnce(Promise.reject('mock http/404'))
      // template@latest != version → old tag
      .mockReturnValueOnce(Promise.resolve({version: '0.76.5'}))
      // template@latest == version → correct tag
      .mockReturnValueOnce(Promise.resolve({version}));
    mockSleep
      .mockReturnValueOnce(Promise.resolve())
      .mockReturnValueOnce(Promise.resolve())
      .mockImplementation(() => {
        throw new Error('Should not be called again!');
      });

    await verifyPublishedPackage(REACT_NATIVE_PACKAGE, version, 'latest');

    expect(mockGetNpmPackageInfo).toHaveBeenCalledWith(
      REACT_NATIVE_PACKAGE,
      'latest',
    );
  });

  it('waits on npm updating version and next tag', async () => {
    const version = '0.78.0-rc.0';
    mockGetNpmPackageInfo
      // template@latest → unknown tag
      .mockReturnValueOnce(Promise.reject('mock http/404'))
      // template@latest != version → old tag
      .mockReturnValueOnce(Promise.resolve({version: '0.76.5'}))
      // template@latest == version → correct tag
      .mockReturnValueOnce(Promise.resolve({version}));
    mockSleep
      .mockReturnValueOnce(Promise.resolve())
      .mockReturnValueOnce(Promise.resolve())
      .mockImplementation(() => {
        throw new Error('Should not be called again!');
      });
    await verifyPublishedPackage(REACT_NATIVE_PACKAGE, version, 'next');

    expect(mockGetNpmPackageInfo).toHaveBeenCalledWith(
      REACT_NATIVE_PACKAGE,
      'next',
    );
  });

  describe('timeouts', () => {
    let mockProcess;
    beforeEach(() => {
      mockProcess = jest.spyOn(process, 'exit').mockImplementation(code => {
        throw new Error(`process.exit(${code}) called!`);
      });
    });
    afterEach(() => mockProcess.mockRestore());
    it('will timeout if npm does not update package version after a set number of retries', async () => {
      const RETRIES = 2;
      mockGetNpmPackageInfo.mockReturnValue(Promise.reject('mock http/404'));
      mockSleep.mockReturnValue(Promise.resolve());
      await expect(() =>
        verifyPublishedPackage(
          REACT_NATIVE_PACKAGE,
          '0.77.0',
          'latest',
          RETRIES,
        ),
      ).rejects.toThrowError('process.exit(1) called!');
      expect(mockGetNpmPackageInfo).toHaveBeenCalledTimes(RETRIES);
    });

    it('will timeout if npm does not update latest tag after a set number of retries', async () => {
      const RETRIES = 7;
      const IS_LATEST = true;
      mockGetNpmPackageInfo.mockReturnValue(
        Promise.resolve({version: '0.76.5'}),
      );
      mockSleep.mockReturnValue(Promise.resolve());
      await expect(async () => {
        await verifyPublishedPackage(
          REACT_NATIVE_PACKAGE,
          '0.77.0',
          'latest',
          RETRIES,
        );
      }).rejects.toThrowError('process.exit(1) called!');
      expect(mockGetNpmPackageInfo).toHaveBeenCalledTimes(RETRIES);
    });
  });
});
