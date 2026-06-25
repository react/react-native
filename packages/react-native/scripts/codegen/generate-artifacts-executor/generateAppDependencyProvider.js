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
const {TEMPLATES_FOLDER_PATH, packageJson} = require('./constants');
const {codegenLog, writeFileSyncIfChanged} = require('./utils');
const fs = require('fs');
const path = require('path');

const APP_DEPENDENCY_PROVIDER_H_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTAppDependencyProviderH.template',
);

const APP_DEPENDENCY_PROVIDER_MM_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'RCTAppDependencyProviderMM.template',
);

const APP_DEPENDENCY_PROVIDER_PODSPEC_TEMPLATE_PATH = path.join(
  TEMPLATES_FOLDER_PATH,
  'ReactAppDependencyProvider.podspec.template',
);

function generateAppDependencyProvider(outputDir /*: string */) {
  fs.mkdirSync(outputDir, {recursive: true});
  codegenLog('Generating RCTAppDependencyProvider');

  const templateH = fs.readFileSync(
    APP_DEPENDENCY_PROVIDER_H_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathH = path.join(outputDir, 'RCTAppDependencyProvider.h');
  writeFileSyncIfChanged(finalPathH, templateH);
  codegenLog(`Generated artifact: ${finalPathH}`);

  const templateMM = fs.readFileSync(
    APP_DEPENDENCY_PROVIDER_MM_TEMPLATE_PATH,
    'utf8',
  );
  const finalPathMM = path.join(outputDir, 'RCTAppDependencyProvider.mm');
  writeFileSyncIfChanged(finalPathMM, templateMM);
  codegenLog(`Generated artifact: ${finalPathMM}`);

  // Generate the podspec file
  const templatePodspec = fs
    .readFileSync(APP_DEPENDENCY_PROVIDER_PODSPEC_TEMPLATE_PATH, 'utf8')
    .replace(/{react-native-version}/, packageJson.version)
    .replace(/{react-native-licence}/, packageJson.license);
  const finalPathPodspec = path.join(
    outputDir,
    'ReactAppDependencyProvider.podspec',
  );
  writeFileSyncIfChanged(finalPathPodspec, templatePodspec);
  codegenLog(`Generated podspec: ${finalPathPodspec}`);
}

module.exports = {
  generateAppDependencyProvider,
};
