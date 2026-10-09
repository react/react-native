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

import INTERNAL_CALLSITES_PATTERNS from './internalCallsites.json';
import {getDefaultConfig as getBaseConfig, mergeConfig} from 'metro-config';

export type {MetroConfig} from 'metro-config';

const INTERNAL_CALLSITES_REGEX = new RegExp(
  INTERNAL_CALLSITES_PATTERNS
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
