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

const {
  cleanupMavenStagingRepositories,
  createAuthorizationHeader,
} = require('../cleanup-maven-staging-repositories');

const fetchMock = jest.fn();

// $FlowFixMe[cannot-write]
global.fetch = fetchMock;

const API_URL = 'https://sonatype.example/';
const PORTAL_API_URL = 'https://portal.example/';
const CREDENTIALS = {username: 'token-user', password: 'token-password'};
const DESCRIPTION = 'react-native:v0.86.2:github-run-1234';

describe('cleanupMavenStagingRepositories', () => {
  beforeEach(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.resetAllMocks();
  });

  test('drops matching repositories in every state', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          {key: 'matching-1', state: 'open', description: DESCRIPTION},
          {key: 'other-run', state: 'open', description: 'another run'},
          {key: 'matching-2', state: 'open', description: DESCRIPTION},
          {key: 'already-closed', state: 'closed', description: DESCRIPTION},
          {
            key: 'already-released',
            state: 'released',
            description: DESCRIPTION,
          },
        ],
      }),
    });
    fetchMock.mockResolvedValue({ok: true});

    await expect(
      cleanupMavenStagingRepositories(DESCRIPTION, CREDENTIALS, API_URL),
    ).resolves.toBe(4);

    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(
      fetchMock.mock.calls.map(([url, options]) => [
        url.toString(),
        options.method,
      ]),
    ).toEqual([
      ['https://sonatype.example/manual/search/repositories?ip=any', 'GET'],
      ['https://sonatype.example/manual/drop/repository/matching-1', 'DELETE'],
      ['https://sonatype.example/manual/drop/repository/matching-2', 'DELETE'],
      [
        'https://sonatype.example/manual/drop/repository/already-closed',
        'DELETE',
      ],
      [
        'https://sonatype.example/manual/drop/repository/already-released',
        'DELETE',
      ],
    ]);
    expect(fetchMock.mock.calls[0][1].headers).toEqual({
      Authorization: createAuthorizationHeader(CREDENTIALS),
    });
  });

  test('does nothing when no repository matches', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({repositories: []}),
    });

    await expect(
      cleanupMavenStagingRepositories(DESCRIPTION, CREDENTIALS, API_URL),
    ).resolves.toBe(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('waits for validation and drops the associated Portal deployment', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          {
            key: 'closed-repository',
            state: 'closed',
            description: DESCRIPTION,
            portal_deployment_id: 'deployment-1',
          },
        ],
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({deploymentState: 'VALIDATING'}),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({deploymentState: 'VALIDATED'}),
    });
    fetchMock.mockResolvedValue({ok: true});

    await expect(
      cleanupMavenStagingRepositories(
        DESCRIPTION,
        CREDENTIALS,
        API_URL,
        PORTAL_API_URL,
        0,
        2,
      ),
    ).resolves.toBe(1);

    expect(
      fetchMock.mock.calls.map(([url, options]) => [
        url.toString(),
        options.method,
      ]),
    ).toEqual([
      ['https://sonatype.example/manual/search/repositories?ip=any', 'GET'],
      [
        'https://portal.example/api/v1/publisher/status?id=deployment-1',
        'POST',
      ],
      [
        'https://portal.example/api/v1/publisher/status?id=deployment-1',
        'POST',
      ],
      [
        'https://portal.example/api/v1/publisher/deployment/deployment-1',
        'DELETE',
      ],
      [
        'https://sonatype.example/manual/drop/repository/closed-repository',
        'DELETE',
      ],
    ]);
  });

  test('keeps an already published Portal deployment', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        repositories: [
          {
            key: 'released-repository',
            state: 'released',
            description: DESCRIPTION,
            portal_deployment_id: 'deployment-2',
          },
        ],
      }),
    });
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({deploymentState: 'PUBLISHED'}),
    });
    fetchMock.mockResolvedValueOnce({ok: true});

    await expect(
      cleanupMavenStagingRepositories(
        DESCRIPTION,
        CREDENTIALS,
        API_URL,
        PORTAL_API_URL,
      ),
    ).resolves.toBe(1);

    expect(
      fetchMock.mock.calls.map(([url, options]) => [
        url.toString(),
        options.method,
      ]),
    ).toEqual([
      ['https://sonatype.example/manual/search/repositories?ip=any', 'GET'],
      [
        'https://portal.example/api/v1/publisher/status?id=deployment-2',
        'POST',
      ],
      [
        'https://sonatype.example/manual/drop/repository/released-repository',
        'DELETE',
      ],
    ]);
  });

  test('fails when Sonatype returns an error', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => 'temporarily unavailable',
    });

    await expect(
      cleanupMavenStagingRepositories(DESCRIPTION, CREDENTIALS, API_URL),
    ).rejects.toThrow(
      'Sonatype request to /manual/search/repositories failed with HTTP 503: temporarily unavailable',
    );
  });

  test('rejects an invalid search response', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await expect(
      cleanupMavenStagingRepositories(DESCRIPTION, CREDENTIALS, API_URL),
    ).rejects.toThrow(
      'Sonatype returned an invalid repository search response.',
    );
  });
});
