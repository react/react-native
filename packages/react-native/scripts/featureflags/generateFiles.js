/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {GeneratorConfig, GeneratorOptions} from './types';

import generateAndroidModules from './generateAndroidModules';
import generateCommonCxxModules from './generateCommonCxxModules';
import generateJavaScriptModules from './generateJavaScriptModules';
import fs from 'node:fs';
import path from 'node:path';

export default function generateFiles(
  generatorConfig: GeneratorConfig,
  generatorOptions: GeneratorOptions,
): void {
  fs.mkdirSync(generatorConfig.jsPath, {recursive: true});
  fs.mkdirSync(generatorConfig.commonCxxPath, {recursive: true});
  fs.mkdirSync(generatorConfig.commonNativeModuleCxxPath, {recursive: true});
  fs.mkdirSync(generatorConfig.androidPath, {recursive: true});
  fs.mkdirSync(generatorConfig.androidJniPath, {recursive: true});

  const jsModules = generateJavaScriptModules(generatorConfig);

  const generatorConfigWithDefinitionsForNative = {
    ...generatorConfig,
    featureFlagDefinitions: {
      ...generatorConfig.featureFlagDefinitions,
      common: Object.fromEntries(
        Object.entries(generatorConfig.featureFlagDefinitions.common).filter(
          ([_, definition]) => !definition.skipNativeAPI,
        ),
      ),
    },
  };

  const commonCxxModules = generateCommonCxxModules(
    generatorConfigWithDefinitionsForNative,
  );

  const androidModules = generateAndroidModules(
    generatorConfigWithDefinitionsForNative,
  );

  const generatedFiles = {
    ...jsModules,
    ...commonCxxModules,
    ...androidModules,
  };

  if (generatorOptions.verifyUnchanged) {
    const existingModules: {[string]: string} = {};
    for (const moduleName of Object.keys(generatedFiles)) {
      const existingModule = fs.readFileSync(moduleName, 'utf8');
      existingModules[moduleName] = existingModule;
    }

    const changedFiles = [];
    for (const moduleName of Object.keys(generatedFiles)) {
      const module = generatedFiles[moduleName];
      const existingModule = existingModules[moduleName];

      if (module !== existingModule) {
        changedFiles.push(moduleName);
      }
    }

    if (changedFiles.length > 0) {
      const changedFilesStr = changedFiles
        .map(changedFile => '    ' + changedFile)
        .join('\n');

      throw new Error(
        `Detected changes in generated files for feature flags:\n${changedFilesStr}\n\n` +
          'Please rerun `yarn featureflags --update` and commit the changes.',
      );
    }

    return;
  }

  for (const [modulePath, moduleContents] of Object.entries(generatedFiles)) {
    fs.mkdirSync(path.dirname(modulePath), {recursive: true});
    fs.writeFileSync(modulePath, moduleContents, {encoding: 'utf8'});
  }
}
