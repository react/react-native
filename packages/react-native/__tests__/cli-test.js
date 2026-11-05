/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

const {devDependencies} = require('../../rn-tester/package.json');
const {peerDependencies} = require('../package.json');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {minVersion} = require('semver');

const CLI_PACKAGE = '@react-native-community/cli';
const CLI_RANGE = peerDependencies[CLI_PACKAGE];
const MINIMUM_CLI_VERSION = minVersion(CLI_RANGE);

describe('react-native CLI version warning', () => {
  let projectDir;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(projectDir, {recursive: true, force: true});
  });

  function runConfig(version, range = CLI_RANGE) {
    const cliDir = path.join(
      projectDir,
      'node_modules',
      '@react-native-community',
      'cli',
    );
    fs.mkdirSync(cliDir, {recursive: true});
    fs.writeFileSync(
      path.join(cliDir, 'package.json'),
      JSON.stringify({version}),
    );
    fs.writeFileSync(
      path.join(cliDir, 'index.js'),
      'exports.run = () => console.log(JSON.stringify({platforms: {}}));',
    );
    const reactNativeDir = path.join(
      projectDir,
      'node_modules',
      'react-native',
    );
    fs.mkdirSync(reactNativeDir, {recursive: true});
    fs.copyFileSync(
      path.join(__dirname, '..', 'cli.js'),
      path.join(reactNativeDir, 'cli.js'),
    );
    fs.writeFileSync(
      path.join(reactNativeDir, 'package.json'),
      JSON.stringify({
        name: 'react-native',
        peerDependencies: {[CLI_PACKAGE]: range},
      }),
    );
    return spawnSync(
      process.execPath,
      [path.join(reactNativeDir, 'cli.js'), 'config'],
      {
        cwd: projectDir,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_PATH: path.dirname(
            path.dirname(require.resolve('semver/package.json')),
          ),
        },
      },
    );
  }

  it('keeps the declared minimum on the CLI major exercised by RNTester', () => {
    expect(MINIMUM_CLI_VERSION.major).toBe(
      minVersion(devDependencies[CLI_PACKAGE]).major,
    );
  });

  it('reports an incompatible CLI on stderr and preserves config output', () => {
    const {status, stdout, stderr} = runConfig('20.2.0');

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual({platforms: {}});
    expect(stderr).toContain('@react-native-community/cli@20.2.0');
    expect(stderr).toContain(`"${CLI_PACKAGE}": "${CLI_RANGE}"`);
  });

  it.each([
    MINIMUM_CLI_VERSION.version,
    [
      MINIMUM_CLI_VERSION.major,
      MINIMUM_CLI_VERSION.minor,
      MINIMUM_CLI_VERSION.patch,
    ].join('.'),
    `${MINIMUM_CLI_VERSION.major + 1}.0.0-alpha.1`,
  ])('accepts CLI %s without a warning', version => {
    const {status, stdout, stderr} = runConfig(version);

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual({platforms: {}});
    expect(stderr).toBe('');
  });

  it('uses an updated peer range for the warning and install suggestion', () => {
    const range = '>=22.0.0';
    const {status, stdout, stderr} = runConfig('21.0.0', range);

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual({platforms: {}});
    expect(stderr).toContain(`requires ${range}`);
    expect(stderr).toContain(`"${CLI_PACKAGE}": "${range}"`);
  });

  it('accepts the version allowed by an updated peer range', () => {
    const {status, stderr} = runConfig('20.2.0', '>=20.0.0');

    expect(status).toBe(0);
    expect(stderr).toBe('');
  });
});
