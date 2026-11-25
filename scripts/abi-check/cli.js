/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

// This file runs before Babel is registered, so its types are comments.
/*:: import type {CheckOptions, CheckResult} from './check'; */

if (require.main === module) {
  require('../shared/babelRegister').registerForScript();
}

const {USAGE, parseCliArgs} = require('./args');

/*::
export type CliIO = {
  checkAbi: (options: CheckOptions) => Promise<CheckResult>,
  stdout: (text: string) => unknown,
  stderr: (text: string) => unknown,
};
*/

function describeResult(
  {
    breaks,
    additions,
    headerCounts,
    keyCounts,
    skippedHeaders,
  } /*: CheckResult */,
  {platform, buildType, base, current} /*: CheckOptions */,
) /*: string */ {
  const currentName =
    current.kind === 'version' ? current.version : current.root;
  const scope = `the ${platform} ${buildType} stable API, ${base} to ${currentName}`;
  return [
    breaks.length === 0
      ? `No ABI breaks in ${scope}.`
      : `${breaks.length} ABI breaks in ${scope}:`,
    ...breaks.map(({key, change}) => `  ${change.padEnd(8)} ${key}`),
    `Added: ${additions.length} layouts, vtables or enums.`,
    `Compared ${keyCounts.base} layouts, vtables and enums from ` +
      `${headerCounts.base} headers of ${base} with ${keyCounts.current} ` +
      `from ${headerCounts.current} headers of ${currentName}.`,
    `Skipped ${skippedHeaders.length} headers listed in skipped-headers.js` +
      (skippedHeaders.length > 0 ? `: ${skippedHeaders.join(', ')}.` : '.'),
  ].join('\n');
}

/**
 * Runs the CLI with `argv` and returns its exit status: 0 without ABI
 * breaks, 1 with breaks, 2 for bad arguments or a tool error.
 */
async function runCli(
  argv /*: ReadonlyArray<string> */,
  {checkAbi, stdout, stderr} /*: CliIO */,
) /*: Promise<number> */ {
  let command;
  try {
    command = parseCliArgs(argv);
  } catch (error) {
    stderr(`${error.message}\n${USAGE}\n`);
    return 2;
  }
  if (command.kind === 'help') {
    stdout(`${USAGE}\n`);
    return 0;
  }

  const {options, json} = command;
  let result;
  try {
    result = await checkAbi(options);
  } catch (error) {
    stderr(`${error.message}\n`);
    return 2;
  }
  stdout(
    `${json ? JSON.stringify(result, null, 2) : describeResult(result, options)}\n`,
  );
  return result.breaks.length > 0 ? 1 : 0;
}

module.exports = {runCli};

if (require.main === module) {
  // The iOS prebuild's header code logs its progress to stdout, which is
  // kept for the result.
  // $FlowFixMe[cannot-write]
  console.log = console.error;
  void runCli(process.argv.slice(2), {
    checkAbi: require('./check').checkAbi,
    stdout: text => process.stdout.write(text),
    stderr: text => process.stderr.write(text),
  }).then(code => {
    process.exitCode = code;
  });
}
