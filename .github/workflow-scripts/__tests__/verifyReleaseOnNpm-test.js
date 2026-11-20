/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const mockVerifyPublishedPackage = jest.fn();
const silence = () => {};

jest.mock('../utils.js', () => ({
  log: silence,
  sleep: silence,
}));

jest.mock('../verifyPublishedPackage.js', () => ({
  verifyPublishedPackage: mockVerifyPublishedPackage,
}));

const {verifyReleaseOnNpm} = require('../verifyReleaseOnNpm');

describe('#verifyReleaseOnNPM', () => {
  beforeEach(jest.clearAllMocks);

  it("waits on npm updating for version and not 'latest'", async () => {
    const NOT_LATEST = false;
    const version = '0.78.0';
    await verifyReleaseOnNpm(version, NOT_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenLastCalledWith(
      'react-native',
      version,
      null,
      18,
    );
  });

  it('waits on npm updating version and latest tag', async () => {
    const IS_LATEST = true;
    const version = '0.78.0';

    await verifyReleaseOnNpm(version, IS_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
      'react-native',
      version,
      'latest',
      18,
    );
  });

  it('waits on npm updating version, not latest and next tag', async () => {
    const IS_LATEST = false;
    const version = '0.78.0-rc.0';

    await verifyReleaseOnNpm(version, IS_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
      'react-native',
      version,
      'next',
      18,
    );
  });

  it('waits on npm updating version, latest and next tag', async () => {
    const IS_LATEST = true;
    const version = '0.78.0-rc.0';

    await verifyReleaseOnNpm(version, IS_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
      'react-native',
      version,
      'next',
      18,
    );
  });

  describe('timeouts', () => {
    it('will timeout if npm does not update package version after a set number of retries', async () => {
      const RETRIES = 2;

      (await verifyReleaseOnNpm('0.77.0', true, RETRIES),
        expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
          'react-native',
          '0.77.0',
          'latest',
          2,
        ));
    });

    it('will timeout if npm does not update latest tag after a set number of retries', async () => {
      const RETRIES = 7;
      const IS_LATEST = true;

      await verifyReleaseOnNpm('0.77.0', IS_LATEST, RETRIES);

      expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
        'react-native',
        '0.77.0',
        'latest',
        7,
      );
    });
  });
});
