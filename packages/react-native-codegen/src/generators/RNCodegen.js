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

import type {SchemaType} from '../CodegenSchema';

const schemaValidator = require('../SchemaValidator.js');
const generateComponentDescriptorCpp = require('./components/GenerateComponentDescriptorCpp.js');
const generateComponentDescriptorH = require('./components/GenerateComponentDescriptorH.js');
const generateComponentHObjCpp = require('./components/GenerateComponentHObjCpp.js');
const generateEventEmitterCpp = require('./components/GenerateEventEmitterCpp.js');
const generateEventEmitterH = require('./components/GenerateEventEmitterH.js');
const generatePropsCpp = require('./components/GeneratePropsCpp.js');
const generatePropsH = require('./components/GeneratePropsH.js');
const generatePropsJavaDelegate = require('./components/GeneratePropsJavaDelegate.js');
const generatePropsJavaInterface = require('./components/GeneratePropsJavaInterface.js');
const generateShadowNodeCpp = require('./components/GenerateShadowNodeCpp.js');
const generateShadowNodeH = require('./components/GenerateShadowNodeH.js');
const generateStateCpp = require('./components/GenerateStateCpp.js');
const generateStateH = require('./components/GenerateStateH.js');
const generateTests = require('./components/GenerateTests.js');
const generateThirdPartyFabricComponentsProviderH = require('./components/GenerateThirdPartyFabricComponentsProviderH.js');
const generateThirdPartyFabricComponentsProviderObjCpp = require('./components/GenerateThirdPartyFabricComponentsProviderObjCpp.js');
const generateViewConfigJs = require('./components/GenerateViewConfigJs.js');
const generateModuleH = require('./modules/GenerateModuleH.js');
const generateModuleJavaSpec = require('./modules/GenerateModuleJavaSpec.js');
const generateModuleJniCpp = require('./modules/GenerateModuleJniCpp.js');
const generateModuleJniH = require('./modules/GenerateModuleJniH.js');
const generateModuleObjCpp = require('./modules/GenerateModuleObjCpp');
const fs = require('fs');
const path = require('path');

const ALL_GENERATORS = {
  generateComponentDescriptorH: generateComponentDescriptorH.generate,
  generateComponentDescriptorCpp: generateComponentDescriptorCpp.generate,
  generateComponentHObjCpp: generateComponentHObjCpp.generate,
  generateEventEmitterCpp: generateEventEmitterCpp.generate,
  generateEventEmitterH: generateEventEmitterH.generate,
  generatePropsCpp: generatePropsCpp.generate,
  generatePropsH: generatePropsH.generate,
  generateStateCpp: generateStateCpp.generate,
  generateStateH: generateStateH.generate,
  generateModuleH: generateModuleH.generate,
  generateModuleObjCpp: generateModuleObjCpp.generate,
  generateModuleJavaSpec: generateModuleJavaSpec.generate,
  generateModuleJniCpp: generateModuleJniCpp.generate,
  generateModuleJniH: generateModuleJniH.generate,
  generatePropsJavaInterface: generatePropsJavaInterface.generate,
  generatePropsJavaDelegate: generatePropsJavaDelegate.generate,
  generateTests: generateTests.generate,
  generateShadowNodeCpp: generateShadowNodeCpp.generate,
  generateShadowNodeH: generateShadowNodeH.generate,
  generateThirdPartyFabricComponentsProviderObjCpp:
    generateThirdPartyFabricComponentsProviderObjCpp.generate,
  generateThirdPartyFabricComponentsProviderH:
    generateThirdPartyFabricComponentsProviderH.generate,
  generateViewConfigJs: generateViewConfigJs.generate,
};

export type FilesOutput = Map<string, string>;

export type GenerateFunction = (
  libraryName: string,
  schema: SchemaType,
  packageName?: string,
  assumeNonnull: boolean,
  headerPrefix?: string,
  includeGetDebugPropsImplementation?: boolean,
) => FilesOutput;

export type LibraryGeneratorsFunctions = Readonly<{
  [string]: Array<GenerateFunction>,
}>;

export type LibraryOptions = Readonly<{
  libraryName: string,
  schema: SchemaType,
  outputDirectory: string,
  packageName?: string, // Some platforms have a notion of package, which should be configurable.
  assumeNonnull: boolean,
  useLocalIncludePaths?: boolean,
  includeGetDebugPropsImplementation?: boolean,
  libraryGenerators?: LibraryGeneratorsFunctions,
}>;

export type SchemasOptions = Readonly<{
  schemas: {[string]: SchemaType},
  outputDirectory: string,
  supportedApplePlatforms?: {[string]: {[string]: boolean}},
}>;

export type LibraryGenerators =
  | 'componentsAndroid'
  | 'componentsIOS'
  | 'descriptors'
  | 'events'
  | 'props'
  | 'states'
  | 'tests'
  | 'shadow-nodes'
  | 'modulesAndroid'
  | 'modulesCxx'
  | 'modulesIOS';

export type SchemasGenerators = 'providerIOS';

export type LibraryConfig = Readonly<{
  generators: Array<LibraryGenerators>,
  test?: boolean,
}>;

export type SchemasConfig = Readonly<{
  generators: Array<SchemasGenerators>,
  test?: boolean,
}>;

const LIBRARY_GENERATORS: LibraryGeneratorsFunctions = {
  descriptors: [
    generateComponentDescriptorCpp.generate,
    generateComponentDescriptorH.generate,
  ],
  events: [generateEventEmitterCpp.generate, generateEventEmitterH.generate],
  states: [generateStateCpp.generate, generateStateH.generate],
  props: [
    generateComponentHObjCpp.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generatePropsJavaInterface.generate,
    generatePropsJavaDelegate.generate,
  ],
  // TODO: Refactor this to consolidate various C++ output variation instead of forking per platform.
  componentsAndroid: [
    // JNI/C++ files
    generateComponentDescriptorH.generate,
    generateComponentDescriptorCpp.generate,
    generateEventEmitterCpp.generate,
    generateEventEmitterH.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generateStateCpp.generate,
    generateStateH.generate,
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
    // Java files
    generatePropsJavaInterface.generate,
    generatePropsJavaDelegate.generate,
  ],
  componentsIOS: [
    generateComponentDescriptorH.generate,
    generateComponentDescriptorCpp.generate,
    generateEventEmitterCpp.generate,
    generateEventEmitterH.generate,
    generateComponentHObjCpp.generate,
    generatePropsCpp.generate,
    generatePropsH.generate,
    generateStateCpp.generate,
    generateStateH.generate,
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
  modulesAndroid: [
    generateModuleJniCpp.generate,
    generateModuleJniH.generate,
    generateModuleJavaSpec.generate,
  ],
  modulesCxx: [generateModuleH.generate],
  modulesIOS: [generateModuleObjCpp.generate],
  tests: [generateTests.generate],
  'shadow-nodes': [
    generateShadowNodeCpp.generate,
    generateShadowNodeH.generate,
  ],
};

const SCHEMAS_GENERATORS = {
  providerIOS: [
    generateThirdPartyFabricComponentsProviderObjCpp.generate,
    generateThirdPartyFabricComponentsProviderH.generate,
  ],
};

type CodeGenFile = {
  name: string,
  content: string,
  outputDir: string,
};

function writeMapToFiles(map: Array<CodeGenFile>) {
  let success = true;
  map.forEach(file => {
    try {
      const location = path.join(file.outputDir, file.name);
      const dirName = path.dirname(location);
      if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, {recursive: true});
      }
      fs.writeFileSync(location, file.content);
    } catch (error) {
      success = false;
      console.error(`Failed to write ${file.name} to ${file.outputDir}`, error);
    }
  });

  return success;
}

function checkFilesForChanges(generated: Array<CodeGenFile>): boolean {
  let hasChanged = false;

  generated.forEach(file => {
    const location = path.join(file.outputDir, file.name);
    const currentContents = fs.readFileSync(location, 'utf8');
    if (currentContents !== file.content) {
      console.error(`- ${file.name} has changed`);

      hasChanged = true;
    }
  });

  return !hasChanged;
}

function checkOrWriteFiles(
  generatedFiles: Array<CodeGenFile>,
  test: void | boolean,
): boolean {
  if (test === true) {
    return checkFilesForChanges(generatedFiles);
  }
  return writeMapToFiles(generatedFiles);
}

module.exports = {
  allGenerators: ALL_GENERATORS,

  generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
      assumeNonnull,
      useLocalIncludePaths,
      includeGetDebugPropsImplementation = false,
      libraryGenerators = LIBRARY_GENERATORS,
    }: LibraryOptions,
    {generators, test}: LibraryConfig,
  ): boolean {
    schemaValidator.validate(schema);

    const defaultHeaderPrefix = 'react/renderer/components';
    const headerPrefix =
      useLocalIncludePaths === true
        ? ''
        : `${defaultHeaderPrefix}/${libraryName}/`;
    function composePath(intermediate: string) {
      return path.join(outputDirectory, intermediate, libraryName);
    }

    const componentIOSOutput = composePath(
      useLocalIncludePaths === true ? '' : defaultHeaderPrefix,
    );
    const modulesIOSOutput = composePath('./');

    const outputFoldersForGenerators = {
      componentsIOS: componentIOSOutput,
      modulesIOS: modulesIOSOutput,
      descriptors: outputDirectory,
      events: outputDirectory,
      props: outputDirectory,
      states: outputDirectory,
      componentsAndroid: outputDirectory,
      modulesAndroid: outputDirectory,
      modulesCxx: outputDirectory,
      tests: outputDirectory,
      'shadow-nodes': outputDirectory,
    };

    const generatedFiles: Array<CodeGenFile> = [];

    for (const name of generators) {
      for (const generator of libraryGenerators[name]) {
        generator(
          libraryName,
          schema,
          packageName,
          assumeNonnull,
          headerPrefix,
          includeGetDebugPropsImplementation,
        ).forEach((contents: string, fileName: string) => {
          generatedFiles.push({
            name: fileName,
            content: contents,
            outputDir: outputFoldersForGenerators[name],
          });
        });
      }
    }
    return checkOrWriteFiles(generatedFiles, test);
  },
  generateFromSchemas(
    {schemas, outputDirectory, supportedApplePlatforms}: SchemasOptions,
    {generators, test}: SchemasConfig,
  ): boolean {
    Object.keys(schemas).forEach(libraryName =>
      schemaValidator.validate(schemas[libraryName]),
    );

    const generatedFiles: Array<CodeGenFile> = [];

    for (const name of generators) {
      for (const generator of SCHEMAS_GENERATORS[name]) {
        generator(schemas, supportedApplePlatforms).forEach(
          (contents: string, fileName: string) => {
            generatedFiles.push({
              name: fileName,
              content: contents,
              outputDir: outputDirectory,
            });
          },
        );
      }
    }
    return checkOrWriteFiles(generatedFiles, test);
  },
  generateViewConfig({
    libraryName,
    schema,
  }: Pick<LibraryOptions, 'libraryName' | 'schema'>): string {
    schemaValidator.validate(schema);

    const result = generateViewConfigJs
      .generate(libraryName, schema)
      .values()
      .next();

    if (typeof result.value !== 'string') {
      throw new Error(`Failed to generate view config for ${libraryName}`);
    }

    return result.value;
  },
};
