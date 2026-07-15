/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/*:: import type {BuildFlavor} from './types'; */

const {
  generateFBReactNativeSpecIOS,
} = require('../codegen/generate-artifacts-executor/generateFBReactNativeSpecIOS');
const utils = require('./utils');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');

const {execSync, execFileSync} = childProcess;
const {createLogger} = utils;

const frameworkLog = createLogger('XCFramework');

function buildXCFrameworks(
  rootFolder /*: string */,
  buildFolder /*: string */,
  frameworkFolders /*: Array<string> */,
  buildType /*: BuildFlavor */,
  identity /*: ?string */,
) {
  // Let's run codegen for FBReactNativeSpec otherwise some headers will be missing
  generateFBReactNativeSpecIOS('.');

  const outputPath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'React.xcframework',
  );
  // Delete any previous output
  try {
    fs.rmSync(outputPath, {recursive: true, force: true});
  } catch (error) {
    frameworkLog(
      `Error deleting folder: ${outputPath}. Check if the folder exists.`,
      'error',
    );
    return;
  }

  // Build the XCFrameworks by using each framework folder as input
  const frameworks = frameworkFolders
    .map(frameworkFolder => {
      return `-framework "${frameworkFolder}"`;
    })
    .join(' ');

  const buildCommand = `xcodebuild -create-xcframework ${frameworks} -output ${outputPath} -allow-internal-distribution`;

  frameworkLog(buildCommand);
  try {
    execSync(buildCommand, {
      cwd: rootFolder,
      stdio: 'inherit',
    });
  } catch (error) {
    frameworkLog(
      `Error building XCFramework: ${error.message}. Check if the build was successful.`,
      'error',
    );
    return;
  }

  // Copy Symbols to symbols folder
  copySymbols(outputPath, frameworkFolders);

  // Emit the headers-spec layout into every slice's React.framework and build
  // the ReactNativeHeaders headers-only xcframework beside it. This is the only
  // header surface consumers compile against — no root Headers/, no clang VFS
  // overlay. MUST run before signing (spec R7: the signature pins the manifest).
  const {
    buildReactNativeHeadersXcframework,
    computeSpecPlan,
    emitReactFrameworkHeaders,
  } = require('./headers-compose');
  const plan = computeSpecPlan(rootFolder);
  emitReactFrameworkHeaders(outputPath, plan, rootFolder);
  // ReactNativeHeaders is PURE-RN — the third-party deps namespaces ship in
  // the ReactNativeDependenciesHeaders sidecar built by the deps prebuild
  // (scripts/releases/ios-prebuild), so the core compose no longer needs the
  // deps artifact's headers.
  // NOTE: Hermes public headers (`<hermes/...>`) are folded into
  // ReactNativeHeaders on the consumer side by ensureHeadersLayout. When this
  // publish path is productionized, pass the prebuild's hermes destroot/include
  // as the 5th arg so the PUBLISHED ReactNativeHeaders carries hermes too.
  const headersXcfw = buildReactNativeHeadersXcframework(
    path.dirname(outputPath),
    plan,
    rootFolder,
    true, // include the mac-catalyst slice in the real compose
  );

  if (identity) {
    signXCFramework(identity, outputPath);
    signXCFramework(identity, headersXcfw);
  }

  // Tar the output folder to a .tar.gz file
  const tarFilePath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'React.xcframework.tar.gz',
  );
  frameworkLog('Creating tar file: ' + tarFilePath);
  try {
    // Ship ReactNativeHeaders.xcframework alongside React.xcframework in the
    // reactnative-core artifact so the React-Core-prebuilt pod can vend both
    // (React.framework -> <React/...>, ReactNativeHeaders -> every other
    // namespace). The headers-only xcframework is a sibling of React.xcframework.
    execFileSync(
      'tar',
      [
        '-czf',
        tarFilePath,
        '-C',
        path.dirname(outputPath),
        'React.xcframework',
        path.basename(headersXcfw),
      ],
      {stdio: 'inherit'},
    );
  } catch (error) {
    frameworkLog(
      `Error creating tar file: ${error.message}. Check if the tar command is available.`,
      'warning',
    );
  }

  // Publish ReactNativeHeaders alongside React.
  const headersTarPath = path.join(
    buildFolder,
    'output',
    'xcframeworks',
    buildType,
    'ReactNativeHeaders.xcframework.tar.gz',
  );
  frameworkLog('Creating tar file: ' + headersTarPath);
  try {
    execFileSync(
      'tar',
      [
        '-czf',
        headersTarPath,
        '-C',
        path.dirname(headersXcfw),
        'ReactNativeHeaders.xcframework',
      ],
      {stdio: 'inherit'},
    );
  } catch (error) {
    frameworkLog(
      `Error creating ReactNativeHeaders tar: ${error.message}`,
      'warning',
    );
  }
}

function copySymbols(
  outputPath /*:string*/,
  frameworkFolders /*:Array<string>*/,
) {
  frameworkLog('Copying symbols to symbols folder...');
  const targetArchFolders = fs
    .readdirSync(outputPath)
    .map(p => path.join(outputPath, p))
    .filter(folder => {
      return (
        fs.statSync(folder).isDirectory() &&
        !folder.endsWith('Headers') &&
        !folder.endsWith('Modules')
      );
    });

  const symbolOutput = path.join(outputPath, '..', 'Symbols');
  frameworkFolders.forEach(frameworkFolder => {
    // Get archs for current symbol slice
    const frameworkPlatforms = getArchsFromFramework(
      path.join(frameworkFolder, 'React'),
    );
    if (frameworkPlatforms) {
      const targetFolder = targetArchFolders.find(
        targetArchFolder =>
          getArchsFromFramework(
            path.join(targetArchFolder, 'React.framework', 'React'),
          ) === frameworkPlatforms,
      );
      if (!targetFolder) {
        frameworkLog(
          `No target folder found for symbol slice: ${frameworkFolder}`,
          'error',
        );
        return;
      }
      const targetSymbolPath = path.join(
        symbolOutput,
        path.basename(targetFolder),
      );
      const sourceSymbolPath = path.join(
        frameworkFolder,
        '..',
        '..',
        'React.framework.dSYM',
      );
      console.log(
        `  ${path.relative(outputPath, sourceSymbolPath)} → ${path.basename(targetFolder)}`,
      );
      fs.mkdirSync(targetSymbolPath, {recursive: true});
      execSync(`cp -r ${sourceSymbolPath} ${targetSymbolPath}`);
    }
  });
}

function getArchsFromFramework(frameworkPath /*:string*/) {
  try {
    return execSync(`vtool -show-build ${frameworkPath}|grep platform`)
      .toString()
      .split('\n')
      .map(p => p.trim().split(' ')[1])
      .sort((a, b) => a.localeCompare(b))
      .join(' ');
  } catch (error) {
    return '';
  }
}

function signXCFramework(
  identity /*: string */,
  xcframeworkPath /*: string */,
) {
  frameworkLog('Signing XCFramework...');
  const command = `codesign --timestamp --sign "${identity}" ${xcframeworkPath}`;
  execSync(command, {stdio: 'inherit'});
}

module.exports = {
  buildXCFrameworks,
};
