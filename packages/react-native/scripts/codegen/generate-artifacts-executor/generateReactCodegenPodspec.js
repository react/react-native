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

const {
  REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  TEMPLATES_FOLDER_PATH,
  packageJson,
} = require('./constants');
const {codegenLog, writeFileSyncIfChanged} = require('./utils');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const REACT_CODEGEN_PODSPEC_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'ReactCodegen.podspec.template',
);

function generateReactCodegenPodspec(
  appPath /*: string */,
  appPkgJson /*: $FlowFixMe */,
  outputPath /*: string */,
  baseOutputPath /*: string */,
) {
  const inputFiles = getInputFiles(appPath, appPkgJson);
  const codegenScript = codegenScripts(appPath, baseOutputPath);
  const template = fs.readFileSync(REACT_CODEGEN_PODSPEC_TEMPLATE_PATH, 'utf8');
  const finalPodspec = template
    .replace(/{react-native-version}/, packageJson.version)
    .replace(/{input-files}/, inputFiles)
    .replace(/{codegen-script}/, codegenScript);
  const finalPathPodspec = path.join(outputPath, 'ReactCodegen.podspec');
  writeFileSyncIfChanged(finalPathPodspec, finalPodspec);
  codegenLog(`Generated podspec: ${finalPathPodspec}`);
}

function getInputFiles(appPath /*: string */, appPkgJson /*: $FlowFixMe */) {
  const jsSrcsDir = appPkgJson.codegenConfig?.jsSrcsDir;
  if (!jsSrcsDir) {
    return '[]';
  }

  // Normalize appPath so any "Pods/.." segment is collapsed before find runs.
  // Otherwise every find result inherits the search-root prefix containing
  // "/Pods/" and gets dropped by the exclusion filter below.
  const resolvedAppPath = path.resolve(appPath);

  const xcodeproj = String(
    execSync(`find ${resolvedAppPath} -type d -name "*.xcodeproj"`),
  )
    .trim()
    .split('\n')
    .filter(
      projectPath =>
        !projectPath.includes('/Pods/') && // exclude Pods/Pods.xcodeproj
        !projectPath.includes('/node_modules/'), // exclude all the xcodeproj in node_modules of libraries
    )[0];
  if (!xcodeproj) {
    throw new Error(
      `Cannot find .xcodeproj file inside ${resolvedAppPath}. This is required to determine codegen spec paths relative to native project.`,
    );
  }
  const jsFiles = '-name "Native*.js" -or -name "*NativeComponent.js"';
  const tsFiles = '-name "Native*.ts" -or -name "*NativeComponent.ts"';
  const findCommand = `find ${path.join(resolvedAppPath, jsSrcsDir)} -type f -not -path "*/__mocks__/*" -and \\( ${jsFiles} -or ${tsFiles} \\)`;
  const list = String(execSync(findCommand))
    .trim()
    .split('\n')
    .sort()
    .map(filepath => `"\${PODS_ROOT}/${path.relative(xcodeproj, filepath)}"`)
    .join(',\n');
  return `[${list}]`;
}

function codegenScripts(appPath /*: string */, baseOutputPath /*: string */) {
  const relativeAppPath = path.relative(baseOutputPath, appPath);
  const relativeReactNativeRootFolder = path.relative(
    baseOutputPath,
    REACT_NATIVE_PACKAGE_ROOT_FOLDER,
  );
  // Use PODFILE_DIR (set by react_native_post_install) to locate the Podfile
  // directory. PODS_ROOT/.. does not work when Pods/ is a symlink.
  return `<<-SCRIPT
if [ -n "$PODFILE_DIR" ]; then
  RCT_SCRIPT_POD_INSTALLATION_ROOT="$PODFILE_DIR"
else
  pushd "$PODS_ROOT/../" > /dev/null
  RCT_SCRIPT_POD_INSTALLATION_ROOT=$(pwd)
  popd >/dev/null
fi

export RCT_SCRIPT_RN_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${relativeReactNativeRootFolder}"
export RCT_SCRIPT_APP_PATH="$RCT_SCRIPT_POD_INSTALLATION_ROOT/${relativeAppPath.length === 0 ? '.' : relativeAppPath}"
export RCT_SCRIPT_OUTPUT_DIR="$RCT_SCRIPT_POD_INSTALLATION_ROOT"
export RCT_SCRIPT_TYPE="withCodegenDiscovery"

export SCRIPT_PHASES_SCRIPT="$RCT_SCRIPT_RN_DIR/scripts/react_native_pods_utils/script_phases.sh"
export WITH_ENVIRONMENT="$RCT_SCRIPT_RN_DIR/scripts/xcode/with-environment.sh"
/bin/sh -c '"$WITH_ENVIRONMENT" "$SCRIPT_PHASES_SCRIPT"'
SCRIPT`;
}

module.exports = {
  generateReactCodegenPodspec,
};
