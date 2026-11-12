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

describe('react-native CLI compatibility', () => {
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
    const reactNativeDir = path.join(
      projectDir,
      'node_modules',
      'react-native',
    );
    fs.mkdirSync(reactNativeDir, {recursive: true});
    for (const file of ['cli.js', 'package.json']) {
      fs.copyFileSync(
        path.join(__dirname, '..', file),
        path.join(reactNativeDir, file),
      );
    }
    const {status, stdout, stderr} = spawnSync(
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
    return {status, stdout, stderr};
  }

  it('refuses to run an incompatible CLI with an upgrade error', () => {
    expect(runConfig('20.2.0')).toMatchInlineSnapshot(`
Object {
  "status": 1,
  "stderr": "Error: Refusing to use @react-native-community/cli, as the installed version is incompatible with this version of React Native. Please upgrade @react-native-community/cli dependencies to 21.x.x.
",
  "stdout": "",
}
`);
  });

  it.each(['21.0.0-alpha.1', '21.0.0', '22.0.0-alpha.1'])(
    'runs compatible CLI %s without an error',
    version => {
      expect(runConfig(version)).toEqual({
        status: 0,
        stdout: '{"platforms":{}}\n',
        stderr: '',
      });
    },
  );
});
