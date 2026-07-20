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
const path = require('node:path');
const {parseArgs, styleText} = require('node:util');

async function main() {
  const {
    positionals: [],
    values: {help},
  } = parseArgs({
    allowPositionals: true,
    options: {
      help: {type: 'boolean'},
    } /*:: as {[string]: util$ParseArgsOption} */,
  });

  if (help) {
    console.log(`
  Usage: node ./scripts/releases/validate-dotslash-artifacts.js

  Ensures that the first-party DotSlash files in the current commit all point to
  valid URLs that return the described artifacts. This script is intended to run
  in two key scenarios:

  1. Continuously on main - this verifies the output of the Meta-internal CI pipeline
     that publishes DotSlash files to the repo.
  2. After a release is published - this verifies the behavior of the
     write-dotslash-release-asset-urls.js and upload-release-assets-for-dotslash.js
     scripts, as well as any commits (e.g. merges, picks) that touched the DotSlash
     files in the release branch since the branch was cut.
     Release asset URLs are only valid once the release is published, so we can't
     run this continuously on commits in the release branch (specifically, it would
     fail on the release commit itself).
`);
    return;
  }

  await validateDotSlashArtifacts();
}

async function validateDotSlashArtifacts() /*: Promise<void> */ {
  for (const filename of FIRST_PARTY_DOTSLASH_FILES) {
    const fullPath = path.join(REPO_ROOT, filename);
    console.log(`Validating all HTTP providers for ${filename}...`);
    await processDotSlashFileInPlace(
      fullPath,
      async (providers, suggestedFilename, artifactInfo) => {
        for (const provider of providers) {
          if (!isHttpProvider(provider)) {
            console.log(
              styleText(
                'dim',
                `   <skipping provider of type: ${String(provider.type)}>`,
              ),
            );
            continue;
          }
          console.log(
            styleText(
              'dim',
              `   ${provider.url} (expected ${artifactInfo.size} bytes, ${artifactInfo.hash} ${artifactInfo.digest})`,
            ),
          );
          const {data} = await getWithCurl(provider.url);
          await validateDotSlashArtifactData(data, artifactInfo);
        }
        return providers;
      },
    );
  }
}

module.exports = {
  validateDotSlashArtifacts,
};

if (require.main === module) {
  void main();
}
