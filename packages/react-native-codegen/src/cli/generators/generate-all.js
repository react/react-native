/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * This generates all possible outputs by executing all available generators.
 */

'use strict';

const RNCodegen = require('../../generators/RNCodegen.js');
const fs = require('node:fs');

const args = process.argv.slice(2);
if (args.length < 3) {
  throw new Error(
    `Expected to receive path to schema, library name, output directory and module spec name. Received ${args.join(
      ', ',
    )}`,
  );
}

const schemaPath = args[0];
const libraryName = args[1];
const outputDirectory = args[2];
const packageName = args[3];
const assumeNonnull = args[4] === 'true' || args[4] === 'True';

const schemaText = fs.readFileSync(schemaPath, 'utf-8');

if (schemaText == null) {
  throw new Error(`Can't find schema at ${schemaPath}`);
}

fs.mkdirSync(outputDirectory, {recursive: true});

let schema;
try {
  schema = JSON.parse(schemaText);
} catch (err) {
  throw new Error(`Can't parse schema to JSON. ${schemaPath}`);
}
const includeGetDebugPropsImplementation: boolean =
  libraryName.includes('FBReactNativeSpec');
RNCodegen.generate(
  {
    libraryName,
    schema,
    outputDirectory,
    packageName,
    assumeNonnull,
    includeGetDebugPropsImplementation,
  },
  {
    generators: [
      'descriptors',
      'events',
      'props',
      'states',
      'tests',
      'shadow-nodes',
      'modulesAndroid',
      'modulesCxx',
      'modulesIOS',
    ],
  },
);
