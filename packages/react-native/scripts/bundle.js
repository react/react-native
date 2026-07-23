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

const {bundleCommand: bc} = require('@react-native/community-cli-plugin');
const commander = require('commander');
const {execSync} = require('node:child_process');

// Commander 12.0.0 changes from the global to named export
// $FlowFixMe[signature-verification-failure]
const program = commander.program ?? commander;

program
  .name(bc.name)
  .description(bc.description ?? '')
  .option(
    '--config-cmd <string>',
    'Command to generate a JSON project config',
    'npx react-native config',
  )
  .option('--load-config <string>', 'JSON project config')
  .option('--verbose', 'Additional logs', () => true, false)
  .allowUnknownOption()
  .action(async function handleAction() {
    let config = null;
    let options = program
      .opts /*::<{
      configCmd?: string,
      loadConfig?: string,
      verbose: boolean,
      ...
    }>*/
      ();
    if (options.loadConfig != null) {
      config = JSON.parse(
        options.loadConfig.replace(/^\W*'/, '').replace(/'\W*$/, ''),
      );
    } else if (options.configCmd != null) {
      config = JSON.parse(
        execSync(options.configCmd.trim(), {encoding: 'utf8'}),
      );
    }

    if (config == null) {
      throw new Error('No config provided');
    }

    await bc.func(program.args, config, options);
  });

if (bc.options != null) {
  for (const o of bc.options) {
    program.option(
      o.name,
      o.description ?? '',
      o.parse ?? (value => value),
      o.default,
    );
  }
}

if (require.main === module) {
  program.parse(process.argv);
}

module.exports = program;
