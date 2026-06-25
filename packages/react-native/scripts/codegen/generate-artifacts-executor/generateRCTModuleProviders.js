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

const MODULE_PROVIDERS_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModuleProvidersH.template',
);

const MODULE_PROVIDERS_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTModuleProvidersMM.template',
);

function generateRCTModuleProviders(
  projectRoot /*: string */,
  pkgJson /*: $FlowFixMe */,
  libraries /*: ReadonlyArray<$FlowFixMe> */,
  outputDir /*: string */,
) {
  fs.mkdirSync(outputDir, {recursive: true});
  // Generate Header File
  codegenLog('Generating RCTModulesProvider.h');
  const templateH = fs.readFileSync(MODULE_PROVIDERS_H_TEMPLATE_PATH, 'utf8');
  const finalPathH = path.join(outputDir, 'RCTModuleProviders.h');
  writeFileSyncIfChanged(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  codegenLog('Generating RCTModuleProviders.mm');
  let modulesInLibraries /*: {[string]: Array<$FlowFixMe>} */ = {};

  let app = pkgJson.codegenConfig
    ? {config: pkgJson.codegenConfig, libraryPath: projectRoot}
    : null;

  const moduleLibraries = libraries
    .concat(app)
    .filter(Boolean)
    .filter(({config, libraryPath}) => {
      if (
        isReactNativeCoreLibrary(config.name) ||
        config.type === 'components'
      ) {
        return false;
      }
      return true;
    });

  // Old API
  moduleLibraries.forEach(({config, libraryPath}) => {
    const libraryName = JSON.parse(
      fs.readFileSync(path.join(libraryPath, 'package.json'), 'utf8'),
    ).name;

    if (config.ios?.modulesProvider) {
      modulesInLibraries[libraryName] = Object.keys(
        config.ios?.modulesProvider,
      ).map(moduleName => {
        return {
          moduleName,
          className: config.ios?.modulesProvider[moduleName],
        };
      });
    }
  });

  // New API
  const iosAnnotations = parseiOSAnnotations(moduleLibraries);
  for (const [libraryName, {modules: moduleAnnotationMap}] of Object.entries(
    iosAnnotations,
  )) {
    for (const [moduleName, annotation] of Object.entries(
      moduleAnnotationMap,
    )) {
      if (annotation.className) {
        modulesInLibraries[libraryName] = modulesInLibraries[libraryName] || [];
        modulesInLibraries[libraryName].push({
          moduleName,
          className: annotation.className,
        });
      }
    }
  }

  const modulesMapping = Object.keys(modulesInLibraries)
    .flatMap(library => {
      const modules = modulesInLibraries[library];
      return modules.map(({moduleName, className}) => {
        return `\t\t@"${moduleName}": @"${className}", // ${library}`;
      });
    })
    .join('\n');

  // Generate implementation file
  const templateMM = fs
    .readFileSync(MODULE_PROVIDERS_MM_TEMPLATE_PATH, 'utf8')
    .replace(/{moduleMapping}/, modulesMapping);
  const finalPathMM = path.join(outputDir, 'RCTModuleProviders.mm');
  writeFileSyncIfChanged(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);
}

module.exports = {
  generateRCTModuleProviders,
};
