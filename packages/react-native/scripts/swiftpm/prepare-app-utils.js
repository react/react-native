/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const codegenExecutor = require('../codegen/generate-artifacts-executor');
const {symlinkThirdPartyDependenciesHeaders} = require('./headers-utils');
const {
  prepareAppDependenciesHeaders,
  symlinkReactNativeHeaders,
} = require('./prepare-app-dependencies-headers');
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Find the directory containing the Xcode project within the app path
 * @param {string} appPath - The root app path to search in
 * @param {string} xcodeProjectName - The name of the Xcode project file (e.g., 'HelloWorld.xcodeproj')
 * @returns {string} - The path to the directory containing the Xcode project
 */
function findXcodeProjectDirectory(
  appPath /*: string */,
  xcodeProjectName /*: string */,
) /*: string */ {
  try {
    // Use find command to search for the Xcode project
    const findCommand = `find "${appPath}" -name "${xcodeProjectName}" -type d -print`;
    const result = execSync(findCommand, {encoding: 'utf8'}).trim();

    if (!result) {
      throw new Error(
        `Xcode project '${xcodeProjectName}' not found in '${appPath}' or its subdirectories`,
      );
    }

    // Return the directory containing the Xcode project (parent of the .xcodeproj file)
    return path.dirname(result);
  } catch (error) {
    throw new Error(
      `Failed to find Xcode project '${xcodeProjectName}': ${error.message}`,
    );
  }
}
/**
 * Run pod deintegrate from app directory
 */
async function runPodDeintegrate(
  appIosPath /*: string */,
) /*: Promise<void> */ {
  try {
    console.log(`Running pod deintegrate in: ${appIosPath}`);
    execSync('pod deintegrate', {
      cwd: appIosPath,
      stdio: 'inherit',
    });
    console.log('✓ Pod deintegrate completed');
  } catch (error) {
    console.warn(
      '⚠️  Pod deintegrate failed (this might be expected if no Podfile.lock exists)',
    );
  }
}

/**
 * Run iOS prebuild with environment variables
 */
async function runIosPrebuild(
  reactNativePath /*: string */,
) /*: Promise<void> */ {
  console.log('Running iOS prebuild with prebuilt versions...');

  const env = {
    ...process.env,
    RN_DEP_VERSION: 'nightly',
    HERMES_VERSION: 'latest-v1',
  };

  try {
    execSync('node scripts/ios-prebuild -s', {
      cwd: reactNativePath,
      env: env,
      stdio: 'inherit',
    });
    console.log('✓ iOS prebuild completed');
  } catch (error) {
    throw new Error(`iOS prebuild failed: ${error.message}`);
  }
}

/**
 * Configure app for Swift integration
 */
async function configureAppForSwift(
  reactNativePath /*: string */,
) /*: Promise<void> */ {
  try {
    console.log('Configuring app for Swift integration...');

    // 1. Create hardlink from React-umbrella.h to React-umbrella.h
    const sourceUmbrellaPath = path.join(
      reactNativePath,
      'scripts',
      'ios-prebuild',
      'React-umbrella.h',
    );
    const reactIncludesReactPath = path.join(
      reactNativePath,
      'React',
      'includes',
      'React',
    );
    const destUmbrellaPath = path.join(
      reactIncludesReactPath,
      'React-umbrella.h',
    );

    // Ensure the React/includes/React directory exists
    if (!fs.existsSync(reactIncludesReactPath)) {
      fs.mkdirSync(reactIncludesReactPath, {recursive: true});
    }

    // Remove existing hardlink if it exists
    if (fs.existsSync(destUmbrellaPath)) {
      fs.unlinkSync(destUmbrellaPath);
    }

    // Create hardlink for umbrella header
    if (fs.existsSync(sourceUmbrellaPath)) {
      fs.symlinkSync(sourceUmbrellaPath, destUmbrellaPath);
      console.log(
        `✓ Created hardlink: React-umbrella.h -> ${path.relative(
          reactNativePath,
          sourceUmbrellaPath,
        )}`,
      );
    } else {
      throw new Error(
        `Source umbrella header not found: ${sourceUmbrellaPath}`,
      );
    }

    // 2. Generate module.modulemap file
    const reactIncludesPath = path.join(reactNativePath, 'React', 'includes');
    const moduleMapPath = path.join(reactIncludesPath, 'module.modulemap');
    const absoluteUmbrellaPath = path.join(
      reactNativePath,
      'React',
      'includes',
      'React',
      'React-umbrella.h',
    );
    const moduleMapContent = `framework module React {
  umbrella header "${absoluteUmbrellaPath}"
  export *
  module * { export * }
}
`;

    fs.writeFileSync(moduleMapPath, moduleMapContent, 'utf8');
    console.log('✓ Generated module.modulemap file');

    console.log('✓ App configured for Swift integration');
  } catch (error) {
    throw new Error(`Swift configuration failed: ${error.message}`);
  }
}

/**
 * Set BUILD_FROM_SOURCE to true in Package.swift
 */
async function setBuildFromSource(
  reactNativePath /*: string */,
) /*: Promise<void> */ {
  const packageSwiftPath = path.join(reactNativePath, 'Package.swift');

  if (!fs.existsSync(packageSwiftPath)) {
    throw new Error(`Package.swift not found at: ${packageSwiftPath}`);
  }

  try {
    console.log(`Updating BUILD_FROM_SOURCE in: ${packageSwiftPath}`);

    const content = fs.readFileSync(packageSwiftPath, 'utf8');

    // Check if BUILD_FROM_SOURCE = false exists and replace it with true
    if (content.includes('let BUILD_FROM_SOURCE = false')) {
      const updatedContent = content.replace(
        /let BUILD_FROM_SOURCE = false/g,
        'let BUILD_FROM_SOURCE = true',
      );
      fs.writeFileSync(packageSwiftPath, updatedContent, 'utf8');
      console.log('✓ BUILD_FROM_SOURCE set to true in Package.swift');
    } else if (content.includes('let BUILD_FROM_SOURCE = true')) {
      console.log(
        '✓ BUILD_FROM_SOURCE is already set to true in Package.swift',
      );
    } else {
      console.warn(
        '⚠️  BUILD_FROM_SOURCE declaration not found in Package.swift',
      );
    }
  } catch (error) {
    throw new Error(
      `Failed to update BUILD_FROM_SOURCE in Package.swift: ${error.message}`,
    );
  }
}

/**
 * Create hard links for React Native headers in React/includes
 */
async function createHardlinks(
  reactNativePath /*: string */,
) /*: Promise<void> */ {
  try {
    console.log('Creating hard links for React Native headers...');
    const reactIncludesPath = path.join(reactNativePath, 'React');
    symlinkReactNativeHeaders(reactNativePath, reactIncludesPath, 'includes');
    console.log('✓ React Native hard links created in React/includes');

    console.log('Creating hard links for third-party dependencies...');
    symlinkThirdPartyDependenciesHeaders(
      reactNativePath,
      reactIncludesPath,
      'includes',
    );
    console.log(
      '✓ Third-party dependencies hard links created in React/includes',
    );
  } catch (error) {
    throw new Error(`Hard link creation failed: ${error.message}`);
  }
}

/**
 * Generate codegen artifacts using the executor
 */
async function generateCodegenArtifacts(
  reactNativePath /*: string */,
  appPath /*: string */,
  appIosPath /*: string */,
) /*: Promise<void> */ {
  try {
    console.log('Generating codegen artifacts...');

    // Use the codegen executor directly
    codegenExecutor.execute(appPath, 'ios', appIosPath, 'app');

    console.log('✓ Codegen artifacts generated');
  } catch (error) {
    throw new Error(`Codegen generation failed: ${error.message}`);
  }
}

/**
 * Prepare app dependencies headers (3 separate calls)
 */
async function prepareHeaders(
  reactNativePath /*: string */,
  appIosPath /*: string */,
) /*: Promise<void> */ {
  const outputFolder = path.join(
    appIosPath,
    'build',
    'generated',
    'ios',
    'ReactAppDependencyProvider',
  );
  const codegenOutputFolder = path.join(
    appIosPath,
    'build',
    'generated',
    'ios',
    'ReactCodegen',
  );

  try {
    // 1. Prepare codegen headers
    console.log('Preparing codegen headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      outputFolder,
      'codegen',
    );
    console.log('✓ Codegen headers prepared');

    // 2. Prepare react-native headers
    console.log('Preparing react-native headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      codegenOutputFolder,
      'react-native',
    );
    console.log('✓ React Native headers prepared');

    // 3. Prepare third-party dependencies headers
    console.log('Preparing third-party dependencies headers...');
    prepareAppDependenciesHeaders(
      reactNativePath,
      appIosPath,
      codegenOutputFolder,
      'third-party-dependencies',
    );
    console.log('✓ Third-party dependencies headers prepared');
  } catch (error) {
    throw new Error(`Header preparation failed: ${error.message}`);
  }
}

module.exports = {
  findXcodeProjectDirectory,
  runPodDeintegrate,
  runIosPrebuild,
  configureAppForSwift,
  setBuildFromSource,
  createHardlinks,
  generateCodegenArtifacts,
  prepareHeaders,
};
