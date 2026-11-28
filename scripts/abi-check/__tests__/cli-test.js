/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

import type {CheckOptions, CheckResult} from '../check';

const {runCli} = require('../cli');

const ARGS = [
  '--platform',
  'android',
  '--build-type',
  'release',
  '--base',
  '0.88.0',
  '--current',
  '0.88.1',
];

const NO_BREAKS: CheckResult = {
  breaks: [],
  additions: ['L facebook::react::Added'],
  headerCounts: {base: 2, current: 3},
  keyCounts: {base: 10, current: 11},
  skippedHeaders: ['react/Skipped.h'],
};

const WITH_BREAKS: CheckResult = {
  ...NO_BREAKS,
  breaks: [{key: 'L facebook::yoga::Style', change: 'changed'}],
};

/** Runs the CLI with `checkAbi` answering `result`; collects its output. */
async function run(
  argv: ReadonlyArray<string>,
  result: CheckResult | Error = NO_BREAKS,
): Promise<{
  code: number,
  stdout: string,
  stderr: string,
  checked: Array<CheckOptions>,
}> {
  let stdout = '';
  let stderr = '';
  const checked: Array<CheckOptions> = [];
  const code = await runCli(argv, {
    checkAbi: options => {
      checked.push(options);
      return result instanceof Error
        ? Promise.reject(result)
        : Promise.resolve(result);
    },
    stdout: text => {
      stdout += text;
    },
    stderr: text => {
      stderr += text;
    },
  });
  return {code, stdout, stderr, checked};
}

describe('runCli', () => {
  test.each([
    ['a bad platform', ['--platform', 'windows'], /--platform/],
    ['a bad build type', ['--build-type', 'profile'], /--build-type/],
    ['a bad base version', ['--base', 'latest'], /--base/],
  ])('exits with 2 for %s', async (_, override, message) => {
    const argv = [...ARGS];
    argv[argv.indexOf(override[0]) + 1] = override[1];

    const {code, stderr, checked} = await run(argv);

    expect(code).toBe(2);
    expect(stderr).toMatch(message);
    expect(stderr).toContain('Usage:');
    expect(checked).toEqual([]);
  });

  test('exits with 2 for missing arguments', async () => {
    const {code, stderr} = await run(['--platform', 'ios']);

    expect(code).toBe(2);
    expect(stderr).toContain('Usage:');
  });

  test('exits with 2 and the message when the check fails', async () => {
    const {code, stderr} = await run(
      ARGS,
      new Error('clang++ could not compile react/Broken.h'),
    );

    expect(code).toBe(2);
    expect(stderr).toContain('react/Broken.h');
  });

  test('exits with 1 and lists the breaks', async () => {
    const {code, stdout} = await run(ARGS, WITH_BREAKS);

    expect(code).toBe(1);
    expect(stdout).toContain('changed  L facebook::yoga::Style');
    expect(stdout).toContain('react/Skipped.h');
  });

  test('exits with 0 without breaks', async () => {
    const {code, stdout} = await run(ARGS);

    expect(code).toBe(0);
    expect(stdout).toMatch(/^No ABI breaks/);
  });

  test('prints the result as JSON', async () => {
    const {code, stdout} = await run([...ARGS, '--json'], WITH_BREAKS);

    expect(code).toBe(1);
    expect(JSON.parse(stdout)).toEqual(WITH_BREAKS);
  });

  test('documents the exit codes in the help', async () => {
    const {code, stdout} = await run(['--help']);

    expect(code).toBe(0);
    expect(stdout).toMatch(/0\s.*no ABI breaks/i);
    expect(stdout).toMatch(/1\s.*ABI breaks/);
    expect(stdout).toMatch(/2\s.*(arguments|error)/);
  });
});
