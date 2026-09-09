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

const {
  MIN_IOS_VERSION_SUPPORTED,
  readIosDeploymentTargetFromPbxproj,
  resolveIosDeploymentTarget,
  sanitizeIosDeploymentTarget,
} = require('../ios-deployment-target');
const {
  PLAIN_APP,
  SECOND_TARGET,
  TARGET_DEBUG,
  TARGET_RELEASE,
  raisedTarget,
  twoAppTargets,
  withoutProjectSetting,
  withProjectSetting,
  withSetting,
} = require('./pbxproj-variants');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const RAISED = raisedTarget('16.4');
const TWO = twoAppTargets('16.4');
const MIXED_CONFIGS = withSetting(
  withSetting(PLAIN_APP, TARGET_DEBUG, '17.0'),
  TARGET_RELEASE,
  '16.4',
);
const VARIABLE_VALUE = withProjectSetting(PLAIN_APP, '"$(SOME_VAR)"');
const NOTHING_DECLARED = withoutProjectSetting(PLAIN_APP);
const GONE_UUID = 'CC0000000000000000000000';

describe('sanitizeIosDeploymentTarget', () => {
  it.each([
    ['16', '16.0'],
    ['16.4', '16.4'],
    ['14.0', MIN_IOS_VERSION_SUPPORTED],
    ['$(FOO)', MIN_IOS_VERSION_SUPPORTED],
    [null, MIN_IOS_VERSION_SUPPORTED],
  ])('normalizes and clamps %p to %p', (raw, expected) => {
    expect(sanitizeIosDeploymentTarget(raw)).toBe(expected);
  });
});

describe('readIosDeploymentTargetFromPbxproj', () => {
  it.each([
    ['project-level fallback', PLAIN_APP, {}, '15.1'],
    ['target-level wins', RAISED, {}, '16.4'],
    ['minimum across configurations', MIXED_CONFIGS, {}, '16.4'],
    ['a variable reference is ignored', VARIABLE_VALUE, {}, null],
    ['nothing declared', NOTHING_DECLARED, {}, null],
    ['minimum over every app target', TWO, {}, '15.1'],
    ['named target', TWO, {targetName: 'MyApp'}, '16.4'],
    ['unmatched targetName', TWO, {targetName: 'Nope'}, '15.1'],
    [
      'uuid beats name',
      TWO,
      {targetUuid: SECOND_TARGET, targetName: 'MyApp'},
      '15.1',
    ],
    ['uuid that is gone', TWO, {targetUuid: GONE_UUID}, '15.1'],
  ])('%s', (_name, text, opts, expected) => {
    expect(readIosDeploymentTargetFromPbxproj(text, opts)).toBe(expected);
  });
});

describe('resolveIosDeploymentTarget', () => {
  const dirs = [];

  afterEach(() => {
    for (const dir of dirs) {
      fs.rmSync(dir, {recursive: true, force: true});
    }
    dirs.length = 0;
  });

  // A throwaway .xcodeproj, so the fs path runs for real.
  function write(text) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'spm-iosdt-'));
    dirs.push(dir);
    const xcodeprojPath = path.join(dir, 'MyApp.xcodeproj');
    fs.mkdirSync(xcodeprojPath);
    fs.writeFileSync(path.join(xcodeprojPath, 'project.pbxproj'), text, 'utf8');
    return xcodeprojPath;
  }

  it('reads the app value, clamped to the React Native minimum', () => {
    expect(resolveIosDeploymentTarget({xcodeprojPath: write(RAISED)})).toBe(
      '16.4',
    );
    expect(
      resolveIosDeploymentTarget({
        xcodeprojPath: write(withProjectSetting(PLAIN_APP, '14.0')),
      }),
    ).toBe(MIN_IOS_VERSION_SUPPORTED);
  });

  it('returns null when there is nothing usable to read', () => {
    expect(
      resolveIosDeploymentTarget({xcodeprojPath: write(NOTHING_DECLARED)}),
    ).toBeNull();
    expect(resolveIosDeploymentTarget({xcodeprojPath: null})).toBeNull();
    expect(
      resolveIosDeploymentTarget({xcodeprojPath: '/no/such/App.xcodeproj'}),
    ).toBeNull();
  });

  it('matches min_ios_version_supported in helpers.rb', () => {
    const helpers = fs.readFileSync(
      path.join(__dirname, '..', '..', 'cocoapods', 'helpers.rb'),
      'utf8',
    );
    const match = helpers.match(
      /def self\.min_ios_version_supported\s+return\s+'([\d.]+)'/,
    );
    if (match == null) {
      throw new Error(
        'could not read min_ios_version_supported from scripts/cocoapods/helpers.rb',
      );
    }
    expect(MIN_IOS_VERSION_SUPPORTED).toBe(match[1]);
  });
});
