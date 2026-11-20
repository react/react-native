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
const mockVerifyPublishedPackage = jest.fn();
const silence = () => {};

jest.mock('../utils.js', () => ({
  log: silence,
  run: mockRun,
  sleep: mockSleep,
  getNpmPackageInfo: mockGetNpmPackageInfo,
}));

jest.mock('../verifyPublishedPackage.js', () => ({
  verifyPublishedPackage: mockVerifyPublishedPackage,
}));

const {
  publishTemplate,
  verifyPublishedTemplate,
} = require('../publishTemplate');

const getMockGithub = () => ({
  rest: {
    actions: {
      createWorkflowDispatch: jest.fn(),
    },
  },
});

describe('#publishTemplate', () => {
  beforeEach(jest.clearAllMocks);

  it('checks commits for magic #publish-package-to-npm&latest string and sets latest', async () => {
    mockRun.mockReturnValueOnce(`
      The commit message

    #publish-packages-to-npm&latest`);

    const github = getMockGithub();
    await publishTemplate(github, '0.76.0', true);
    expect(github.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'react-native-community',
      repo: 'template',
      workflow_id: 'release.yaml',
      ref: '0.76-stable',
      inputs: {
        dry_run: true,
        is_latest_on_npm: true,
        version: '0.76.0',
      },
    });
  });

  it('pubished as is_latest_on_npm = false if missing magic string', async () => {
    mockRun.mockReturnValueOnce(`
      The commit message without magic
    `);

    const github = getMockGithub();
    await publishTemplate(github, '0.76.0', false);
    expect(github.rest.actions.createWorkflowDispatch).toHaveBeenCalledWith({
      owner: 'react-native-community',
      repo: 'template',
      workflow_id: 'release.yaml',
      ref: '0.76-stable',
      inputs: {
        dry_run: false,
        is_latest_on_npm: false,
        version: '0.76.0',
      },
    });
  });
});

describe('#verifyPublishedTemplate', () => {
  beforeEach(jest.clearAllMocks);

  it("waits on npm updating for version and not 'latest'", async () => {
    const NOT_LATEST = false;
    const version = '0.77.0';

    await verifyPublishedTemplate(version, NOT_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
      '@react-native-community/template',
      version,
      null,
      18,
    );
  });

  it('waits on npm updating version and latest tag', async () => {
    const IS_LATEST = true;
    const version = '0.77.0';

    await verifyPublishedTemplate(version, IS_LATEST);

    expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
      '@react-native-community/template',
      version,
      'latest',
      18,
    );
  });

  describe('retries', () => {
    it('will timeout if npm does not update package version after a set number of retries', async () => {
      const RETRIES = 2;

      (await verifyPublishedTemplate('0.77.0', true, RETRIES),
        expect(mockVerifyPublishedPackage).toHaveBeenCalledWith(
          '@react-native-community/template',
          '0.77.0',
          'latest',
          2,
        ));
    });
  });
});
