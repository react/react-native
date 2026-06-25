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

const {TEMPLATES_FOLDER_PATH} = require('./constants');
const {
  codegenLog,
  isReactNativeCoreLibrary,
  parseiOSAnnotations,
  writeFileSyncIfChanged,
} = require('./utils');
const fs = require('fs');
const path = require('path');

const THIRD_PARTY_COMPONENTS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTThirdPartyComponentsProviderH.template',
);

const THIRD_PARTY_COMPONENTS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTThirdPartyComponentsProviderMM.template',
);

function generateRCTThirdPartyComponents(
  libraries /*: ReadonlyArray<$FlowFixMe> */,
  outputDir /*: string */,
) {
  fs.mkdirSync(outputDir, {recursive: true});
  // Generate Header File
  codegenLog('Generating RCTThirdPartyComponentsProvider.h');
  const templateH = fs.readFileSync(
    THIRD_PARTY_COMPONENTS_H_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathH = path.join(outputDir, 'RCTThirdPartyComponentsProvider.h');
  writeFileSyncIfChanged(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  codegenLog('Generating RCTThirdPartyComponentsProvider.mm');
  let componentsInLibraries /*: {[string]: Array<$FlowFixMe>} */ = {};

  const componentLibraries = libraries.filter(({config, libraryPath}) => {
    if (isReactNativeCoreLibrary(config.name) || config.type === 'modules') {
      return false;
    }
    return true;
  });

  const librariesToCrawl /*: {[string]: $FlowFixMe} */ = {};

  // Using new API explicitly or not using any config field to define components.
  const componentLibrariesUsingNewApi = [];
  const componentLibrariesUsingOldApi = [];

  for (const library of componentLibraries) {
    if (
      library.config.ios?.components ||
      !library.config.ios?.componentProvider
    ) {
      componentLibrariesUsingNewApi.push(library);
    } else {
      componentLibrariesUsingOldApi.push(library);
    }
  }

  // Old API
  componentLibrariesUsingOldApi.forEach(library => {
    const {config, libraryPath} = library;
    const libraryName = JSON.parse(
      fs.readFileSync(path.join(libraryPath, 'package.json'), 'utf8'),
    ).name;

    librariesToCrawl[libraryName] = library;

    const componentsProvider = config.ios?.componentProvider;

    delete librariesToCrawl[libraryName];
    componentsInLibraries[libraryName] =
      componentsInLibraries[libraryName] || [];

    Object.keys(componentsProvider).forEach(componentName => {
      componentsInLibraries[libraryName].push({
        componentName,
        className: componentsProvider[componentName],
      });
    });
  });

  // New API
  const iosAnnotations = parseiOSAnnotations(componentLibrariesUsingNewApi);
  for (const [libraryName, annotationMap] of Object.entries(iosAnnotations)) {
    const {library, components} = annotationMap;
    librariesToCrawl[libraryName] = library;

    for (const [componentName, annotation] of Object.entries(components)) {
      if (annotation.className) {
        delete librariesToCrawl[libraryName];

        componentsInLibraries[libraryName] =
          componentsInLibraries[libraryName] || [];
        componentsInLibraries[libraryName].push({
          componentName,
          className: annotation.className,
        });
      }
    }
  }

  Object.entries(librariesToCrawl).forEach(([libraryName, library]) => {
    const {libraryPath} = library;
    codegenLog(`Crawling ${libraryName} library for components`);
    // crawl all files and subdirectories for file with the ".mm" extension
    const files = findFilesWithExtension(libraryPath, '.mm');

    const componentsMapping = files
      .flatMap(file => findRCTComponentViewProtocolClass(file))
      .filter(Boolean);

    if (componentsMapping.length !== 0) {
      codegenLog(
        `[DEPRECATED] ${libraryName} should add the 'ios.componentProvider' property in their codegenConfig`,
        true,
      );
    }

    componentsInLibraries[libraryName] = componentsMapping;
  });

  const thirdPartyComponentsMapping = Object.keys(componentsInLibraries)
    .flatMap(library => {
      const components = componentsInLibraries[library];
      return components.map(({componentName, className}) => {
        return `\t\t@"${componentName}": NSClassFromString(@"${className}"), // ${library}`;
      });
    })
    .join('\n');
  // Generate implementation file
  const templateMM = fs
    .readFileSync(THIRD_PARTY_COMPONENTS_MM_TEMPLATE_PATH, 'utf8')
    .replace(/{thirdPartyComponentsMapping}/, thirdPartyComponentsMapping);
  const finalPathMM = path.join(
    outputDir,
    'RCTThirdPartyComponentsProvider.mm',
  );
  writeFileSyncIfChanged(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);
}

// Given a path, return the paths of all the files with extension .mm in
// the path dir and all its subdirectories.
function findFilesWithExtension(
  filePath /*: string */,
  extension /*: string */,
) /*: Array<string> */ {
  const files = [];
  const dir = fs.readdirSync(filePath);
  dir.forEach(file => {
    const absolutePath = path.join(filePath, file);
    // Exclude files provided by react-native
    if (absolutePath.includes(`${path.sep}react-native${path.sep}`)) {
      return null;
    }

    // Skip hidden files/folders (starting with `.`) but allow `.pnpm`
    // Note: Only check the filename, not the entire path, to avoid false positives
    // when the workspace itself is under a hidden folder (e.g., ~/.jenkins/)
    if (file.startsWith('.') && file !== '.pnpm') {
      return null;
    }

    if (
      fs.existsSync(absolutePath) &&
      fs.statSync(absolutePath).isDirectory()
    ) {
      files.push(...findFilesWithExtension(absolutePath, extension));
    } else if (file.endsWith(extension)) {
      files.push(absolutePath);
    }
  });
  return files;
}

// Given a filepath, read the file and look for a string that starts with 'Class<RCTComponentViewProtocol> '
// and ends with 'Cls(void)'. Return the string between the two.
function findRCTComponentViewProtocolClass(filepath /*: string */) {
  const fileContent = fs.readFileSync(filepath, 'utf8');
  const regex = /Class<RCTComponentViewProtocol> (.*)Cls\(/;
  const match = fileContent.match(regex);
  if (match) {
    const componentName = match[1];

    // split the file by \n
    // remove all the lines before the one that matches the regex above
    // find the first return statement after that that ends with .class
    // return what's between return and `.class`
    const lines = fileContent.split('\n');
    const signatureIndex = lines.findIndex(line => regex.test(line));
    const returnRegex = /return (.*)\.class/;
    const classNameMatch = String(lines.slice(signatureIndex).join('\n')).match(
      returnRegex,
    );
    if (classNameMatch) {
      const className = classNameMatch[1];
      codegenLog(`Match found ${componentName} -> ${className}`);
      return {
        componentName,
        className,
      };
    }

    console.warn(
      `Could not find class name for component ${componentName}. Register it manually`,
    );
    return null;
  }
  return null;
}

module.exports = {
  findFilesWithExtension,
  generateRCTThirdPartyComponents,
};
