/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ConfigT, InputConfigT} from 'metro-config';

import {getDefaultConfig as getBaseConfig, mergeConfig} from 'metro-config';

export type {MetroConfig} from 'metro-config';

const INTERNAL_CALLSITES_REGEX = new RegExp(
  [
    '/react-native/Libraries/BatchedBridge/MessageQueue\\.js$',
    '/react-native/Libraries/Core/.+\\.js$',
    '/react-native/Libraries/LogBox/.+\\.js$',
    '/react-native/Libraries/Network/.+\\.js$',
    '/react-native/Libraries/Pressability/.+\\.js$',
    '/react-native/Libraries/Renderer/implementations/.+\\.js$',
    '/react-native/Libraries/Utilities/.+\\.js$',
    '/react-native/Libraries/vendor/.+\\.js$',
    '/react-native/Libraries/WebSocket/.+\\.js$',
    '/react-native/src/private/renderer/errorhandling/.+\\.js$',
    '/metro-runtime/.+\\.js$',
    '/node_modules/@babel/runtime/.+\\.js$',
    '/node_modules/@react-native/js-polyfills/.+\\.js$',
    '/node_modules/invariant/.+\\.js$',
    '/node_modules/react-devtools-core/.+\\.js$',
    '/node_modules/react-native/index.js$',
    '/node_modules/react-refresh/.+\\.js$',
    '/node_modules/scheduler/.+\\.js$',
    '^\\[native code\\]$',
  ]
    // Make patterns work with both Windows and POSIX paths.
    .map(pathPattern => pathPattern.replaceAll('/', '[/\\\\]'))
    .join('|'),
);

export {mergeConfig} from 'metro-config';

let frameworkDefaults: InputConfigT = {};
export function setFrameworkDefaults(config: InputConfigT) {
  frameworkDefaults = config;
}

/**
 * Get the base Metro configuration for a React Native project.
 */
export function getDefaultConfig(projectRoot: string): ConfigT {
  const reactNativeDefaults = {
    resolver: {
      resolverMainFields: ['react-native', 'browser', 'main'],
      platforms: ['android', 'ios'],
      unstable_conditionNames: ['react-native'],
    },
    serializer: {
      // NOTE: Overridden in community-cli-plugin
      getModulesRunBeforeMainModule: () => [
        require.resolve('react-native/setup-env'),
      ],
      getPolyfills: () => require('@react-native/js-polyfills')(),
      isThirdPartyModule({path: modulePath}: Readonly<{path: string, ...}>) {
        return (
          INTERNAL_CALLSITES_REGEX.test(modulePath) ||
          /(?:^|[/\\])node_modules[/\\]/.test(modulePath)
        );
      },
    },
    server: {
      port: Number(process.env.RCT_METRO_PORT) || 8081,
    },
    symbolicator: {
      customizeFrame: (frame: Readonly<{file: ?string, ...}>) => {
        const collapse = Boolean(
          frame.file != null && INTERNAL_CALLSITES_REGEX.test(frame.file),
        );
        return {collapse};
      },
    },
    transformer: {
      allowOptionalDependencies: true,
      assetRegistryPath: 'react-native/asset-registry',
      asyncRequireModulePath:
        require.resolve('metro-runtime/src/modules/asyncRequire'),
      babelTransformerPath:
        require.resolve('@react-native/metro-babel-transformer'),
      getTransformOptions: async () => ({
        transform: {
          experimentalImportSupport: false,
          inlineRequires: true,
        },
      }),
    },
    watchFolders: [],
  };

  const metroDefaults = getBaseConfig.getDefaultValues(projectRoot);

  return mergeConfig(metroDefaults, reactNativeDefaults, frameworkDefaults);
}
