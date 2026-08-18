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

const DEFAULT_API_URL = 'https://ossrh-staging-api.central.sonatype.com/';
const DEFAULT_PORTAL_API_URL = 'https://central.sonatype.com/';
const DEFAULT_PORTAL_POLL_INTERVAL_MS = 10_000;
const DEFAULT_PORTAL_STATUS_ATTEMPTS = 60;

/*::
type Credentials = {
  password: string,
  username: string,
};

type StagingRepository = {
  description?: ?string,
  key: string,
  portal_deployment_id?: ?string,
};
*/

function createAuthorizationHeader(
  credentials /*: Credentials */,
) /*: string */ {
  const token = Buffer.from(
    `${credentials.username}:${credentials.password}`,
  ).toString('base64');
  return `Bearer ${token}`;
}

async function request(
  url /*: URL */,
  credentials /*: Credentials */,
  method /*: string */ = 'GET',
) /*: Promise<Response> */ {
  const response = await fetch(url, {
    method,
    headers: {
      Authorization: createAuthorizationHeader(credentials),
    },
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(
      `Sonatype request to ${url.pathname} failed with HTTP ${response.status}: ${responseBody}`,
    );
  }

  return response;
}

function sleep(milliseconds /*: number */) /*: Promise<void> */ {
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

async function cleanupPortalDeployment(
  deploymentId /*: string */,
  credentials /*: Credentials */,
  portalApiUrl /*: string */,
  pollIntervalMs /*: number */,
  maxStatusAttempts /*: number */,
) /*: Promise<void> */ {
  const statusUrl = new URL('api/v1/publisher/status', portalApiUrl);
  statusUrl.searchParams.set('id', deploymentId);

  let deploymentState /*: string */ = '';
  for (let attempt = 1; attempt <= maxStatusAttempts; attempt++) {
    const statusResponse = await request(statusUrl, credentials, 'POST');
    const statusResult = await statusResponse.json();
    deploymentState = statusResult.deploymentState;
    if (typeof deploymentState !== 'string') {
      throw new Error(
        `Sonatype returned an invalid status for Portal deployment ${deploymentId}.`,
      );
    }

    if (deploymentState !== 'PENDING' && deploymentState !== 'VALIDATING') {
      break;
    }
    if (attempt === maxStatusAttempts) {
      throw new Error(
        `Portal deployment ${deploymentId} remained ${deploymentState} after ${maxStatusAttempts} status checks.`,
      );
    }
    if (pollIntervalMs > 0) {
      await sleep(pollIntervalMs);
    }
  }

  if (deploymentState === 'VALIDATED' || deploymentState === 'FAILED') {
    const dropUrl = new URL(
      `api/v1/publisher/deployment/${encodeURIComponent(deploymentId)}`,
      portalApiUrl,
    );
    await request(dropUrl, credentials, 'DELETE');
    console.log(`Dropped Central Portal deployment ${deploymentId}.`);
  } else if (
    deploymentState === 'PUBLISHING' ||
    deploymentState === 'PUBLISHED'
  ) {
    console.log(
      `Central Portal deployment ${deploymentId} is already ${deploymentState}; it cannot be dropped.`,
    );
  } else {
    throw new Error(
      `Central Portal deployment ${deploymentId} has unsupported state ${deploymentState}.`,
    );
  }
}

async function cleanupMavenStagingRepositories(
  repositoryDescription /*: string */,
  credentials /*: Credentials */,
  stagingApiUrl /*: string */ = DEFAULT_API_URL,
  portalApiUrl /*: string */ = DEFAULT_PORTAL_API_URL,
  portalPollIntervalMs /*: number */ = DEFAULT_PORTAL_POLL_INTERVAL_MS,
  maxPortalStatusAttempts /*: number */ = DEFAULT_PORTAL_STATUS_ATTEMPTS,
) /*: Promise<number> */ {
  if (repositoryDescription === '') {
    throw new Error('A Maven staging repository description is required.');
  }

  const searchUrl = new URL('manual/search/repositories', stagingApiUrl);
  searchUrl.searchParams.set('ip', 'any');

  const searchResponse = await request(searchUrl, credentials);
  const searchResult = await searchResponse.json();
  if (!Array.isArray(searchResult.repositories)) {
    throw new Error('Sonatype returned an invalid repository search response.');
  }

  const matchingRepositories /*: Array<StagingRepository> */ =
    searchResult.repositories.filter(
      repository => repository.description === repositoryDescription,
    );

  for (const repository of matchingRepositories) {
    if (repository.portal_deployment_id != null) {
      await cleanupPortalDeployment(
        repository.portal_deployment_id,
        credentials,
        portalApiUrl,
        portalPollIntervalMs,
        maxPortalStatusAttempts,
      );
    }

    const dropUrl = new URL(
      `manual/drop/repository/${encodeURIComponent(repository.key)}`,
      stagingApiUrl,
    );
    await request(dropUrl, credentials, 'DELETE');
    console.log(`Dropped Maven staging repository ${repository.key}.`);
  }

  if (matchingRepositories.length === 0) {
    console.log(
      `No Maven staging repository matched "${repositoryDescription}".`,
    );
  }

  return matchingRepositories.length;
}

async function main() {
  const repositoryDescription =
    process.env.ORG_GRADLE_PROJECT_SONATYPE_REPOSITORY_DESCRIPTION;
  const username = process.env.ORG_GRADLE_PROJECT_SONATYPE_USERNAME;
  const password = process.env.ORG_GRADLE_PROJECT_SONATYPE_PASSWORD;

  if (repositoryDescription == null) {
    throw new Error(
      'ORG_GRADLE_PROJECT_SONATYPE_REPOSITORY_DESCRIPTION is required.',
    );
  }
  if (username == null || password == null) {
    throw new Error('Sonatype username and password are required.');
  }

  await cleanupMavenStagingRepositories(repositoryDescription, {
    username,
    password,
  });
}

if (require.main === module) {
  void main();
}

module.exports = {
  cleanupPortalDeployment,
  cleanupMavenStagingRepositories,
  createAuthorizationHeader,
};
