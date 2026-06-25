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

// An interface shaped like a subset of the Octokit class from `@octokit/rest`.
// Used to allow mocking in tests.
export interface IOctokit {
  readonly repos: Readonly<{
    listReleaseAssets: (
      params: Readonly<{
        owner: string,
        repo: string,
        release_id: string,
      }>,
    ) => Promise<{
      data: Array<{
        id: string,
        name: string,
        ...
      }>,
      ...
    }>,
    uploadReleaseAsset: (
      params: Readonly<{
        owner: string,
        repo: string,
        release_id: string,
        name: string,
        data: Buffer,
        headers: Readonly<{
          'content-type': string,
          ...
        }>,
        ...
      }>,
    ) => Promise<{
      data: {
        browser_download_url: string,
        ...
      },
      ...
    }>,
    deleteReleaseAsset: (params: {
      owner: string,
      repo: string,
      asset_id: string,
      ...
    }) => Promise<unknown>,
  }>;
}
