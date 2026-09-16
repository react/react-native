/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @noflow
 */

const {startCommand} = require('@react-native/community-cli-plugin');
const {program} = require('commander');
const path = require('node:path');

program
  .description('Starts the React Native Metro bundler for internal testing app')
  .action(async options => {
    await startCommand.func(
      [],
      {
        platforms: {
          ios: {},
          android: {},
        },
        root: path.join(__dirname, '../'),
        reactNativePath: path.join(__dirname, '../../../packages/react-native'),
      },
      {
        experimentalDebugger: false,
        interactive: false,
        projectRoot: options.projectRoot,
        platforms: ['ios', 'android'],
      },
    );
  })
  .parse();
