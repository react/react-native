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
const {parseiOSAnnotations, writeFileSyncIfChanged} = require('./utils');
const fs = require('fs');
const path = require('path');

const UNSTABLE_MODULES_REQUIRING_MAIN_QUEUE_SETUP_PROVIDER_H_TEMPLATE_PATH =
  path.join(
    TEMPLATES_FOLDER_PATH,
    'RCTUnstableModulesRequiringMainQueueSetupProviderH.template',
  );

const UNSTABLE_MODULES_REQUIRING_MAIN_QUEUE_SETUP_PROVIDER_MM_TEMPLATE_PATH =
  path.join(
    TEMPLATES_FOLDER_PATH,
    'RCTUnstableModulesRequiringMainQueueSetupProviderMM.template',
  );

function generateUnstableModulesRequiringMainQueueSetupProvider(
  libraries /*: ReadonlyArray<$FlowFixMe> */,
  outputDir /*: string */,
) {
  const iosAnnotations = parseiOSAnnotations(libraries);

  const modulesRequiringMainQueueSetup = new Set /*::<string>*/();

  // Old API
  libraries.forEach(library => {
    const {unstableModulesRequiringMainQueueSetup} = library?.config?.ios || {};
    if (!unstableModulesRequiringMainQueueSetup) {
      return;
    }

    for (const moduleName of unstableModulesRequiringMainQueueSetup) {
      modulesRequiringMainQueueSetup.add(moduleName);
    }
  });

  // New API
  for (const {modules: moduleAnnotationMap} of Object.values(iosAnnotations)) {
    for (const [moduleName, annotation] of Object.entries(
      moduleAnnotationMap,
    )) {
      if (annotation.unstableRequiresMainQueueSetup) {
        modulesRequiringMainQueueSetup.add(moduleName);
      }
    }
  }

  const modulesStr = Array.from(modulesRequiringMainQueueSetup)
    .map(className => `@"${className}"`)
    .join(',\n\t\t');

  const template = fs.readFileSync(
    UNSTABLE_MODULES_REQUIRING_MAIN_QUEUE_SETUP_PROVIDER_MM_TEMPLATE_PATH,
    'utf8',
  );
  const finalMMFile = template.replace(/{modules}/, modulesStr);

  fs.mkdirSync(outputDir, {recursive: true});

  writeFileSyncIfChanged(
    path.join(
      outputDir,
      'RCTUnstableModulesRequiringMainQueueSetupProvider.mm',
    ),
    finalMMFile,
  );

  const templateH = fs.readFileSync(
    UNSTABLE_MODULES_REQUIRING_MAIN_QUEUE_SETUP_PROVIDER_H_TEMPLATE_PATH,
    'utf8',
  );
  writeFileSyncIfChanged(
    path.join(outputDir, 'RCTUnstableModulesRequiringMainQueueSetupProvider.h'),
    templateH,
  );
}

module.exports = {
  generateUnstableModulesRequiringMainQueueSetupProvider,
};
