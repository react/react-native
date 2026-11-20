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
const getCurrentCommitMock = jest.fn();
const exitIfNotOnGitMock = jest.fn();

jest.mock('shelljs', () => ({
  exec: execMock,
}));

jest.mock('./../scm-utils', () => ({
  getCurrentCommit: getCurrentCommitMock,
  exitIfNotOnGit: exitIfNotOnGitMock,
}));

const {getNpmInfo, publishPackage} = require('../npm-utils');

describe('npm-utils', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.resetAllMocks();
  });

  describe('publishPackage', () => {
    it('should run publish command', () => {
      publishPackage(
        'path/to/my-package',
        {tags: ['latest']},
        {silent: true, cwd: 'i/expect/this/to/be/overriden'},
      );
      expect(execMock).toHaveBeenCalledWith('npm publish --tag latest', {
        silent: true,
        cwd: 'path/to/my-package',
      });
    });

    it('should run publish command when no execOptions', () => {
      publishPackage('path/to/my-package', {tags: ['latest']});
      expect(execMock).toHaveBeenCalledWith('npm publish --tag latest', {
        cwd: 'path/to/my-package',
      });
    });

    it('should handle multiple tags', () => {
      publishPackage('path/to/my-package', {
        tags: ['next', '0.72-stable'],
      });
      expect(execMock).toHaveBeenCalledWith(
        'npm publish --tag next --tag 0.72-stable',
        {cwd: 'path/to/my-package'},
      );
    });

    it('should handle -no-tag', () => {
      publishPackage('path/to/my-package', {tags: ['--no-tag']});
      expect(execMock).toHaveBeenCalledWith('npm publish --no-tag', {
        cwd: 'path/to/my-package',
      });
    });
  });

  describe('getNpmInfo', () => {
    beforeEach(() => {
      process.env.GITHUB_REF = '';
      process.env.GITHUB_REF_NAME = '';
    });

    it('return the expected format for patch-prereleases on GHA', () => {
      const isoStringSpy = jest.spyOn(Date.prototype, 'toISOString');
      isoStringSpy.mockReturnValue('2023-10-04T15:43:55.123Z');
      getCurrentCommitMock.mockImplementation(() => 'abcd1234');
      // exitIfNotOnGit takes a function as a param and it:
      // 1. checks if we are on git => if not it exits
      // 2. run the function passed as a param and return the output to the caller
      // For the mock, we are assuming we are on github and we are returning `false`
      // as the `getNpmInfo` function will pass a function that checks if the
      // current commit is a tagged with 'latest'.
      // In the Mock, we are assuming that we are on git (it does not exits) and the
      // checkIfLatest function returns `false`
      exitIfNotOnGitMock.mockImplementation(() => false);

      process.env.GITHUB_REF = 'refs/tags/v0.74.1-rc.0';
      process.env.GITHUB_REF_NAME = 'v0.74.1-rc.0';
      const returnedValue = getNpmInfo('release');
      expect(returnedValue).toMatchObject({
        version: `0.74.1-rc.0`,
        tag: '--no-tag',
      });
    });
  });
});
