/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {verifyArtifactsAreOnMaven} = require('../verifyArtifactsAreOnMaven');

const mockSleep = jest.fn();
const silence = () => {};
const mockFetch = jest.fn();
const mockExit = jest.fn();

jest.mock('../utils.js', () => ({
  log: silence,
  sleep: mockSleep,
}));

process.exit = mockExit;
global.fetch = mockFetch;

const BASE_URL =
  'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts';

// The verifier HEAD-checks the POM plus every classifier tarball attached to
// the react-native-artifacts publication (external-artifacts/build.gradle.kts).
const expectedUrls = version => [
  `${BASE_URL}/${version}/react-native-artifacts-${version}.pom`,
  ...[
    'reactnative-core-debug',
    'reactnative-core-release',
    'reactnative-dependencies-debug',
    'reactnative-dependencies-release',
    'reactnative-headers-debug',
    'reactnative-headers-release',
    'reactnative-dependencies-headers-debug',
    'reactnative-dependencies-headers-release',
  ].map(
    classifier =>
      `${BASE_URL}/${version}/react-native-artifacts-${version}-${classifier}.tar.gz`,
  ),
];

describe('#verifyArtifactsAreOnMaven', () => {
  beforeEach(jest.clearAllMocks);

  it('waits for the packages to be published on maven when version has no v', async () => {
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });
    // First attempt: the POM is not there yet. Second attempt: every URL is.
    mockFetch
      .mockReturnValueOnce(Promise.resolve({status: 404}))
      .mockReturnValue(Promise.resolve({status: 200}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(1);
    for (const url of expectedUrls('0.78.1')) {
      expect(mockFetch).toHaveBeenCalledWith(url, {method: 'HEAD'});
    }
  });

  it('waits for the packages to be published on maven, when version starts with v', async () => {
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });
    mockFetch
      .mockReturnValueOnce(Promise.resolve({status: 404}))
      .mockReturnValue(Promise.resolve({status: 200}));

    const version = 'v0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(1);
    for (const url of expectedUrls('0.78.1')) {
      expect(mockFetch).toHaveBeenCalledWith(url, {method: 'HEAD'});
    }
  });

  it('passes immediately if packages are already on Maven', async () => {
    mockFetch.mockReturnValue(Promise.resolve({status: 200}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(0);
    // All nine URLs (POM + 8 classifier tarballs) are verified in one pass.
    expect(mockFetch).toHaveBeenCalledTimes(9);
    for (const url of expectedUrls('0.78.1')) {
      expect(mockFetch).toHaveBeenCalledWith(url, {method: 'HEAD'});
    }
  });

  it('waits when a classifier artifact is missing even though the POM exists', async () => {
    mockSleep.mockReturnValueOnce(Promise.resolve()).mockImplementation(() => {
      throw new Error('Should not be called again!');
    });
    // First attempt: POM ok, first classifier missing. Second attempt: all ok.
    mockFetch
      .mockReturnValueOnce(Promise.resolve({status: 200}))
      .mockReturnValueOnce(Promise.resolve({status: 404}))
      .mockReturnValue(Promise.resolve({status: 200}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(1);
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('tries 90 times and then exits', async () => {
    mockSleep.mockReturnValue(Promise.resolve());
    mockFetch.mockReturnValue(Promise.resolve({status: 404}));

    const version = '0.78.1';
    await verifyArtifactsAreOnMaven(version);

    expect(mockSleep).toHaveBeenCalledTimes(90);
    expect(mockExit).toHaveBeenCalledWith(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://repo1.maven.org/maven2/com/facebook/react/react-native-artifacts/0.78.1/react-native-artifacts-0.78.1.pom',
      {method: 'HEAD'},
    );
  });
});
