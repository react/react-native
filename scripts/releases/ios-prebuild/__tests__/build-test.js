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

const {getPlatformBuildCommand} = require('../build');

describe('getPlatformBuildCommand', () => {
  it('builds Release at -O2', () => {
    const command = getPlatformBuildCommand(
      'ReactNativeDependencies',
      'Release',
      'iOS',
      'build',
    );

    expect(command).toContain('GCC_OPTIMIZATION_LEVEL=2');
  });

  it('leaves the Debug optimization level to the project', () => {
    const command = getPlatformBuildCommand(
      'ReactNativeDependencies',
      'Debug',
      'iOS',
      'build',
    );

    expect(command).not.toContain('GCC_OPTIMIZATION_LEVEL');
  });

  it.each(['Debug', 'Release'])('keeps the base %s command', configuration => {
    const command = getPlatformBuildCommand(
      'ReactNativeDependencies',
      configuration,
      'iOS Simulator',
      'build',
    );

    expect(command).toMatch(
      new RegExp(
        '^xcodebuild -scheme "ReactNativeDependencies" -destination "generic/platform=iOS Simulator" ' +
          '-derivedDataPath "build" ' +
          `-configuration "${configuration}" ` +
          'SKIP_INSTALL=NO\\s+BUILD_LIBRARY_FOR_DISTRIBUTION=YES\\s+DEBUG_INFORMATION_FORMAT=dwarf-with-dsym',
      ),
    );
  });
});
