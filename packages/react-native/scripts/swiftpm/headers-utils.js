/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const {reactCommonMappings} = require('./headers-mappings');
const {listHeadersInFolder, setupSymlink} = require('./utils');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Helper function to create symlinks from a source path
 * @param {string} sourcePath - Source directory to search for headers
 * @param {string} outputPath - Default output directory for symlinks
 * @param {boolean} preserveStructure - Whether to preserve directory structure
 * @param {Array<string>} excludeFolders - Folder names to exclude
 * @returns {number} Number of symlinks created
 */
function symlinkHeadersFromPath(
  sourcePath /*: string */,
  outputPath /*: string */,
  preserveStructure /*: boolean */,
  excludeFolders /*: Array<string> */,
) /*: number */ {
  let linkedCount = 0;

  try {
    // Build find command with exclusions using -prune
    const headerFiles = listHeadersInFolder(sourcePath, excludeFolders);
    headerFiles.forEach(sourceHeaderPath => {
      if (fs.existsSync(sourceHeaderPath)) {
        const relativePath = path.relative(sourcePath, sourceHeaderPath);
        let destPath = '';
        let mappedOutputPath = outputPath;

        if (preserveStructure) {
          // Preserve directory structure
          destPath = path.join(mappedOutputPath, relativePath);
        } else {
          // Flatten structure - just use the header filename
          const headerName = path.basename(sourceHeaderPath);
          destPath = path.join(mappedOutputPath, headerName);
        }

        // Create destination directory if it doesn't exist
        setupSymlink(sourceHeaderPath, destPath);
        linkedCount++;
      }
    });
  } catch (error) {
    console.warn(
      `Failed to process headers from ${sourcePath}:`,
      error.message,
    );
  }

  return linkedCount;
}

/**
 * Create symlinks for ReactApple headers with special path logic.
 * ReactApple has a custom structure, which is:
 *
 * ReactApple
 * ├── Libraries
 * │   └── RCTFoundation
 * │       ├── RCTDeprecation
 * │       │   ├── BUCK
 * │       │   ├── Exported
 * │       │   │   └── RCTDeprecation.h
 * │       │   ├── RCTDeprecation.m
 * │       │   ├── RCTDeprecation.podspec
 * │       │   └── README.md
 * │       └── README.md
 * └── README.md
 *
 * We need to create symlinks for the headers in the "Exported" folder to
 * the headersOutput/<parent-of-Exported> folder.
 * @param {string} reactApplePath - Path to ReactApple directory
 * @param {string} headersOutput - Base headers output directory
 * @returns {number} Number of symlinks created
 */
function symlinkReactAppleHeaders(
  reactApplePath /*: string */,
  headersOutput /*: string */,
) /*: number */ {
  let linkedCount = 0;

  const mappings /*: {[string]: string } */ = {};
  mappings[
    `${reactApplePath}/Libraries/RCTFoundation/RCTDeprecation/Exported`
  ] = `${headersOutput}/RCTDeprecation`;

  // Iterate over the key-value pairs of the mappings object
  for (const [sourceDir, destDir] of Object.entries(mappings)) {
    const headerFiles = listHeadersInFolder(sourceDir, ['tests']);
    headerFiles.forEach(sourceHeaderPath => {
      const destFilePath = path.join(destDir, path.basename(sourceHeaderPath));
      setupSymlink(sourceHeaderPath, destFilePath);
      linkedCount++;
    });
  }

  return linkedCount;
}

/**
 * Create symlinks for ReactCommon headers with conditional path logic
 * The proper way to map ReactCommon headers is a bit complicated, because we it collects
 * packages that needs linking in various ways:
 * - Headers in the react/renderer subpath needs to be mapped to React folder
 * - Platform specific code in
 * react/renderer/components/<component>/platform/ios/react/renderer/components/<component>/<headers>
 * needs to be flattened to react/renderer/components/<component>/<headers>.
 * - Some headers related to TurboModules needs to be mapped to ReactCommon
 * - Some modules in specific folders, such as oscompat, needs to be mapped to their parent folder.
 * - Yoga structure which is ReactCommon/yoga/yoga/<public-headers> need to be flattened to just yoga/<public-headers>.
 *
 * This function implement the basic logic of scanning the ReactCommon folder and proceed with the mapping
 * by following the rules above. It can also be customized by passing an array of path that needs to be flattened
 * and a map of special mapping objects.
 * @param {string} reactCommonPath - Path to ReactCommon directory
 * @param {string} headersOutput - Base headers output directory
 * @returns {number} Number of symlinks created
 */
function symlinkReactCommonHeaders(
  reactCommonPath /*: string */,
  headersOutput /*: string */,
) /*: number */ {
  let linkedCount = 0;
  const mappings = reactCommonMappings(reactCommonPath, headersOutput);

  // Iterate over the key-value pairs of the mappings object
  for (const [sourceDir, options] of Object.entries(mappings)) {
    const headerFiles = listHeadersInFolder(sourceDir, options.excludeFolders);
    headerFiles.forEach(sourceHeaderPath => {
      const relativePath = path.relative(sourceDir, sourceHeaderPath);
      let destPath = '';
      let mappedOutputPath = options.destination;

      if (options.preserveStructure) {
        // Preserve directory structure
        destPath = path.join(mappedOutputPath, relativePath);
      } else {
        // Flatten structure - just use the header filename
        const headerName = path.basename(sourceHeaderPath);
        destPath = path.join(mappedOutputPath, headerName);
      }

      setupSymlink(sourceHeaderPath, destPath);
      linkedCount++;
    });
  }

  return linkedCount;
}

/**
 * Create symlinks for third-party dependencies headers in the output folder
 * @param {string} reactNativePath - Path to the React Native directory
 * @param {string} outputFolder - Path to the output folder
 * @param {string} folderName - Name of the folder where headers will be created (default: 'headers')
 * @returns {number} Number of symlinks created
 */
function symlinkThirdPartyDependenciesHeaders(
  reactNativePath /*: string */,
  outputFolder /*: string */,
  folderName /*: string */ = 'headers',
) /*: number */ {
  console.log('Creating symlinks for Third-Party Dependencies headers...');

  // Look for ReactNativeDependencies.xcframework/Headers folder specifically
  const thirdPartyHeadersPath = path.join(
    reactNativePath,
    'third-party',
    'ReactNativeDependencies.xcframework',
    'Headers',
  );

  if (!fs.existsSync(thirdPartyHeadersPath)) {
    console.warn(
      `Third-party dependencies headers path does not exist: ${thirdPartyHeadersPath}`,
    );
    return 0;
  }

  const headersOutput = path.join(outputFolder, folderName);
  let linkedCount = 0;

  // No custom mappings needed for third-party dependencies
  const headerFiles = listHeadersInFolder(thirdPartyHeadersPath, ['tests']);
  headerFiles.forEach(sourceHeaderPath => {
    if (fs.existsSync(sourceHeaderPath)) {
      // Calculate relative path from Headers base to preserve structure
      const relativePath = path.relative(
        thirdPartyHeadersPath,
        sourceHeaderPath,
      );
      const destPath = path.join(headersOutput, relativePath);

      setupSymlink(sourceHeaderPath, destPath);
      linkedCount++;
    }
  });

  console.log(
    `Created symlinks for ${linkedCount} Third-Party Dependencies headers with preserved directory structure`,
  );
  return linkedCount;
}

/**
 * Create symlinks for Codegen headers in the output folder
 */
function symlinkCodegenHeaders(
  reactNativePath /*: string */,
  iosAppPath /*: string */,
  outputFolder /*: string */,
) /*: number */ {
  console.log('Creating symlinks for Codegen headers...');

  // Look for ReactCodegen folder specifically
  const reactCodegenPath = path.join(
    iosAppPath,
    'build',
    'generated',
    'ios',
    'ReactCodegen',
  );

  if (!fs.existsSync(reactCodegenPath)) {
    console.warn(`ReactCodegen path does not exist: ${reactCodegenPath}`);
    return 0;
  }

  const headersOutput = path.join(outputFolder, 'headers');
  const reactCodegenHeadersOutput = path.join(headersOutput, 'ReactCodegen');
  let linkedCount = 0;

  // No custom mappings needed for codegen headers
  const headerFiles = listHeadersInFolder(reactCodegenPath, [
    'headers',
    'tests',
  ]);
  headerFiles.forEach(sourcePath => {
    if (fs.existsSync(sourcePath)) {
      // Calculate relative path from ReactCodegen base
      const relativePath = path.relative(reactCodegenPath, sourcePath);

      let destPath /*: string */ = '';

      // If relative path contains no subpath (just a filename), put it in ReactCodegen folder
      if (path.dirname(relativePath) === '.') {
        destPath = path.join(reactCodegenHeadersOutput, relativePath);
      } else {
        // Otherwise, preserve the structure under headers/
        destPath = path.join(headersOutput, relativePath);
      }

      setupSymlink(sourcePath, destPath);
      linkedCount++;
    }
  });

  console.log(
    `Created symlinks for ${linkedCount} Codegen headers with conditional directory structure`,
  );
  return linkedCount;
}

module.exports = {
  symlinkHeadersFromPath,
  symlinkReactAppleHeaders,
  symlinkReactCommonHeaders,
  symlinkThirdPartyDependenciesHeaders,
  symlinkCodegenHeaders,
};
