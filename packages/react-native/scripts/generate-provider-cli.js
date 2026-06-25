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

const utils = require('./codegen/codegen-utils');
const fs = require('fs');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'platform',
    describe: 'Platform to generate native code artifacts for.',
  })
  .option('s', {
    alias: 'schemaListPath',
    describe: 'The path to the schema list file.',
  })
  .option('o', {
    alias: 'outputDir',
    describe:
      'Path to directory where native code source files should be saved.',
  })
  .usage('Usage: $0 <args>')
  .demandOption(
    ['platform', 'schemaListPath', 'outputDir'],
    'Please provide platform, schema path, and output directory.',
  ).argv;

const GENERATORS /*: {[string]: ReadonlyArray<string>} */ = {
  android: [],
  ios: ['providerIOS'],
};

function generateProvider(
  platform /*: string */,
  schemaListPath /*: string */,
  outputDirectory /*: string */,
) {
  const schemaListText = fs.readFileSync(schemaListPath, 'utf-8');

  if (schemaListText == null) {
    throw new Error(`Can't find schema list file at ${schemaListPath}`);
  }

  if (!outputDirectory) {
    throw new Error('outputDir is required');
  }
  fs.mkdirSync(outputDirectory, {recursive: true});

  let schemaPaths;
  try {
    schemaPaths = JSON.parse(schemaListText);
  } catch (err) {
    throw new Error(`Can't parse schema to JSON. ${schemaListPath}`);
  }

  const schemas /*: {[string]: $FlowFixMe} */ = {};
  try {
    for (const libraryName of Object.keys(schemaPaths)) {
      const tmpSchemaText = fs.readFileSync(schemaPaths[libraryName], 'utf-8');
      schemas[libraryName] = JSON.parse(tmpSchemaText);
    }
  } catch (err) {
    throw new Error(`Failed to read schema file. ${err.message}`);
  }

  if (GENERATORS[platform] == null) {
    throw new Error(`Invalid platform type. ${platform}`);
  }

  utils.getCodegen().generateFromSchemas(
    {
      schemas,
      outputDirectory,
    },
    {
      generators: GENERATORS[platform],
    },
  );
}

function main() {
  // $FlowFixMe[prop-missing]
  generateProvider(argv.platform, argv.schemaListPath, argv.outputDir);
}

main();
