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
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const FIXTURE = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

// Fixture anchors (see __fixtures__/plain-app.pbxproj): one app target whose
// own Debug/Release configs carry no IPHONEOS_DEPLOYMENT_TARGET, and two
// project-level configs that do (15.1).
const TARGET_DEBUG = 'AA0000000000000000000901';
const TARGET_RELEASE = 'AA00000000000000000000A2';

// Insert IPHONEOS_DEPLOYMENT_TARGET into one XCBuildConfiguration.
function withSetting(text, configUuid, value) {
  const at = text.indexOf(configUuid + ' /*');
  const lineEnd = text.indexOf('\n', text.indexOf('buildSettings = {', at)) + 1;
  return (
    text.slice(0, lineEnd) +
    `\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = ${value};\n` +
    text.slice(lineEnd)
  );
}

function withProjectSetting(text, value) {
  return text.replaceAll(
    'IPHONEOS_DEPLOYMENT_TARGET = 15.1;',
    `IPHONEOS_DEPLOYMENT_TARGET = ${value};`,
  );
}

function withoutProjectSetting(text) {
  return text.replaceAll('\t\t\t\tIPHONEOS_DEPLOYMENT_TARGET = 15.1;\n', '');
}

const RAISED_TARGET = withSetting(
  withSetting(FIXTURE, TARGET_DEBUG, '16.4'),
  TARGET_RELEASE,
  '16.4',
);
// A second application target with no configurations of its own, so it inherits
// the project's 15.1 while MyApp declares 16.4 — target selection (and the
// minimum-over-targets rule) is observable.
const SECOND = 'BB0000000000000000000101';
const TWO = RAISED_TARGET.replace(
  '/* End PBXNativeTarget section */',
  `\t\t${SECOND} /* Second */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = AA0000000000000000000601 /* project configs */;
			name = Second;
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */`,
);

describe('sanitizeIosDeploymentTarget', () => {
  it.each([
    ['16', '16.0'],
    ['16.4', '16.4'],
    ['14.0', MIN_IOS_VERSION_SUPPORTED],
    ['$(FOO)', MIN_IOS_VERSION_SUPPORTED],
    ['16.4; rm -rf /', MIN_IOS_VERSION_SUPPORTED],
    ['', MIN_IOS_VERSION_SUPPORTED],
    [null, MIN_IOS_VERSION_SUPPORTED],
    [undefined, MIN_IOS_VERSION_SUPPORTED],
  ])('normalizes and clamps %p to %p', (raw, expected) => {
    expect(sanitizeIosDeploymentTarget(raw)).toBe(expected);
  });
});

const MIXED_CONFIGS = withSetting(
  withSetting(FIXTURE, TARGET_DEBUG, '17.0'),
  TARGET_RELEASE,
  '16.4',
);
const PROJECT_16_0 = withProjectSetting(FIXTURE, '16.0');
const PROJECT_BARE_16 = withProjectSetting(FIXTURE, '16');
const PROJECT_14_0 = withProjectSetting(FIXTURE, '14.0');
const PROJECT_VARIABLE = withProjectSetting(FIXTURE, '"$(SOME_VAR)"');
const NOTHING_DECLARED = withoutProjectSetting(FIXTURE);
const GONE_UUID = 'CC0000000000000000000000';

describe('readIosDeploymentTargetFromPbxproj', () => {
  it.each([
    ['project-level fallback', FIXTURE, {}, '15.1'],
    ['target-level wins', RAISED_TARGET, {}, '16.4'],
    ['minimum across configurations', MIXED_CONFIGS, {}, '16.4'],
    ['raised project-level', PROJECT_16_0, {}, '16.0'],
    ['bare major normalized', PROJECT_BARE_16, {}, '16.0'],
    ['below the minimum is not clamped here', PROJECT_14_0, {}, '14.0'],
    ['a variable reference is ignored', PROJECT_VARIABLE, {}, null],
    ['nothing declared', NOTHING_DECLARED, {}, null],
    ['minimum over every app target', TWO, {}, '15.1'],
    ['named target', TWO, {targetName: 'MyApp'}, '16.4'],
    ['unmatched targetName', TWO, {targetName: 'Nope'}, '15.1'],
    ['uuid beats name', TWO, {targetUuid: SECOND, targetName: 'MyApp'}, '15.1'],
    ['uuid that is not a target', TWO, {targetUuid: TARGET_DEBUG}, '15.1'],
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
    expect(
      resolveIosDeploymentTarget({xcodeprojPath: write(RAISED_TARGET)}),
    ).toBe('16.4');
    expect(
      resolveIosDeploymentTarget({
        xcodeprojPath: write(withProjectSetting(FIXTURE, '14.0')),
      }),
    ).toBe(MIN_IOS_VERSION_SUPPORTED);
  });

  it('returns null when there is nothing usable to read', () => {
    expect(
      resolveIosDeploymentTarget({
        xcodeprojPath: write(withoutProjectSetting(FIXTURE)),
      }),
    ).toBeNull();
    expect(resolveIosDeploymentTarget({xcodeprojPath: null})).toBeNull();
    expect(
      resolveIosDeploymentTarget({xcodeprojPath: '/no/such/App.xcodeproj'}),
    ).toBeNull();
  });

  it('matches min_ios_version_supported in helpers.rb', () => {
    expect(MIN_IOS_VERSION_SUPPORTED).toBe('15.1');
  });
});
