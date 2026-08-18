/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const echoMock = jest.fn();
const execMock = jest.fn();
const exitMock = jest.fn();
const testMock = jest.fn();

jest.mock('shelljs', () => ({
  echo: echoMock,
  exec: execMock,
  exit: exitMock,
  test: testMock,
}));

const {publishAndroidArtifactsToMaven} = require('../release-utils');

describe('publishAndroidArtifactsToMaven', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test('finds and releases the repository closed by build_android', () => {
    execMock.mockReturnValueOnce({code: 0});

    publishAndroidArtifactsToMaven('0.86.2', 'release');

    expect(execMock).toHaveBeenCalledWith(
      './gradlew findSonatypeStagingRepository releaseSonatypeStagingRepository',
    );
    expect(exitMock).not.toHaveBeenCalled();
  });

  test('does not manage a staging repository for a nightly', () => {
    publishAndroidArtifactsToMaven('0.87.0-nightly-20260728', 'nightly');

    expect(execMock).not.toHaveBeenCalled();
    expect(exitMock).not.toHaveBeenCalled();
  });
});
