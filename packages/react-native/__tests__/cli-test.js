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

const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

describe('react-native CLI version warning', () => {
  let projectDir;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'rn-cli-test-'));
  });

  afterEach(() => {
    fs.rmSync(projectDir, {recursive: true, force: true});
  });

  function runConfig(version) {
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
    return spawnSync(
      process.execPath,
      [path.join(__dirname, '..', 'cli.js'), 'config'],
      {cwd: projectDir, encoding: 'utf8'},
    );
  }

  it('reports an incompatible CLI on stderr and preserves config output', () => {
    const {status, stdout, stderr} = runConfig('20.2.0');

    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual({platforms: {}});
    expect(stderr).toContain('@react-native-community/cli@20.2.0');
    expect(stderr).toContain(
      '"@react-native-community/cli": ">=21.0.0-alpha.1"',
    );
  });

  it.each(['21.0.0-alpha.1', '21.0.0', '22.0.0-alpha.1'])(
    'accepts CLI %s without a warning',
    version => {
      const {status, stdout, stderr} = runConfig(version);

      expect(status).toBe(0);
      expect(JSON.parse(stdout)).toEqual({platforms: {}});
      expect(stderr).toBe('');
    },
  );
});
