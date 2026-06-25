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

const {REPO_ROOT} = require('../shared/consts');
const {getWithCurl} = require('./utils/curl-utils');
const {
  isHttpProvider,
  processDotSlashFileInPlace,
  validateDotSlashArtifactData,
} = require('./utils/dotslash-utils');
const {
  FIRST_PARTY_DOTSLASH_FILES,
} = require('./write-dotslash-release-asset-urls');
const {Octokit} = require('@octokit/rest');
const nullthrows = require('nullthrows');
const path = require('path');
const {parseArgs} = require('util');

/*::
import type {DotSlashProvider, DotSlashHttpProvider, DotSlashArtifactInfo} from './utils/dotslash-utils';
import type {IOctokit} from './utils/octokit-utils';

type GitHubReleaseAsset = {id: string, ...};
type ReleaseAssetMap = ReadonlyMap<string, GitHubReleaseAsset>;

type ReleaseInfo = Readonly<{
  releaseId: string,
  releaseTag: string,
  existingAssetsByName: ReleaseAssetMap,
}>;

type ExecutionOptions = Readonly<{
  force: boolean,
  dryRun: boolean,
}>;
*/

async function main() {
  const {
    positionals: [version],
    values: {help, token, releaseId, force, dryRun},
  } = parseArgs({
    allowPositionals: true,
    options: {
      token: {type: 'string'},
      releaseId: {type: 'string'},
      force: {type: 'boolean', default: false},
      dryRun: {type: 'boolean', default: false},
      help: {type: 'boolean'},
    } /*:: as {[string]: util$ParseArgsOption} */,
  });

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/upload-release-assets-for-dotslash.js <version> --release_id <id> --token <github-token> [--force] [--dry-run]

  Scans first-party DotSlash files in the repo for URLs referencing assets of
  an upcoming release, and uploads the actual assets to the GitHub release
  identified by the given release ID.

  Options:
    <version>     The version of the release to upload assets for, with or
                  without the 'v' prefix.
    --dry-run     Do not upload release assets.
    --force       Overwrite existing release assets.
    --release_id  The ID of the GitHub release to upload assets to.
    --token       A GitHub token with write access to the release.
`);
    return;
  }

  if (version == null) {
    throw new Error('Missing version argument');
  }

  await uploadReleaseAssetsForDotSlashFiles({
    version,
    token,
    releaseId,
    force,
    dryRun,
  });
}

async function uploadReleaseAssetsForDotSlashFiles(
  {version, token, releaseId, force = false, dryRun = false} /*: {
    version: string,
    token: string,
    releaseId: string,
    force?: boolean,
    dryRun?: boolean,
  } */,
) /*: Promise<void> */ {
  const releaseTag = version.startsWith('v') ? version : `v${version}`;
  const octokit = new Octokit({auth: token});
  const existingAssetsByName = await getReleaseAssetMap(
    {
      releaseId,
    },
    octokit,
  );
  const releaseInfo = {
    releaseId,
    releaseTag,
    existingAssetsByName,
  };
  const executionOptions = {
    force,
    dryRun,
  };
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    await uploadReleaseAssetsForDotSlashFile(
      filename,
      releaseInfo,
      executionOptions,
      octokit,
    );
  }
}

/**
 * List all release assets for a particular GitHub release ID, and return them
 * as a map keyed by asset names.
 */
async function getReleaseAssetMap(
  {releaseId} /*: {
  releaseId: string,
} */,
  octokit /*: IOctokit */,
) /*: Promise<ReleaseAssetMap> */ {
  const existingAssets = await octokit.repos.listReleaseAssets({
    owner: 'facebook',
    repo: 'react-native',
    release_id: releaseId,
  });
  return new Map(existingAssets.data.map(asset => [asset.name, asset]));
}

/**
 * Given a first-party DotSlash file path in the repo, reupload the referenced
 * binaries from the upstream provider (typically: Meta CDN) to the draft
 * release (hosted on GitHub).
 */
async function uploadReleaseAssetsForDotSlashFile(
  filename /*: string */,
  releaseInfo /*: ReleaseInfo */,
  executionOptions /*: ExecutionOptions */,
  octokit /*: IOctokit */,
) /*: Promise<void> */ {
  const fullPath = path.resolve(REPO_ROOT, filename);
  console.log(`Uploading assets for ${filename}...`);
  await processDotSlashFileInPlace(
    fullPath,
    async (providers, suggestedFilename, artifactInfo) => {
      await fetchUpstreamAssetAndUploadToRelease(
        {
          providers,
          suggestedFilename,
          artifactInfo,
          dotslashFilename: filename,
        },
        releaseInfo,
        executionOptions,
        octokit,
      );
    },
  );
}

/**
 * Given a description of a DotSlash artifact for a particular platform,
 * infers the upstream URL ( = where the binary is currently available) and
 * release asset URL ( = where the binary will be hosted after the release),
 * then downloads the asset from the upstream URL and uploads it to GitHub
 * at the desired URL.
 */
async function fetchUpstreamAssetAndUploadToRelease(
  {
    providers,
    // NOTE: We mostly ignore suggestedFilename in favour of reading the actual asset URLs
    suggestedFilename,
    artifactInfo,
    dotslashFilename,
  } /*: {
  providers: ReadonlyArray<DotSlashProvider>,
  suggestedFilename: string,
  artifactInfo: DotSlashArtifactInfo,
  dotslashFilename: string,
} */,
  releaseInfo /*: ReleaseInfo */,
  executionOptions /*: ExecutionOptions */,
  octokit /*: IOctokit */,
) {
  const targetReleaseAssetInfo = providers
    .map(provider => parseReleaseAssetInfo(provider, releaseInfo.releaseTag))
    .find(Boolean);
  if (targetReleaseAssetInfo == null) {
    console.log(
      `[${suggestedFilename} (suggested)] DotSlash file does not reference any release URLs for this asset - ignoring.`,
    );
    return;
  }
  const upstreamProvider /*: ?DotSlashHttpProvider */ = providers
    .filter(isHttpProvider)
    .find(provider => !parseReleaseAssetInfo(provider, releaseInfo.releaseTag));
  if (upstreamProvider == null) {
    throw new Error(
      `No upstream URL found for release asset ${targetReleaseAssetInfo.name}`,
    );
  }
  const existingAsset = releaseInfo.existingAssetsByName.get(
    targetReleaseAssetInfo.name,
  );
  if (existingAsset && !executionOptions.force) {
    console.log(
      `[${targetReleaseAssetInfo.name}] Skipping existing release asset...`,
    );
    return;
  }
  await maybeDeleteExistingReleaseAsset(
    {
      name: targetReleaseAssetInfo.name,
      existingAsset,
    },
    executionOptions,
    octokit,
  );
  const {data, contentType} = await fetchAndValidateUpstreamAsset({
    name: targetReleaseAssetInfo.name,
    url: upstreamProvider.url,
    artifactInfo,
  });
  if (executionOptions.dryRun) {
    console.log(
      `[${targetReleaseAssetInfo.name}] Dry run: Not uploading to release.`,
    );
    return;
  }
  await uploadAndVerifyReleaseAsset(
    {
      name: targetReleaseAssetInfo.name,
      url: targetReleaseAssetInfo.url,
      data,
      contentType,
      releaseId: releaseInfo.releaseId,
      dotslashFilename,
    },
    octokit,
  );
}

/**
 * Checks whether the given DotSlash artifact provider refers to an asset URL
 * that is part of the current release. Returns the asset name as well as the
 * full URL if that is the case. Returns null otherwise.
 */
function parseReleaseAssetInfo(
  provider /*: DotSlashProvider */,
  releaseTag /*: string */,
) /*:
  ?{
    name: string,
    url: string,
  }
*/ {
  const releaseAssetPrefix = `https://github.com/facebook/react-native/releases/download/${encodeURIComponent(releaseTag)}/`;

  if (isHttpProvider(provider) && provider.url.startsWith(releaseAssetPrefix)) {
    return {
      name: decodeURIComponent(provider.url.slice(releaseAssetPrefix.length)),
      url: provider.url,
    };
  }
  return null;
}

/**
 * Deletes the specified release asset if it exists, unless we are in dry run
 * mode (in which case this is a noop).
 */
async function maybeDeleteExistingReleaseAsset(
  {name, existingAsset} /*: {
  name: string,
  existingAsset: ?GitHubReleaseAsset,
}
*/,
  {dryRun} /*: ExecutionOptions */,
  octokit /*: IOctokit */,
) /*: Promise<void> */ {
  if (!existingAsset) {
    return;
  }
  if (dryRun) {
    console.log(`[${name}] Dry run: Not deleting existing release asset.`);
    return;
  }
  console.log(`[${name}] Deleting existing release asset...`);
  await octokit.repos.deleteReleaseAsset({
    owner: 'facebook',
    repo: 'react-native',
    asset_id: existingAsset.id,
  });
}

/**
 * Given a description of a DotSlash artifact, downloads it and verifies its
 * size and hash (similarly to how DotSlash itself would do it after release).
 */
async function fetchAndValidateUpstreamAsset(
  {name, url, artifactInfo} /*: {
  name: string,
  url: string,
  artifactInfo: DotSlashArtifactInfo,
} */,
) /*: Promise<{
  data: Buffer,
  contentType: string,
}> */ {
  console.log(`[${name}] Downloading from ${url}...`);
  // NOTE: Using curl because we have seen issues with fetch() on GHA
  // and the Meta CDN. ¯\_(ツ)_/¯
  const {data, contentType} = await getWithCurl(url);
  console.log(`[${name}] Validating download...`);
  await validateDotSlashArtifactData(data, artifactInfo);
  return {
    data,
    contentType: contentType ?? 'application/octet-stream',
  };
}

/**
 * Uploads the specified asset to a GitHub release.
 *
 * By the time we call this function, we have already commited (and published!)
 * a reference to the asset's eventual URL, so we also verify that the URL path
 * hasn't changed in the process.
 */
async function uploadAndVerifyReleaseAsset(
  {name, data, contentType, url, releaseId, dotslashFilename} /*: {
  name: string,
  data: Buffer,
  contentType: string,
  url: string,
  releaseId: string,
  dotslashFilename: string,
}
*/,
  octokit /*: IOctokit */,
) /*: Promise<void> */ {
  console.log(`[${name}] Uploading to release...`);
  const {
    data: {browser_download_url},
  } = await octokit.repos.uploadReleaseAsset({
    owner: 'facebook',
    repo: 'react-native',
    release_id: releaseId,
    name,
    data,
    headers: {
      'content-type': contentType,
    },
  });

  // Once uploaded, check that the name didn't get mangled.
  const actualUrlPathname = new URL(browser_download_url).pathname;
  const actualAssetName = decodeURIComponent(
    nullthrows(/[^/]*$/.exec(actualUrlPathname))[0],
  );
  if (actualAssetName !== name) {
    throw new Error(
      `Asset name was changed while uploading to the draft release: expected ${name}, got ${actualAssetName}. ` +
        `${dotslashFilename} has already been published to npm with the following URL, which will not work when the release is published on GitHub: ${url}`,
    );
  }
  console.log(`[${name}] Uploaded to ${browser_download_url}`);
}

module.exports = {
  uploadReleaseAssetsForDotSlashFiles,
  getReleaseAssetMap,
  uploadReleaseAssetsForDotSlashFile,
};

if (require.main === module) {
  void main();
}
