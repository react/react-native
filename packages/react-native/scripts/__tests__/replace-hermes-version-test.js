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

const {execFileSync} = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const SCRIPT =
  require.resolve('../../sdks/hermes-engine/utils/replace_hermes_version.js');
const VERSION = '0.0.0-test';
const BINARY =
  'destroot/Library/Frameworks/universal/hermesvm.xcframework/ios-arm64/hermesvm.framework/hermesvm';

function writeFile(filePath, contents) {
  fs.mkdirSync(path.dirname(filePath), {recursive: true});
  fs.writeFileSync(filePath, contents);
}

describe('Hermes configuration replacement', () => {
  let podsRoot;
  let binary;
  let marker;

  beforeEach(() => {
    podsRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'hermes-config-test-'));
    binary = path.join(podsRoot, 'hermes-engine', BINARY);
    marker = path.join(podsRoot, 'hermes-engine/.last_build_configuration');
  });

  afterEach(() => {
    fs.rmSync(podsRoot, {recursive: true, force: true});
  });

  function buildTarball(configuration) {
    const stage = path.join(podsRoot, 'stage');
    writeFile(path.join(stage, BINARY), configuration);
    const artifacts = path.join(podsRoot, 'hermes-engine-artifacts');
    fs.mkdirSync(artifacts, {recursive: true});
    execFileSync('tar', [
      '-czf',
      path.join(
        artifacts,
        `hermes-ios-${VERSION}-${configuration.toLowerCase()}.tar.gz`,
      ),
      '-C',
      stage,
      '.',
    ]);
  }

  function runScript(configuration) {
    // Match the podspec's build phase: run the CLI from the Pods directory.
    execFileSync(
      process.execPath,
      [SCRIPT, '-c', configuration, '-r', VERSION, '-p', podsRoot],
      {cwd: podsRoot, encoding: 'utf8'},
    );
  }

  it.each([
    ['Debug', 'Release'],
    ['Release', 'Debug'],
  ])('restores %s when the marker is missing and %s remains', (target, old) => {
    writeFile(binary, old);
    buildTarball(target);

    runScript(target);

    expect(fs.readFileSync(binary, 'utf8')).toBe(target);
    expect(fs.readFileSync(marker, 'utf8')).toBe(target);
  });

  it.each(['Debug', 'Release'])(
    'keeps a recorded %s configuration without requiring a tarball',
    configuration => {
      writeFile(binary, configuration);
      writeFile(marker, configuration);

      runScript(configuration);

      expect(fs.readFileSync(binary, 'utf8')).toBe(configuration);
      expect(fs.readFileSync(marker, 'utf8')).toBe(configuration);
    },
  );

  it.each([
    ['Debug', 'Release'],
    ['Release', 'Debug'],
  ])('switches to %s when %s is recorded', (target, old) => {
    writeFile(binary, old);
    writeFile(marker, old);
    buildTarball(target);

    runScript(target);

    expect(fs.readFileSync(binary, 'utf8')).toBe(target);
    expect(fs.readFileSync(marker, 'utf8')).toBe(target);
  });

  it('records Debug after restoring a fresh install with no marker', () => {
    writeFile(binary, 'Debug');
    buildTarball('Debug');

    runScript('Debug');

    expect(fs.readFileSync(binary, 'utf8')).toBe('Debug');
    expect(fs.readFileSync(marker, 'utf8')).toBe('Debug');
  });
});
