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

// Variants of the plain-app pbxproj fixture, shared by the tests that exercise
// iOS-deployment-target reading. The base fixture has one app target whose own
// Debug/Release configs carry no IPHONEOS_DEPLOYMENT_TARGET, and two
// project-level configs that set 15.1.

const fs = require('node:fs');
const path = require('node:path');

const PLAIN_APP = fs.readFileSync(
  path.join(__dirname, '__fixtures__', 'plain-app.pbxproj'),
  'utf8',
);

const TARGET_DEBUG = 'AA0000000000000000000901';
const TARGET_RELEASE = 'AA00000000000000000000A2';
const SECOND_TARGET = 'BB0000000000000000000101';

/** Insert IPHONEOS_DEPLOYMENT_TARGET into one XCBuildConfiguration. */
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

/** The single app target declaring `version` in both its configurations. */
function raisedTarget(version) {
  return withSetting(
    withSetting(PLAIN_APP, TARGET_DEBUG, version),
    TARGET_RELEASE,
    version,
  );
}

/**
 * Two app targets: MyApp declares `version`, while Second has no configurations
 * of its own and inherits the project's 15.1 — so target selection and the
 * minimum-over-targets rule are both observable.
 */
function twoAppTargets(version) {
  return raisedTarget(version).replace(
    '/* End PBXNativeTarget section */',
    `\t\t${SECOND_TARGET} /* Second */ = {
			isa = PBXNativeTarget;
			buildConfigurationList = AA0000000000000000000601 /* project configs */;
			name = Second;
			productType = "com.apple.product-type.application";
		};
/* End PBXNativeTarget section */`,
  );
}

module.exports = {
  PLAIN_APP,
  SECOND_TARGET,
  TARGET_DEBUG,
  TARGET_RELEASE,
  raisedTarget,
  twoAppTargets,
  withProjectSetting,
  withSetting,
  withoutProjectSetting,
};
