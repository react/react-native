/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {getDebugInfoFromCommandResult, runCommandSync} from '../utils';
import path from 'node:path';

describe('runCommandSync', () => {
  it('preserves the spawn error when the command cannot start', () => {
    const command = path.join(__dirname, 'nonexistent-fantom-executable');
    const result = runCommandSync(command, [], {});

    expect(result).toMatchObject({
      error: {code: 'ENOENT'},
      status: null,
      stdout: '',
      stderr: '',
    });
    expect(getDebugInfoFromCommandResult(result)).toContain('ENOENT');
  });

  it('returns output from a command that starts', () => {
    const result = runCommandSync(
      process.execPath,
      ['-e', 'process.stdout.write("output"); process.stderr.write("error")'],
      {},
    );

    expect(result).toMatchObject({
      status: 0,
      stdout: 'output',
      stderr: 'error',
    });
    expect(result.error).toBeUndefined();
  });
});
