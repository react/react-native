/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @noflow
 * @format
 */

'use strict';

const {IS_META_CHECKOUT, findMetaTool} = require('./format-utils');
const {spawnSync} = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const REPO_ROOT = path.resolve(__dirname, '..');
const RUFF_VERSION = '0.14.0';
const RUFF_ROOT = path.join(
  REPO_ROOT,
  'node_modules',
  '.cache',
  'react-native-format',
  `ruff-${RUFF_VERSION}`,
);

function run(command, args, options = {}) {
  const environment = options.env ?? process.env;
  const result = spawnSync(command, args, {
    cwd: REPO_ROOT,
    stdio: options.quiet === true ? 'ignore' : 'inherit',
    ...options,
    env: {...environment, PWD: REPO_ROOT},
  });
  if (result.error != null) {
    if (options.quiet !== true) {
      console.error(result.error.message);
    }
    return {status: 1};
  }
  if (result.signal != null) {
    process.kill(process.pid, result.signal);
    return {status: 1};
  }
  return {status: result.status ?? 1};
}

function findPython() {
  const candidates =
    process.platform === 'win32'
      ? [
          ['py', ['-3']],
          ['python', []],
        ]
      : [
          ['python3', []],
          ['python', []],
        ];

  for (const [command, prefixArguments] of candidates) {
    if (
      run(
        command,
        [
          ...prefixArguments,
          '-c',
          'import sys; raise SystemExit(sys.version_info.major != 3)',
        ],
        {quiet: true},
      ).status === 0
    ) {
      return {command, prefixArguments};
    }
  }
  return null;
}

function warnMissingPython() {
  console.warn(
    'warning: Skipping Python formatting because Python 3 with pip was not found.\n' +
      'Please install Python 3 with pip and make sure `python3` (`py -3` on Windows) and pip are available in your PATH.',
  );
}

function warnMissingMetaRuff() {
  console.warn(
    'warning: Skipping Python formatting because the Meta-managed Ruff tool could not run.\n' +
      'From the fbsource root, run `tools/third-party/ruff/ruff --version`. ' +
      'If that fails, repair your Meta DotSlash setup.',
  );
}

function runRuff(command, prefixArguments, check) {
  if (
    run(command, [...prefixArguments, '--version'], {quiet: true}).status !== 0
  ) {
    return false;
  }
  const format = run(command, [
    ...prefixArguments,
    'format',
    ...(check ? ['--check'] : []),
    '.',
  ]);
  process.exit(format.status);
}

function main() {
  const check = process.argv[2] === '--check';
  if (process.env.RUFF != null) {
    if (!runRuff(process.env.RUFF, [], check)) {
      if (IS_META_CHECKOUT) {
        warnMissingMetaRuff();
      } else {
        console.warn(
          'warning: Skipping Python formatting because the configured Ruff command could not run.\n' +
            'Please install Ruff and set RUFF=/path/to/ruff, or unset RUFF to use automatic installation.',
        );
      }
      return;
    }
  }

  const metaRuff = findMetaTool('tools', 'third-party', 'ruff', 'ruff');
  if (metaRuff != null) {
    if (!runRuff(metaRuff.command, metaRuff.prefixArguments, check)) {
      warnMissingMetaRuff();
    }
    return;
  }
  if (IS_META_CHECKOUT) {
    warnMissingMetaRuff();
    return;
  }

  const python = findPython();
  if (python == null) {
    warnMissingPython();
    return;
  }
  const pythonPath = [RUFF_ROOT, process.env.PYTHONPATH]
    .filter(Boolean)
    .join(path.delimiter);
  const environment = {...process.env, PYTHONPATH: pythonPath};

  if (
    run(python.command, [...python.prefixArguments, '-c', 'import ruff'], {
      env: environment,
      quiet: true,
    }).status !== 0
  ) {
    if (
      run(
        python.command,
        [...python.prefixArguments, '-m', 'pip', '--version'],
        {quiet: true},
      ).status !== 0
    ) {
      warnMissingPython();
      return;
    }
    try {
      fs.mkdirSync(RUFF_ROOT, {recursive: true});
    } catch (error) {
      console.warn(
        `warning: Skipping Python formatting because the Ruff cache could not be created: ${String(error)}`,
      );
      return;
    }
    const install = run(python.command, [
      ...python.prefixArguments,
      '-m',
      'pip',
      'install',
      '--disable-pip-version-check',
      '--only-binary=:all:',
      `--target=${RUFF_ROOT}`,
      `ruff==${RUFF_VERSION}`,
    ]);
    if (install.status !== 0) {
      console.warn(
        `warning: Skipping Python formatting because Ruff ${RUFF_VERSION} could not be installed.\n` +
          'Please check your network connection, or install Ruff and set RUFF=/path/to/ruff.',
      );
      return;
    }
  }

  const format = run(
    python.command,
    [
      ...python.prefixArguments,
      '-m',
      'ruff',
      'format',
      ...(check ? ['--check'] : []),
      '.',
    ],
    {env: environment},
  );
  process.exit(format.status);
}

main();
