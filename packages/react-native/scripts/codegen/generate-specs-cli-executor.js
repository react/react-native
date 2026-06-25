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

const utils = require('./codegen-utils');
const fs = require('fs');
const path = require('path');

const GENERATORS /*: {[string]: {[string]: ReadonlyArray<string>}} */ = {
  all: {
    android: ['componentsAndroid', 'modulesAndroid', 'modulesCxx'],
    ios: ['componentsIOS', 'modulesIOS', 'modulesCxx'],
  },
  components: {
    android: ['componentsAndroid'],
    ios: ['componentsIOS'],
  },
  modules: {
    android: ['modulesAndroid', 'modulesCxx'],
    ios: ['modulesIOS', 'modulesCxx'],
  },
};

function createOutputDirectoryIfNeeded(
  outputDirectory /*: string */,
  libraryName /*: string */,
) {
  if (!outputDirectory) {
    // $FlowFixMe[reassign-const]
    outputDirectory = path.resolve(__dirname, '..', 'Libraries', libraryName);
  }
  fs.mkdirSync(outputDirectory, {recursive: true});
}

/**
 * This function read a JSON schema from a path and parses it.
 * It throws if the schema don't exists or it can't be parsed.
 *
 * @parameter schemaPath: the path to the schema
 * @return a valid schema
 * @throw an Error if the schema doesn't exists in a given path or if it can't be parsed.
 */
function readAndParseSchema(schemaPath /*: string */) {
  const schemaText = fs.readFileSync(schemaPath, 'utf-8');

  if (schemaText == null) {
    throw new Error(`Can't find schema at ${schemaPath}`);
  }

  try {
    return JSON.parse(schemaText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
  }
}

function validateLibraryType(libraryType /*: string */) {
  if (GENERATORS[libraryType] == null) {
    throw new Error(`Invalid library type. ${libraryType}`);
  }
}

function generateSpecFromInMemorySchema(
  platform /*: string */,
  schema /*: string */,
  outputDirectory /*: string */,
  libraryName /*: string */,
  packageName /*: string */,
  libraryType /*: string */,
  useLocalIncludePaths /*: boolean */,
) {
  validateLibraryType(libraryType);
  createOutputDirectoryIfNeeded(outputDirectory, libraryName);
  const includeGetDebugPropsImplementation =
    libraryName.includes('FBReactNativeSpec'); //only generate getDebugString for React Native Core Components
  utils.getCodegen().generate(
    {
      libraryName,
      schema,
      outputDirectory,
      packageName,
      assumeNonnull: platform === 'ios',
      useLocalIncludePaths,
      includeGetDebugPropsImplementation,
    },
    {
      generators: GENERATORS[libraryType][platform],
    },
  );

  if (platform === 'android') {
    // Move all components C++ files to a structured jni folder for now.
    // Note: this should've been done by RNCodegen's generators, but:
    // * the generators don't support platform option yet
    // * this subdir structure is Android-only, not applicable to iOS
    const files = fs.readdirSync(outputDirectory);
    const jniOutputDirectory = `${outputDirectory}/jni/react/renderer/components/${libraryName}`;
    fs.mkdirSync(jniOutputDirectory, {recursive: true});
    files
      .filter(f => f.endsWith('.h') || f.endsWith('.cpp'))
      .forEach(f => {
        fs.renameSync(`${outputDirectory}/${f}`, `${jniOutputDirectory}/${f}`);
      });
  }
}

function generateSpec(
  platform /*: string */,
  schemaPath /*: string */,
  outputDirectory /*: string */,
  libraryName /*: string */,
  packageName /*: string */,
  libraryType /*: string */,
) {
  // $FlowFixMe[incompatible-type]
  generateSpecFromInMemorySchema(
    platform,
    readAndParseSchema(schemaPath),
    outputDirectory,
    libraryName,
    packageName,
    libraryType,
  );
}

module.exports = {
  execute: generateSpec,
  generateSpecFromInMemorySchema,
};
