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

  describe('mergeable', () => {
    const releaseCommand =
      'xcodebuild -scheme React -destination "generic/platform=iOS" -derivedDataPath "output" ' +
      '-configuration "Release" SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES OTHER_SWIFT_FLAGS="-no-verify-emitted-module-interface" ' +
      'DEBUG_INFORMATION_FORMAT="dwarf-with-dsym" GCC_OPTIMIZATION_LEVEL=2';

    it('makes Release dynamic frameworks mergeable', () => {
      const command = getSwiftPackageBuildCommand(
        'Release',
        'iOS',
        'output',
        true,
      );

      expect(command).toBe(
        `${releaseCommand} 'MERGEABLE_LIBRARY=$(MERGEABLE_LIBRARY_$(MACH_O_TYPE))' MERGEABLE_LIBRARY_mh_dylib=YES`,
      );
    });

    it('leaves the Release command unchanged when off', () => {
      const command = getSwiftPackageBuildCommand(
        'Release',
        'iOS',
        'output',
        false,
      );

      expect(command).toBe(releaseCommand);
    });

    it('leaves the Debug command unchanged', () => {
      expect(getSwiftPackageBuildCommand('Debug', 'iOS', 'output', true)).toBe(
        getSwiftPackageBuildCommand('Debug', 'iOS', 'output', false),
      );
      expect(
        getSwiftPackageBuildCommand('Debug', 'iOS', 'output', true),
      ).not.toContain('MERGEABLE_LIBRARY');
    });
  });
});
