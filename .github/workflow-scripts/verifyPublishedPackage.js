/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {log, getNpmPackageInfo, sleep} = require('./utils');

const SLEEP_S = 10;
const MAX_RETRIES = 15 * 6; // 90 attempts. Waiting between attempt: 10 s. Total time: 15 mins.

async function verifyPublishedPackage(
  packageName,
  version,
  tag = null,
  retries = MAX_RETRIES,
) {
  log(`🔍 Is ${packageName}@${version} on npm?`);

  let count = retries;
  while (count-- > 0) {
    try {
      const json = await getNpmPackageInfo(packageName, tag ? tag : version);
      if (!tag) {
        log(`🎉 Found ${packageName}@${version} on npm`);
        return;
      }

      // check for next tag
      if (tag === 'next' && json.version === version) {
        log(`🎉 ${packageName}@next → ${version} on npm`);
        return;
      }

      // Check for latest tag
      if (tag === 'latest' && json.version === version) {
        log(`🎉 ${packageName}@latest → ${version} on npm`);
        return;
      }

      log(
        `🐌 ${packageName}@${tag} → ${json.version} on npm and not ${version} as expected, retrying...`,
      );
    } catch (e) {
      log(`Nope, fetch failed: ${e.message}`);
    }
    await sleep(SLEEP_S);
  }

  let msg = `🚨 Timed out when trying to verify ${packageName}@${version} on npm`;
  if (tag) {
    msg += ` and ${tag} tag points to this version.`;
  }
  log(msg);
  process.exit(1);
}

module.exports = {
  verifyPublishedPackage,
};
