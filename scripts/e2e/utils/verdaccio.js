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

const {REPO_ROOT} = require('../../shared/consts');
const {execSync, spawn} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const NPM_CONFIG_PATH = path.join(REPO_ROOT, '.npmrc');
const VERDACCIO_CONFIG_PATH = path.join(__dirname, '..', 'verdaccio.yml');
const VERDACCIO_STORAGE_PATH = '/tmp/verdaccio';
const VERDACCIO_SERVER_URL = 'http://127.0.0.1:4873';

/**
 * Configure and run a local Verdaccio server. This is an npm proxy that can be
 * used with `npm publish` and `npm install`, configured in
 * `scripts/e2e/verdaccio.yml`.
 */
function setupVerdaccio() /*: number */ {
  const {host} = new URL(VERDACCIO_SERVER_URL);

  // NOTE: Reading from/writing to an .npmrc in a workspaces project root is
  // invalid from npm 9.x. Keyed config, such as `--registry`, should be
  // specified in env vars or command invocations instead.
  // See https://github.com/npm/cli/issues/6099
  console.log(`Writing '.npmrc' to ${NPM_CONFIG_PATH}`);
  fs.writeFileSync(NPM_CONFIG_PATH, `//${host}/:_authToken=secretToken\n`);

  console.log(
    `Invoking npx verdaccio@5.16.3 --config ${VERDACCIO_CONFIG_PATH}`,
  );
  const verdaccioProcess = spawn(
    'npx',
    ['verdaccio@5.16.3', '--config', VERDACCIO_CONFIG_PATH],
    {env: {...process.env, VERDACCIO_STORAGE_PATH}},
  );

  console.log(`Invoking npx wait-on@6.0.1 ${VERDACCIO_SERVER_URL}`);
  execSync(`npx wait-on@6.0.1 ${VERDACCIO_SERVER_URL}`);

  console.log(`Verdaccio is ready at PID ${verdaccioProcess.pid}`);
  return verdaccioProcess.pid;
}

module.exports = {
  setupVerdaccio,
  VERDACCIO_SERVER_URL,
  VERDACCIO_STORAGE_PATH,
};
