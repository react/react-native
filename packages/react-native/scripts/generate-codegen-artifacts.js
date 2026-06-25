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

const executor = require('./codegen/generate-artifacts-executor');
const yargs = require('yargs');

const argv = yargs
  .option('p', {
    alias: 'path',
    description: 'Path to the React Native project root.',
  })
  .option('t', {
    alias: 'targetPlatform',
    description: 'Target platform. Supported values: "android", "ios", "all".',
  })
  .option('o', {
    alias: 'outputPath',
    description: 'Path where generated artifacts will be output to.',
  })
  .option('s', {
    alias: 'source',
    description: 'Whether the script is invoked from an `app` or a `library`',
    default: 'app',
  })
  .option('f', {
    alias: 'forceOutputPath',
    description:
      'Whether to force React Native Core artifacts to output to the specified path',
    type: 'boolean',
    default: false,
  })
  .usage('Usage: $0 -p [path to app] -t [target platform] -o [output path]')
  .demandOption(['p', 't']).argv;

executor.execute(
  // $FlowFixMe[prop-missing]
  argv.path,
  // $FlowFixMe[prop-missing]
  argv.targetPlatform,
  // $FlowFixMe[prop-missing]
  argv.outputPath,
  // $FlowFixMe[prop-missing]
  argv.source,
  true, // runReactNativeCodegen
  // $FlowFixMe[prop-missing]
  argv.forceOutputPath,
);
