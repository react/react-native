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

const {task} = require('./utils');
const debug = require('debug');
const execa = require('execa');
const fs = require('fs');
const path = require('path');

const log = debug('core-cli-utils');

/*::
type BundlerOptions = {
  // Metro's config: https://metrobundler.dev/docs/configuration/
  config?: string,
  // Typically index.{ios,android}.js
  entryFile: string,
  readonly platform: 'ios' | 'android' | string,
  dev: boolean,
  // Metro built main bundle
  outputJsBundle: string,
  minify: boolean,
  optimize: boolean,
  // Generate a source map file
  outputSourceMap: string,
  // Where to pass the final bundle. Typically this is the App's resource
  // folder, however this is app specific. React Native will need to know where
  // this is to bootstrap your application.  See:
  // - Android: https://reactnative.dev/docs/integration-with-existing-apps?language=kotlin#creating-a-release-build-in-android-studio
  // - iOS: https://reactnative.dev/docs/integration-with-existing-apps?language=swift#2-event-handler
  outputBundle: string,
  cwd: string,

  jsvm: 'hermes' | 'jsc',
  hermes?: HermesConfig,

  ...Bundler,
};

type HermesConfig = {
  // Path where hermes is is installed
  // iOS: Pods/hermes-engine
  path: string,
  // iOS: <hermes.path>/destroot/bin/hermesc
  hermesc: string,
};

type BundlerWatch = {
  readonly mode: 'watch',
  callback?: (metro: ExecaPromise) => void,
};

type BundlerBuild = {
  readonly mode: 'bundle',
};

type Bundler = BundlerWatch | BundlerBuild;

type Bundle = {
  validate?: Task<void>,
  javascript: Task<ExecaPromise>,
  sourcemap?: Task<void>,
  validateHermesc?: Task<ExecaPromise>,
  convert?: Task<ExecaPromise>,
  compose?: Task<ExecaPromise>,
};
*/

const FIRST = 1,
  SECOND = 2,
  THIRD = 3,
  FOURTH = 4;

function getNodePackagePath(packageName /*: string */) /*: string */ {
  // $FlowFixMe[prop-missing] type definition is incomplete
  return require.resolve(packageName, {cwd: [process.cwd(), ...module.paths]});
}

function metro(...args /*: ReadonlyArray<string> */) /*: ExecaPromise */ {
  log(`🚇 metro ${args.join(' ')} `);
  return execa('npx', ['--offline', 'metro', ...args]);
}

const tasks = {
  bundle: (
    options /*: BundlerOptions */,
    ...args /*: ReadonlyArray<string> */
  ) /*: Bundle */ => {
    const steps /*: Bundle */ = {
      /* eslint-disable sort-keys */
      validate: task(FIRST, 'Check if Metro is available', () => {
        try {
          require('metro');
        } catch {
          throw new Error('Metro is not available');
        }
      }),
      javascript: task(SECOND, 'Metro watching for changes', () =>
        metro('serve', ...args),
      ),
    };

    return options.mode === 'bundle'
      ? // $FlowFixMe[unsafe-object-assign]
        Object.assign(steps, bundleApp(options, ...args))
      : steps;
  },
};

const bundleApp = (
  options /*: BundlerOptions */,
  ...metroArgs /*: ReadonlyArray<string> */
) => {
  if (options.outputJsBundle === options.outputBundle) {
    throw new Error('outputJsBundle and outputBundle cannot be the same.');
  }
  let output =
    options.jsvm === 'hermes' ? options.outputJsBundle : options.outputBundle;

  if (output === options.outputJsBundle && !output.endsWith('.js')) {
    log(
      `Appending .js to outputBundle (because metro cli does it if it's missing): ${output}`,
    );
    output += '.js';
  }

  const isSourceMaps = options.outputSourceMap != null;
  const bundle /*: Bundle */ = {
    javascript: task(SECOND, 'Metro generating an .jsbundle', () => {
      const args = [
        '--platform',
        options.platform,
        '--dev',
        options.dev ? 'true' : 'false',
        '--reset-cache',
        '--out',
        output,
      ];
      if (options.jsvm === 'hermes' && !options.dev) {
        args.push('--minify', 'false');
      } else {
        args.push('--minify', options.minify ? 'true' : 'false');
      }
      if (isSourceMaps) {
        args.push('--source-map');
      }
      return metro('build', options.entryFile, ...args, ...metroArgs);
    }),
  };

  if (options.jsvm === 'jsc') {
    return bundle;
  }

  if (options.hermes?.path == null || options.hermes?.hermesc == null) {
    throw new Error('If jsvm == "hermes", hermes config must be provided.');
  }

  const hermes /*: HermesConfig */ = options.hermes;

  const isHermesInstalled /*: boolean */ = fs.existsSync(hermes.path);
  if (!isHermesInstalled) {
    throw new Error(
      'Hermes Pod must be installed before bundling.\n' +
        'Did you forget to bootstrap?',
    );
  }

  const hermesc /*: string */ = path.join(hermes.path, hermes.hermesc);

  let composeSourceMaps;
  if (isSourceMaps) {
    bundle.sourcemap = task(
      FIRST,
      'Check if SourceMap script available',
      () => {
        composeSourceMaps = getNodePackagePath(
          'react-native/scripts/compose-source-maps.js',
        );
      },
    );
  }

  bundle.validateHermesc = task(FIRST, 'Check if Hermesc is available', () =>
    execa(hermesc, ['--version']),
  );

  bundle.convert = task(
    THIRD,
    'Hermesc converting .jsbundle → bytecode',
    () => {
      const args = [
        '-emit-binary',
        '-max-diagnostic-width=80',
        options.dev === true ? '-Og' : '-O',
      ];
      if (isSourceMaps) {
        args.push('-output-source-map');
      }
      args.push(`-out=${options.outputBundle}`, output);
      return execa(hermesc, args, {cwd: options.cwd});
    },
  );

  bundle.compose = task(FOURTH, 'Compose Hermes and Metro source maps', () => {
    if (composeSourceMaps == null) {
      throw new Error(
        'Unable to find the compose-source-map.js script in react-native',
      );
    }
    const metroSourceMap = output.replace(/(\.js)?$/, '.map');
    const hermesSourceMap = options.outputBundle + '.map';
    const compose = execa(
      'node',
      [
        composeSourceMaps,
        metroSourceMap,
        hermesSourceMap,
        `-o ${options.outputSourceMap}`,
      ],
      {
        cwd: options.cwd,
      },
    );
    compose.finally(() => {
      fs.rmSync(metroSourceMap, {force: true});
      fs.rmSync(hermesSourceMap, {force: true});
    });
    return compose;
  });

  return bundle;
};

module.exports = {tasks};
