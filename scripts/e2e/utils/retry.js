/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {spawnSync} = require('node:child_process');

async function retry(command, options, maxRetries, delay, args) {
  for (let i = 1; i <= maxRetries; i++) {
    console.log(`Attempt ${i}: ${command}`);
    const result = spawnSync(command, args ? args : [], options);

    if (result.status === 0) {
      console.log(`Command succeeded on attempt ${i}`);
      return true;
    }

    console.warn(`Command failed on attempt ${i}`);

    if (i >= maxRetries) {
      console.log('Maximum retries reached. Exiting.');
      return false;
    }

    if (delay > 0) {
      console.log(`Sleeping for ${delay} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    console.log('Retrying...\n\n');
  }
}

module.exports = {
  retry,
};
