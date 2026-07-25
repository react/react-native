/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Command, Config} from '@react-native-community/cli-types';

export type SpmCommandArgs = {
  version?: string,
  yes?: boolean,
  xcodeproj?: string,
  productName?: string,
  deintegrate?: boolean,
  artifacts?: string,
  download?: string,
  skipCodegen?: boolean,
};

const spmCommand: Command = {
  name: 'spm [action]',
  description:
    'Set up or maintain Swift Package Manager support for the iOS/macOS app. ' +
    'Actions: add, update, deinit, scaffold. With no action: add (or update ' +
    'if SPM is already set up).',
  options: [
    {
      name: '--version <string>',
      description:
        'React Native version (e.g. 0.80.0). Defaults to the version in node_modules/react-native/package.json.',
    },
    {
      name: '--yes',
      description: 'Skip the dirty-pbxproj confirmation prompt.',
    },
    {
      name: '--xcodeproj <path>',
      description:
        '[add] Path to the .xcodeproj to inject SPM packages into ' +
        '(disambiguates when several exist).',
    },
    {
      name: '--productName <string>',
      description:
        '[add] App target to inject into (disambiguates when several exist).',
    },
    {
      name: '--deintegrate',
      description:
        '[add] Run `pod deintegrate` and strip React Native from the Podfile ' +
        'before injecting (CocoaPods → SwiftPM migration).',
    },
    {
      name: '--artifacts <path>',
      description:
        '[advanced] Local artifact root containing complete debug/ and release/ slots.',
    },
    {
      name: '--download <string>',
      description:
        '[advanced] Artifact download policy: auto (default), skip, or force.',
    },
    {
      name: '--skipCodegen',
      description: '[advanced] Skip the react-native codegen step.',
    },
  ],
  func: async (
    argv: Array<string>,
    config: Config,
    args: SpmCommandArgs,
  ): Promise<void> => {
    const passthrough: Array<string> = [];
    if (argv[0] != null) {
      passthrough.push(argv[0]);
    }
    const stringOpts: Array<
      [
        'version' | 'productName' | 'xcodeproj' | 'artifacts' | 'download',
        string,
      ],
    > = [
      ['version', '--version'],
      ['productName', '--product-name'],
      ['xcodeproj', '--xcodeproj'],
      ['artifacts', '--artifacts'],
      ['download', '--download'],
    ];
    for (const [key, flag] of stringOpts) {
      const value = args[key];
      if (value != null) {
        passthrough.push(flag, String(value));
      }
    }
    const boolOpts: Array<['skipCodegen' | 'deintegrate' | 'yes', string]> = [
      ['skipCodegen', '--skip-codegen'],
      ['deintegrate', '--deintegrate'],
      ['yes', '--yes'],
    ];
    for (const [key, flag] of boolOpts) {
      if (args[key] === true) {
        passthrough.push(flag);
      }
    }
    const setupAppleSpm = require.resolve(
      'react-native/scripts/setup-apple-spm',
      {paths: [config.root]},
    );
    // $FlowFixMe[unsupported-syntax] dynamic require of a resolved path
    await require(setupAppleSpm).main(passthrough);
  },
};

export default spmCommand;
