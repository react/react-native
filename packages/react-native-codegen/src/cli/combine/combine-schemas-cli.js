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

import type {
  ComponentSchema,
  NativeModuleSchema,
  SchemaType,
} from '../../CodegenSchema.js';

const assert = require('node:assert');
const fs = require('node:fs');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'platform',
    type: 'string',
    demandOption: true,
  })
  .option('o', {
    alias: 'output',
  })
  .option('s', {
    alias: 'schema-query',
  })
  .parseSync();

const platform: string = argv.platform.toLowerCase();
const output: string = argv.output;
const schemaQuery: string = argv.s;

if (!['ios', 'android'].includes(platform)) {
  throw new Error(`Invalid platform ${platform}`);
}

if (!schemaQuery.startsWith('@')) {
  throw new Error(
    "The argument provided to --schema-query must be a filename that starts with '@'.",
  );
}

const schemaQueryOutputFile = schemaQuery.replace(/^@/, '');
const schemaQueryOutput = fs.readFileSync(schemaQueryOutputFile, 'utf8');

const modules: {
  [hasteModuleName: string]: NativeModuleSchema | ComponentSchema,
} = {};
const specNameToFile: {[hasteModuleName: string]: string} = {};

const schemaFiles =
  schemaQueryOutput.length > 0 ? schemaQueryOutput.split(' ') : [];
for (const file of schemaFiles) {
  const schema: SchemaType = JSON.parse(fs.readFileSync(file, 'utf8'));

  if (schema.modules) {
    for (const specName in schema.modules) {
      const module = schema.modules[specName];
      if (modules[specName]) {
        assert.deepEqual(
          module,
          modules[specName],
          `App contained two specs with the same file name '${specName}'. Schemas: ${specNameToFile[specName]}, ${file}. Please rename one of the specs.`,
        );
      }

      const excludedPlatforms = module.excludedPlatforms?.map(
        excludedPlatform => excludedPlatform.toLowerCase(),
      );

      if (excludedPlatforms != null) {
        const cxxOnlyModule =
          excludedPlatforms.includes('ios') &&
          excludedPlatforms.includes('android');

        if (!cxxOnlyModule && excludedPlatforms.includes(platform)) {
          continue;
        }
      }

      if (module.type === 'Component') {
        const components = module.components || {};
        const isExcludedForPlatform = Object.values(components).some(
          component =>
            component.excludedPlatforms
              ?.map(p => p.toLowerCase())
              .includes(platform),
        );

        if (isExcludedForPlatform) {
          continue;
        }
      }

      if (
        module.type === 'Component' &&
        schema.libraryName === 'FBReactNativeSpec'
      ) {
        continue;
      } else {
        modules[specName] = module;
        specNameToFile[specName] = file;
      }
    }
  }
}

fs.writeFileSync(output, JSON.stringify({modules}));
