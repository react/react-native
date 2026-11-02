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

const {getSwiftPackageBuildCommand} = require('../build');

describe('getSwiftPackageBuildCommand', () => {
  it('builds Release at -O2', () => {
    const command = getSwiftPackageBuildCommand('Release', 'iOS', 'output');

    expect(command).toContain('GCC_OPTIMIZATION_LEVEL=2');
  });

  it('leaves the Debug optimization level to the project', () => {
    const command = getSwiftPackageBuildCommand('Debug', 'iOS', 'output');

    expect(command).not.toContain('GCC_OPTIMIZATION_LEVEL');
  });

  it.each(['Debug', 'Release'])('keeps the base %s command', buildType => {
    const command = getSwiftPackageBuildCommand(
      buildType,
      'iOS Simulator',
      'output',
    );

    expect(command).toContain(
      'xcodebuild -scheme React -destination "generic/platform=iOS Simulator" -derivedDataPath "output" ' +
        `-configuration "${buildType}" SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface" ` +
        'DEBUG_INFORMATION_FORMAT="dwarf-with-dsym"',
    );
  });
});
