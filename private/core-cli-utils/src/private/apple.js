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

const {assertDependencies, isOnPath, task} = require('./utils');
const execa = require('execa');
const fs = require('fs');
const path = require('path');

/*::
type AppleBuildMode = 'Debug' | 'Release';

type AppleBuildOptions = {
  isWorkspace: boolean,
  name: string,
  mode: AppleBuildMode,
  scheme?: string,
  destination: 'device' | 'simulator' | string,
  ...AppleOptions,
};

type AppleBootstrapOption = {
  // Enabled by default
  hermes: boolean,
  newArchitecture: boolean,
  frameworks?: 'static' | 'dynamic',
  ...AppleOptions,
};

type AppleInstallApp = {
  // Install the app on a simulator or device, typically this is the description from
  // `xcrun simctl list devices`
  device: string,
  appPath: string,
  bundleId: string,
  ...AppleOptions,
};

type AppleOptions = {
  // The directory where the Xcode project is located
  cwd: string,
  // The environment variables to pass to the build command
  env?: {[key: string]: string | void, ...},
};
*/

function checkPodfileInSyncWithManifest(
  lockfilePath /*: string */,
  manifestLockfilePath /*: string */,
) {
  try {
    const expected = fs.readFileSync(lockfilePath, 'utf8');
    const found = fs.readFileSync(manifestLockfilePath, 'utf8');
    if (expected !== found) {
      throw new Error(
        'Please run: yarn bootstrap ios, Podfile.lock and Pods/Manifest.lock are out of sync',
      );
    }
  } catch (e /*: unknown */) {
    throw new Error('Please run: yarn run bootstrap ios: ' + String(e));
  }
}

const FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4,
  FIFTH = 5;

function getNodePackagePath(packageName /*: string */) /*: string */ {
  // $FlowFixMe[prop-missing] type definition is incomplete
  return require.resolve(packageName, {cwd: [process.cwd(), ...module.paths]});
}

/*::
type BootstrapTasks = {
  cleanupBuildFolder: Task<void>,
  runCodegen: Task<void>,
  validate: Task<void>,
  installRubyGems: Task<ExecaPromise>,
  installDependencies: Task<ExecaPromise>,
};

type BuildTasks = {
  validate: Task<void>,
  hasPodsInstalled: Task<void>,
  build: Task<ExecaPromise>,
};

type InstallTasks = {
  validate: Task<void>,
  install: Task<ExecaPromise>,
};
*/

/* eslint sort-keys: "off" */
const tasks = {
  // 1. Setup your environment for building the iOS apps
  bootstrap: (options /*: AppleBootstrapOption */) /*: BootstrapTasks */ => ({
    cleanupBuildFolder: task(FIRST, 'Cleanup build folder', () => {
      execa.sync('rm', ['-rf', 'build'], {
        cwd: options.cwd,
      });
    }),
    runCodegen: task(SECOND, 'Run codegen', () => {
      const reactNativePath = path.dirname(getNodePackagePath('react-native'));
      const codegenScript = path.join(
        reactNativePath,
        'scripts',
        'generate-codegen-artifacts.js',
      );
      execa.sync('node', [
        codegenScript,
        '-p',
        process.cwd(),
        '-o',
        options.cwd,
        '-t',
        'ios',
      ]);
    }),
    validate: task(THIRD, 'Check Cocoapods and bundle are available', () => {
      assertDependencies(
        isOnPath('pod', 'CocoaPods'),
        isOnPath('bundle', "Bundler to manage Ruby's gems"),
      );
    }),
    installRubyGems: task(FOURTH, 'Install Ruby Gems', () =>
      execa('bundle', ['install'], {
        cwd: options.cwd,
      }),
    ),
    installDependencies: task(FIFTH, 'Install CocoaPods dependencies', () => {
      const env /*: {[string]: string | void} */ = {
        RCT_NEW_ARCH_ENABLED: options.newArchitecture ? '1' : '0',
        USE_FRAMEWORKS: options.frameworks,
        USE_HERMES: options.hermes ? '1' : '0',
        RCT_IGNORE_PODS_DEPRECATION: '1',
      };
      if (options.frameworks == null) {
        delete env.USE_FRAMEWORKS;
      }
      return execa('bundle', ['exec', 'pod', 'install'], {
        cwd: options.cwd,
        env,
      });
    }),
  }),

  // 2. Build the iOS app using a setup environment
  build: (
    options /*: AppleBuildOptions */,
    ...args /*: ReadonlyArray<string> */
  ) /*: BuildTasks */ => ({
    validate: task(
      FIRST,
      "Check you've run xcode-select --install for xcodebuild",
      () => {
        assertDependencies(isOnPath('xcodebuild', 'Xcode Commandline Tools'));
      },
    ),
    hasPodsInstalled: task(FIRST, 'Check Pods are installed', () => {
      for (const file of ['Podfile.lock', 'Pods']) {
        try {
          fs.accessSync(
            path.join(options.cwd, file),
            /* eslint-disable-next-line no-bitwise */
            fs.constants.F_OK | fs.constants.R_OK,
          );
        } catch (e /*: unknown */) {
          throw new Error('Please run: yarn run bootstrap ios: ' + String(e));
        }
      }
      checkPodfileInSyncWithManifest(
        path.join(options.cwd, 'Podfile.lock'),
        path.join(options.cwd, 'Pods/Manifest.lock'),
      );
    }),
    build: task(SECOND, 'build an app artifact', () => {
      const _args = [
        options.isWorkspace ? '-workspace' : '-project',
        options.name,
        '-configuration',
        options.mode,
      ];
      if (options.scheme != null) {
        _args.push('-scheme', options.scheme);
      }
      if (options.destination != null) {
        switch (options.destination) {
          case 'simulator':
            _args.push('-sdk', 'iphonesimulator');
            break;
          case 'device':
          default:
            _args.push('-destination', options.destination);
            break;
        }
      }

      _args.push(...args);
      return execa('xcodebuild', _args, {cwd: options.cwd, env: options.env});
    }),
  }),

  // 3. Install the built app on a simulator or device
  ios: {
    install: (options /*: AppleInstallApp */) /*: InstallTasks */ => ({
      validate: task(
        FIRST,
        "Check you've run xcode-select --install for xcrun",
        () => {
          assertDependencies(
            isOnPath('xcrun', 'An Xcode Commandline tool: xcrun'),
          );
        },
      ),
      install: task(SECOND, 'Install the app on a simulator', () =>
        execa('xcrun', ['simctl', 'install', options.device, options.appPath], {
          cwd: options.cwd,
          env: options.env,
        }),
      ),
    }),
  },
};

module.exports = {tasks};
