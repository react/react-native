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

  describe('mergeable', () => {
    const releaseCommand = (mergeable /*: boolean */) =>
      getPlatformBuildCommand(
        'ReactNativeDependencies',
        'Release',
        'iOS',
        'build',
        mergeable,
      );

    it('makes Release dynamic frameworks mergeable', () => {
      expect(releaseCommand(true)).toBe(
        `${releaseCommand(false)} 'MERGEABLE_LIBRARY=$(MERGEABLE_LIBRARY_$(MACH_O_TYPE))' MERGEABLE_LIBRARY_mh_dylib=YES`,
      );
    });

    it('leaves the Release command unchanged when off', () => {
      // The spaces come from the line continuations in the command template.
      expect(releaseCommand(false)).toBe(
        'xcodebuild -scheme "ReactNativeDependencies" -destination "generic/platform=iOS" ' +
          '-derivedDataPath "build" -configuration "Release" ' +
          'SKIP_INSTALL=NO     BUILD_LIBRARY_FOR_DISTRIBUTION=YES     DEBUG_INFORMATION_FORMAT=dwarf-with-dsym ' +
          'GCC_OPTIMIZATION_LEVEL=2',
      );
    });

    it('leaves the Debug command unchanged', () => {
      const debugCommand = (mergeable /*: boolean */) =>
        getPlatformBuildCommand(
          'ReactNativeDependencies',
          'Debug',
          'iOS',
          'build',
          mergeable,
        );

      expect(debugCommand(true)).toBe(debugCommand(false));
      expect(debugCommand(true)).not.toContain('MERGEABLE_LIBRARY');
    });
  });
});
