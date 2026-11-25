/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import type {CheckOptions, Side} from './check';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {parseArgs} = require('node:util');

export type CliCommand =
  {kind: 'help'} | {kind: 'check', options: CheckOptions, json: boolean};

const VERSION = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;

const USAGE = `
  Usage: node scripts/abi-check/cli.js --platform ios|android
           --build-type debug|release --base <version>
           --current <version>|<react-native checkout>
           [--cache-dir <dir>] [--json]

  Compares the C++ ABI of React Native's stable API headers in a published
  version with another published version or a checkout of this repository.
  Prints the types whose layout, vtable or enumerator values changed or that
  were removed.

  Options:
    --platform     ios or android.
    --build-type   debug or release.
    --base         The published version to compare with, such as 0.88.0.
    --current      The root folder of a checkout, if the folder exists, or
                   else a published version.
    --cache-dir    Where downloaded artifacts are kept. Defaults to
                   react-native-abi-check in the temporary folder.
    --json         Prints the result as JSON.

  Exit status:
    0  No ABI breaks.
    1  ABI breaks.
    2  Bad arguments, or a tool error such as a failed download or a header
       that does not compile.
`;

function parseSide(current: string): Side {
  const root = path.resolve(current);
  if (fs.existsSync(root) && fs.statSync(root).isDirectory()) {
    return {kind: 'checkout', root};
  }
  if (VERSION.test(current)) {
    return {kind: 'version', version: current};
  }
  throw new Error(
    `--current must be a published version or a checkout folder: ${current}`,
  );
}

function parseCliArgs(argv: ReadonlyArray<string>): CliCommand {
  const {values} = parseArgs({
    args: [...argv],
    options: {
      platform: {type: 'string'},
      'build-type': {type: 'string'},
      base: {type: 'string'},
      current: {type: 'string'},
      'cache-dir': {type: 'string'},
      json: {type: 'boolean'},
      help: {type: 'boolean'},
    },
  });
  if (values.help === true) {
    return {kind: 'help'};
  }

  const {platform, 'build-type': buildType, base, current} = values;
  if (platform !== 'ios' && platform !== 'android') {
    throw new Error('--platform must be ios or android.');
  }
  if (buildType !== 'debug' && buildType !== 'release') {
    throw new Error('--build-type must be debug or release.');
  }
  if (base == null || !VERSION.test(base)) {
    throw new Error('--base must be a published version, such as 0.88.0.');
  }
  if (current == null) {
    throw new Error(
      '--current must be a published version or the root of a checkout.',
    );
  }
  return {
    kind: 'check',
    json: values.json === true,
    options: {
      platform,
      buildType,
      base,
      current: parseSide(current),
      cacheDir: path.resolve(
        values['cache-dir'] ?? path.join(os.tmpdir(), 'react-native-abi-check'),
      ),
    },
  };
}

module.exports = {USAGE, parseCliArgs};
