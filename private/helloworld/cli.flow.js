/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {run} from './lib/cli';
import {getExistingPath, pauseWatchman} from './lib/filesystem';
import {
  bootSimulator,
  getSimulatorDetails,
  getXcodeBuildSettings,
  hasPodInstalled,
  launchApp,
  launchSimulator,
} from './lib/ios';
import {android, app, apple} from '@react-native/core-cli-utils';
import {Command, Option, program} from 'commander';
import {readFileSync} from 'fs';
import {Listr} from 'listr2';
import path from 'path';

program.version(JSON.parse(readFileSync('./package.json', 'utf8')).version);

const bootstrap = program.command('bootstrap');

const cwd = {
  ios: path.join(__dirname, 'ios'),
  android: path.join(__dirname, 'android'),
  root: __dirname,
};

const possibleHermescPaths = [
  // OSS checkout
  'destroot/bin/hermesc',
  // internal
  'build_host_hermesc/bin/hermesc',
];

type BootstrapOptions = {
  arch: 'old' | 'new',
  jsvm: 'hermes' | 'jsc',
  frameworks?: 'static' | 'dynamic',
};

bootstrap
  .command('ios')
  .description('Bootstrap iOS')
  .addOption(
    new Option('--arch <arch>', "Choose React Native's architecture")
      .choices(['new', 'old'])
      .default('new'),
  )
  .addOption(
    new Option(
      '--frameworks <linkage>',
      'Use frameworks instead of static libraries',
    )
      .choices(['static', 'dynamic'])
      .default(undefined),
  )
  .addOption(
    new Option('--jsvm <vm>', 'Choose VM used on device')
      .choices(['jsc', 'hermes'])
      .default('hermes'),
  )
  .action(async ({jsvm, arch, frameworks}: BootstrapOptions) => {
    await run(
      apple.bootstrap({
        cwd: cwd.ios,
        frameworks,
        hermes: jsvm === 'hermes',
        newArchitecture: arch === 'new',
      }),
    );
  });

type BuildOptions = {
  device: string,
  arch: 'old' | 'new',
  prod: boolean,
};

const optionalBool = (value: string | void) => value?.toLowerCase() === 'true';

type BuildSettings = {
  appPath: string,
  bundleId: string,
  bundleBuildDir: string,
  bundleResourceDir: string,
};

const getBuildSettings = (mode: 'Debug' | 'Release'): BuildSettings => {
  const xcode = getXcodeBuildSettings(cwd.ios, mode)[0].buildSettings;
  return {
    appPath: path.join(xcode.TARGET_BUILD_DIR, xcode.EXECUTABLE_FOLDER_PATH),
    bundleId: xcode.PRODUCT_BUNDLE_IDENTIFIER,
    bundleBuildDir: xcode.CONFIGURATION_BUILD_DIR,
    bundleResourceDir: path.join(
      xcode.CONFIGURATION_BUILD_DIR,
      xcode.UNLOCALIZED_RESOURCES_FOLDER_PATH,
    ),
  };
};

const build = program.command('build');

type AndroidBuildOptions = {
  device: string,
  arch: 'old' | 'new',
  jsvm: 'hermes' | 'jsc',
  prod: boolean,
  P: string[],
};

build
  .command('android')
  .addOption(
    new Option('--arch <arch>', "Choose React Native's architecture")
      .choices(['new', 'old'])
      .default('new'),
  )
  .addOption(
    new Option('--jsvm <vm>', 'Choose VM used on device')
      .choices(['jsc', 'hermes'])
      .default('hermes'),
  )
  .option('--prod', 'Production build', () => true, false)
  .addOption(
    new Option('-P <value>', 'Additional Gradle project properties')
      .argParser((value, previous: string[] = []) => previous.concat(value))
      .default([]),
  )
  .action(
    async ({prod, jsvm, arch, P}: AndroidBuildOptions, options: Command) => {
      const mode = prod ? 'Release' : 'Debug';
      const {assemble} = android({
        cwd: cwd.android,
        hermes: jsvm === 'hermes',
        mode,
        name: 'app',
        newArchitecture: arch === 'new',
      });
      await run(assemble(...P.map(prop => `-P${prop}`), ...options.args));
    },
  );

build
  .command('ios')
  .description('Builds your app for iOS')
  .option(
    '--device',
    'Any simulator or a specific device (choices: "simulator", "device", other)',
    'simulator',
  )
  .option('--prod', 'Production build', () => true, false)
  .action(async ({device: _device, prod}: BuildOptions) => {
    const mode = prod ? 'Release' : 'Debug';

    let destination = 'simulator';
    switch (_device) {
      case 'simulator':
        break;
      case 'device':
        const device = await getSimulatorDetails(_device);
        destination = `id=${device.udid}`;
        break;
      default:
        destination = _device;
        break;
    }

    await pauseWatchman(async () => {
      await run(
        apple.build({
          isWorkspace: true,
          name: 'HelloWorld.xcworkspace',
          mode,
          scheme: 'HelloWorld',
          cwd: cwd.ios,
          env: {
            SKIP_BUNDLING: 'true',
          },
          destination,
        }),
      );
    });
  });

type BundleOptions = {
  prod: boolean,
  watch: boolean,
};

const bundle = program.command('bundle');

bundle
  .command('ios')
  .option('--watch', 'Watch and update JS changes', optionalBool, false)
  .option('--prod', 'Production build', () => true, false)
  .action(async ({prod, watch}: BundleOptions) => {
    const mode = prod ? 'Release' : 'Debug';

    const isHermesInstalled = hasPodInstalled(cwd.ios, 'hermes-engine');
    const settings = await getBuildSettings(mode);

    // Metro: src -> js
    const jsBundlePath = path.join(settings.bundleBuildDir, 'main.jsbundle.js');
    // Hermes: js -> Hermes Byte Code
    const binaryBundlePath = path.join(
      settings.bundleResourceDir,
      'main.jsbundle',
    );

    // Validate only after initial build, as hermesc may not be prebuilt
    const hermesFolder = path.join(cwd.ios, 'Pods/hermes-engine');
    const hermesc = getExistingPath(hermesFolder, possibleHermescPaths);

    if (hermesc == null && isHermesInstalled) {
      throw new Error(
        `Unable to find hermesc at:\n-${possibleHermescPaths
          .map(line => ' - ' + line)
          .join('\n')}`,
      );
    }

    const bundler = watch
      ? app.bundle({
          mode: 'watch',
          cwd: cwd.root,
          entryFile: 'index.js',
          platform: 'ios',
          outputJsBundle: jsBundlePath,
          minify: false,
          optimize: false,
          outputSourceMap: settings.bundleResourceDir,
          outputBundle: binaryBundlePath,
          dev: !prod,
          jsvm: isHermesInstalled ? 'hermes' : 'jsc',
          hermes: {
            path: hermesFolder,
            hermesc: hermesc ?? '',
          },
          callback: metroProcess => {
            const readline = require('readline');
            readline.emitKeypressEvents(process.stdin);
            process.stdout.write('Press any key to close Metro...');
            // $FlowFixMe[prop-missing]
            process.stdin.setRawMode(true);
            process.stdin.once('keypress', () => {
              metroProcess.kill('SIGTERM');
            });
          },
        })
      : app.bundle({
          mode: 'bundle',
          cwd: cwd.root,
          entryFile: 'index.js',
          platform: 'ios',
          outputJsBundle: jsBundlePath,
          minify: false,
          optimize: false,
          outputSourceMap: settings.bundleResourceDir,
          outputBundle: binaryBundlePath,
          dev: !prod,
          jsvm: isHermesInstalled ? 'hermes' : 'jsc',
          hermes: {
            path: hermesFolder,
            hermesc: hermesc ?? '',
          },
        });

    // JS Bundle
    await run(bundler);
  });

type ShipOptions = {
  prod: boolean,
  device: string,
};

const installAndRun = program.command('install-and-run');

installAndRun
  .command('ios')
  .option('--prod', 'Production build')
  .option('--device', 'Any simulator or a specific device', 'simulator')
  .action(async ({device: _device, prod}: ShipOptions) => {
    const [device, settings] = await Promise.all([
      getSimulatorDetails(_device),
      getBuildSettings(prod ? 'Release' : 'Debug'),
    ]);

    const {install} = apple.ios.install({
      cwd: cwd.ios,
      device: device.udid,
      appPath: settings.appPath,
      bundleId: settings.bundleId,
    });

    await new Listr([
      {
        title: 'Booting simulator',
        task: (_: unknown, task) => {
          if (device.state === 'Booted') {
            task.skip('Simulator currently Booted');
          } else {
            return bootSimulator(device);
          }
        },
      },
      {
        title: 'Launching simulator',
        task: () => launchSimulator(device),
      },
      {
        title: 'Installing app on simulator',
        task: () => install.action(),
      },
      {
        title: 'Launching app on simulator',
        task: () => launchApp(device.udid, settings.bundleId),
      },
    ]).run();
  });

if (require.main === module) {
  program.parse();
}

export default program;
