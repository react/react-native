/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

/*::
import type {Task} from './types';
import type {ExecaPromise} from 'execa';
*/

const {isWindows, task} = require('./utils');
const execa = require('execa');

/*::
type AndroidBuildMode = 'Debug' | 'Release';

type Path = string;
type Args = ReadonlyArray<string>;

type Config = {
  cwd: Path,
  hermes?: boolean,
  mode: AndroidBuildMode,
  name: string,
  newArchitecture?: boolean,
  sdk?: Path,
};
*/

function gradle(
  taskName /*: string */,
  args /*: Args */,
  options /*: {cwd: string, env?: {[k: string]: string | void}} */,
) /*: ExecaPromise */ {
  const gradlew = isWindows ? 'gradlew.bat' : './gradlew';
  return execa(gradlew, [taskName, ...args], {
    cwd: options.cwd,
    env: options.env,
  });
}

function androidSdkPath(sdk /*: ?string */) /*: string */ {
  return sdk ?? process.env.ANDROID_HOME ?? process.env.ANDROID_SDK ?? '';
}

function boolToStr(value /*: boolean */) /*: string */ {
  return value ? 'true' : 'false';
}

const FIRST = 1;

//
// Android Tasks
//
/*::
type AndroidTasks = {
  assemble: (...gradleArgs: Args) => {
    run: Task<ExecaPromise>,
  },
  build: (...gradleArgs: Args) => {
    run: Task<ExecaPromise>,
  },
  install: (...gradleArgs: Args) => {
    run: Task<ExecaPromise>,
  },
};
*/

const tasks = (config /*: Config */) /*: AndroidTasks */ => ({
  assemble: (...gradleArgs /*: Args */) => ({
    run: task(FIRST, 'Assemble Android App', () => {
      const args = [];
      if (config.hermes != null) {
        args.push(`-PhermesEnabled=${boolToStr(config.hermes)}`);
      }
      if (config.newArchitecture != null) {
        args.push(`-PnewArchEnabled=${boolToStr(config.newArchitecture)}`);
      }
      args.push(...gradleArgs);
      return gradle(`${config.name}:assemble${config.mode}`, gradleArgs, {
        cwd: config.cwd,
        env: {ANDROID_HOME: androidSdkPath(config.sdk)},
      });
    }),
  }),
  build: (...gradleArgs /*: Args */) => ({
    run: task(FIRST, 'Assembles and tests Android App', () => {
      const args = [];
      if (config.hermes != null) {
        args.push(`-PhermesEnabled=${boolToStr(config.hermes)}`);
      }
      if (config.newArchitecture != null) {
        args.push(`-PnewArchEnabled=${boolToStr(config.newArchitecture)}`);
      }
      args.push(...gradleArgs);
      return gradle(`${config.name}:bundle${config.mode}`, args, {
        cwd: config.cwd,
        env: {ANDROID_HOME: androidSdkPath(config.sdk)},
      });
    }),
  }),
  /**
   * Useful extra gradle arguments:
   *
   *
   * -PreactNativeDevServerPort=8081 sets the port for the installed app to point towards a Metro
   *                                 server on (for example) 8081.
   */
  install: (...gradleArgs /*: Args */) => ({
    run: task(FIRST, 'Installs the assembled Android App', () =>
      gradle(`${config.name}:install${config.mode}`, gradleArgs, {
        cwd: config.cwd,
        env: {ANDROID_HOME: androidSdkPath(config.sdk)},
      }),
    ),
  }),

  // We are not supporting launching the app and setting up the tunnel for metro <-> app, this is
  // a framework concern. For an example of how one could do this, please look at the community
  // CLI's code:
  // https://github.com/react-native-community/cli/blob/54d48a4e08a1aef334ae6168788e0157a666b4f5/packages/cli-platform-android/src/commands/runAndroid/index.ts#L272C1-L290C2
});

module.exports = {tasks};
