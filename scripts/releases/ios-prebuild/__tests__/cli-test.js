/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

'use strict';

describe('getCLIConfiguration', () => {
  const originalArgv = process.argv;

  afterEach(() => {
    process.argv = originalArgv;
  });

  // yargs reads process.argv when it is first required.
  const parse = args => {
    process.argv = ['node', 'prepare-ios-prebuilds.js', ...args];
    let getCLIConfiguration;
    jest.isolateModules(() => {
      ({getCLIConfiguration} = require('../cli'));
    });
    return getCLIConfiguration();
  };

  it('reads --mergeable', async () => {
    expect(
      await parse(['--configuration', 'Release', '--mergeable']),
    ).toMatchObject({mergeable: true});
  });

  it('leaves mergeable off by default', async () => {
    expect(await parse(['--configuration', 'Release'])).toMatchObject({
      mergeable: false,
    });
  });
});
