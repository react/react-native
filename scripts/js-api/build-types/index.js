/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

require('../../shared/babelRegister').registerForScript();

const buildApiSnapshot = require('./buildApiSnapshot');
const {
  buildGeneratedTypes,
  watchGeneratedTypes,
} = require('./buildGeneratedTypes');
const debug = require('debug');
const {parseArgs, styleText} = require('util');

const config = {
  options: {
    debug: {type: 'boolean'},
    'debug-version-annotations': {type: 'boolean'},
    help: {type: 'boolean'},
    'skip-snapshot': {type: 'boolean'},
    validate: {type: 'boolean'},
    watch: {type: 'boolean'},
  },
};

async function main() {
  const {
    values: {
      debug: debugEnabled,
      'debug-version-annotations': debugVersionAnnotations,
      help,
      'skip-snapshot': skipSnapshot,
      validate,
      watch,
    },
    /* $FlowFixMe[incompatible-type] Natural Inference rollout. See
     * https://fburl.com/workplace/6291gfvu */
  } = parseArgs(config);

  if (help) {
    console.log(`
  Usage: node ./scripts/js-api/build-types

  Build generated TypeScript types for react-native.

  Options:
    --debug           Enable debug logging.
    --debug-version-annotations
                      Outputs debug info alongside versioned type hashes as
                      part of the API snapshot contents.
    --skip-snapshot   Skip API snapshot generation.
    --validate        Validate if the current API snapshot on disk is up to
                      date. Exits with an error if differences are detected.
    --watch           Watch for file changes and rebuild incrementally. Skips
                      API snapshot generation.
    `);
    process.exitCode = 0;
    return;
  }

  if (debugEnabled) {
    debug.enable('build-types:*');
  }

  console.log(
    '\n' +
      styleText(
        ['bold', 'inverse'],
        ' Building generated react-native package types ',
      ) +
      '\n',
  );
  const translatedFiles = await buildGeneratedTypes();

  if (watch === true) {
    watchGeneratedTypes(translatedFiles);
  } else if (!skipSnapshot) {
    console.log(
      styleText(['bold', 'inverse'], ' Building API snapshot ') + '\n',
    );
    await buildApiSnapshot({validate, debugVersionAnnotations});
  }
}

if (require.main === module) {
  void main();
}
