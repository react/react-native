/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {run} from './scripts/utils';
import {apple} from '@react-native/core-cli-utils';
import {Option, program} from 'commander';
import {readFileSync} from 'node:fs';

program.version(JSON.parse(readFileSync('./package.json', 'utf8')).version);

const bootstrap = program.command('bootstrap');

type BootstrapOptions = {
  arch: 'old' | 'new',
  jsvm: 'hermes' | 'jsc',
  frameworks?: 'static' | 'dynamic',
};

bootstrap
  .command('ios')
  .description('Bootstrap iOS')
  .addOption(
    new Option('--arch <arch>', "Choose React Native's architecture")
      .choices(['new', 'old'])
      .default('new'),
  )
  .addOption(
    new Option(
      '--frameworks <linkage>',
      'Use frameworks instead of static libraries',
    )
      .choices(['static', 'dynamic'])
      .default(undefined),
  )
  .addOption(
    new Option('--jsvm <vm>', 'Choose VM used on device')
      .choices(['jsc', 'hermes'])
      .default('hermes'),
  )
  .action(async ({jsvm, arch, frameworks}: BootstrapOptions) => {
    await run(
      apple.bootstrap({
        cwd: __dirname,
        frameworks,
        hermes: jsvm === 'hermes',
        newArchitecture: arch === 'new',
      }),
    );
  });

if (require.main === module) {
  program.parse();
}

export default program;
