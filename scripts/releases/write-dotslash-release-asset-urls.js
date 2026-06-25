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

/*::
import type {DotSlashHttpProvider, DotSlashProvider, DotSlashArtifactInfo} from './utils/dotslash-utils';
*/

const {REPO_ROOT} = require('../shared/consts');
const {getWithCurl} = require('./utils/curl-utils');
const {
  dangerouslyResignGeneratedFile,
  isHttpProvider,
  processDotSlashFileInPlace,
  validateAndParseDotSlashFile,
  validateDotSlashArtifactData,
} = require('./utils/dotslash-utils');
const {diff: jestDiff} = require('jest-diff');
const path = require('path');
const {parseArgs} = require('util');

const FIRST_PARTY_DOTSLASH_FILES = [
  'packages/debugger-shell/bin/react-native-devtools',
];

async function main() {
  const {
    positionals: [version],
    values: {help},
  } = parseArgs({
    allowPositionals: true,
    options: {
      help: {type: 'boolean'},
    } /*:: as {[string]: util$ParseArgsOption} */,
  });

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/write-dotslash-release-asset-urls.js <version>

  Inserts references to release assets URLs into first-party DotSlash files in
  the repo, in preparation for publishing a new release and uploading the
  assets (which happens in a separate step).
`);
    return;
  }

  if (version == null) {
    throw new Error('Missing version argument');
  }

  await writeReleaseAssetUrlsToDotSlashFiles(version);
}

async function writeReleaseAssetUrlsToDotSlashFiles(
  version /*: string */,
) /*: Promise<void> */ {
  const releaseTag = version.startsWith('v') ? version : `v${version}`;
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    await writeReleaseAssetUrlsToDotSlashFile({
      filename,
      releaseTag,
    });
  }
}

async function writeReleaseAssetUrlsToDotSlashFile(
  {filename, releaseTag} /*: {filename: string, releaseTag: string} */,
) /*: Promise<void> */ {
  const fullPath = path.resolve(REPO_ROOT, filename);
  console.log(`Updating ${filename}...`);
  await processDotSlashFileInPlace(
    fullPath,
    async (originalProviders, suggestedFilename, artifactInfo) => {
      const updatedProviders = await updateAndVerifyProviders({
        providers: originalProviders,
        suggestedFilename,
        artifactInfo,
        releaseTag,
      });
      console.log(
        'Providers:\n',
        diffProviderArrays(originalProviders, updatedProviders),
      );
      return updatedProviders;
    },
  );
  await dangerouslyResignGeneratedFile(fullPath);
  await validateAndParseDotSlashFile(fullPath);
}

async function updateAndVerifyProviders(
  {providers: providersArg, suggestedFilename, artifactInfo, releaseTag} /*:
  {providers: ReadonlyArray<DotSlashProvider>,
  suggestedFilename: string,
  artifactInfo: DotSlashArtifactInfo,
  releaseTag: string,}
*/,
) {
  const providers = providersArg.filter(
    provider => !isPreviousReleaseAssetProvider(provider),
  );
  const upstreamHttpProviders = providers.filter(isHttpProvider);
  if (upstreamHttpProviders.length === 0) {
    throw new Error(
      'No upstream HTTP providers found for asset: ' + suggestedFilename,
    );
  }
  for (const provider of upstreamHttpProviders) {
    console.log(`Downloading from ${provider.url} for integrity validation...`);
    const {data} = await getWithCurl(provider.url);
    await validateDotSlashArtifactData(data, artifactInfo);
  }
  providers.unshift(
    createReleaseAssetProvider({
      releaseTag,
      suggestedFilename,
    }),
  );
  return providers;
}

function isPreviousReleaseAssetProvider(
  provider /*: DotSlashProvider */,
) /*: boolean */ {
  return (
    isHttpProvider(provider) &&
    provider.url.startsWith(
      'https://github.com/facebook/react-native/releases/download/',
    )
  );
}

function createReleaseAssetProvider(
  {
    releaseTag,
    suggestedFilename,
  } /*: {releaseTag: string, suggestedFilename: string} */,
) /*: DotSlashProvider */ {
  return {
    url: `https://github.com/facebook/react-native/releases/download/${encodeURIComponent(releaseTag)}/${encodeURIComponent(suggestedFilename)}`,
  };
}

function diffProviderArrays(
  original /*: ReadonlyArray<DotSlashProvider> */,
  updated /*: ReadonlyArray<DotSlashProvider> */,
) {
  return jestDiff(original, updated, {
    aAnnotation: 'Original',
    bAnnotation: 'Updated',
  });
}

module.exports = {
  FIRST_PARTY_DOTSLASH_FILES,
  writeReleaseAssetUrlsToDotSlashFiles,
  writeReleaseAssetUrlsToDotSlashFile,
};

if (require.main === module) {
  void main();
}
