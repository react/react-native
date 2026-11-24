/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

const {run, sleep, log} = require('./utils.js');
const {verifyPublishedPackage} = require('./verifyPublishedPackage.js');
const REACT_NATIVE_NPM_PKG = 'react-native';
const MAX_RETRIES = 15 * 6; // 90 attempts. Waiting between attempt: 10 s. Total time: 15 mins.
/**
 * Will verify that @latest, @next and the @<version> have been published.
 *
 * NOTE: This will infinitely query each step until successful, make sure the
 *       calling job has a timeout.
 */
module.exports.verifyReleaseOnNpm = async (
  version,
  latest = false,
  retries = MAX_RETRIES,
) => {
  const tag = version.includes('-rc.') ? 'next' : latest ? 'latest' : null;
  if (version.startsWith('v')) {
    version = version.slice(1);
  }
  await verifyPublishedPackage(REACT_NATIVE_NPM_PKG, version, tag, retries);
};
