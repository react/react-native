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

const XCCONFIG_REF = 'DD0000000000000000000101';
const XCCONFIG_GROUP = 'DD0000000000000000000201';

function insertIntoObject(text, uuid, line) {
  const lineEnd =
    text.indexOf('\n', text.indexOf('= {', text.indexOf(uuid + ' /*'))) + 1;
  return text.slice(0, lineEnd) + `\t\t\t${line}\n` + text.slice(lineEnd);
}

/**
 * Point the given configurations at one `.xcconfig` file reference.
 * `sourceTree` defaults to SOURCE_ROOT; pass `groupPath` to place the
 * reference in a `"<group>"` PBXGroup carrying that path instead.
 */
function withXcconfigRef(text, configUuids, opts = {}) {
  const filePath = opts.filePath ?? 'Config/App.xcconfig';
  const groupPath = opts.groupPath ?? null;
  const sourceTree =
    groupPath != null ? '"<group>"' : (opts.sourceTree ?? 'SOURCE_ROOT');
  const name = path.basename(filePath);

  let out = text;
  for (const configUuid of configUuids) {
    out = insertIntoObject(
      out,
      configUuid,
      `baseConfigurationReference = ${XCCONFIG_REF} /* ${name} */;`,
    );
  }
  out = out.replace(
    '/* End PBXFileReference section */',
    `\t\t${XCCONFIG_REF} /* ${name} */ = {
			isa = PBXFileReference;
			lastKnownFileType = text.xcconfig;
			path = ${filePath};
			sourceTree = ${sourceTree};
		};
/* End PBXFileReference section */`,
  );
  if (groupPath != null) {
    out = out.replace(
      '/* End PBXGroup section */',
      `\t\t${XCCONFIG_GROUP} /* ${groupPath} */ = {
			isa = PBXGroup;
			children = (
				${XCCONFIG_REF} /* ${name} */,
			);
			path = ${groupPath};
			sourceTree = "<group>";
		};
/* End PBXGroup section */`,
    );
  }
  return out;
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
  withXcconfigRef,
  withoutProjectSetting,
};
