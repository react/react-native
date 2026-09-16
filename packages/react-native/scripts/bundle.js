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

const {
  bundleCommand: bundleCommandBase,
  unstable_createBundleCommandParser,
} = require('@react-native/community-cli-plugin');
const {execSync} = require('node:child_process');

/*::
type BundleOptions = {
  configCmd?: string,
  loadConfig?: string,
  ...
};
*/

const baseOptions = [
  {
    name: '--config-cmd <string>',
    description: 'Command to generate a JSON project config',
    default: 'npx react-native config',
  },
  {
    name: '--load-config <string>',
    description: 'JSON project config',
  },
];

const {
  parser: bundleCommandParser,
  baseHelpInformation: bundleCommandBaseHelp,
} = unstable_createBundleCommandParser(baseOptions);

function formatOptions(
  options /*: ReadonlyArray<Readonly<{description?: string, name: string, ...}>> */,
) {
  return options
    .map(option => `  ${option.name.padEnd(35)} ${option.description ?? ''}`)
    .join('\n');
}

function printHelp() {
  console.log(`${bundleCommandBaseHelp}
Additional options:
${formatOptions(baseOptions)}
`);
}

async function main(argv /*: ReadonlyArray<string> */ = process.argv.slice(2)) {
  if (argv.includes('--help')) {
    printHelp();
    return;
  }

  bundleCommandParser.parse(argv, {from: 'user'});
  const options = bundleCommandParser
    .opts /*::<BundleOptions>*/
    ();

  let config = null;
  if (options.loadConfig != null) {
    config = JSON.parse(
      options.loadConfig.replace(/^\W*'/, '').replace(/'\W*$/, ''),
    );
  } else if (options.configCmd != null) {
    config = JSON.parse(execSync(options.configCmd.trim(), {encoding: 'utf8'}));
  }

  if (config == null) {
    throw new Error('No config provided');
  }

  await bundleCommandBase.func(bundleCommandParser.args, config, options);
}

if (require.main === module) {
  void main();
}
