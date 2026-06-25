/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {SnapshotConfig} from '../runtime/snapshotContext';
import type {FantomRuntimeConstants, HostPlatform} from '../src/Constants';
import type {FantomTestConfig} from './getFantomTestConfigs';

import * as EnvironmentOptions from './EnvironmentOptions';
import formatFantomConfig from './formatFantomConfig';

function getHostPlatform(): HostPlatform {
  match (process.platform) {
    'darwin' => {
      return 'macos';
    }
    'win32' => {
      return 'windows';
    }
    'linux' => {
      return 'linux';
    }
    'android' => {
      return 'android';
    }
    _ => {
      throw new Error(`Unsupported platform: ${process.platform}`);
    }
  }
}

module.exports = function entrypointTemplate({
  testPath,
  setupModulePath,
  featureFlagsModulePath,
  testConfig,
  snapshotConfig,
  jsTraceOutputPath,
  jsHeapSnapshotOutputPathTemplate,
  jsHeapSnapshotOutputPathTemplateToken,
}: {
  testPath: string,
  setupModulePath: string,
  featureFlagsModulePath: string,
  testConfig: FantomTestConfig,
  snapshotConfig: SnapshotConfig,
  jsHeapSnapshotOutputPathTemplate: string,
  jsHeapSnapshotOutputPathTemplateToken: string,
  jsTraceOutputPath: ?string,
}): string {
  const constants: FantomRuntimeConstants = {
    isOSS: EnvironmentOptions.isOSS,
    isRunningFromCI: EnvironmentOptions.isCI,
    runBenchmarks: EnvironmentOptions.runBenchmarks,
    fantomConfigSummary: formatFantomConfig(testConfig),
    jsTraceOutputPath,
    jsHeapSnapshotOutputPathTemplate,
    jsHeapSnapshotOutputPathTemplateToken,
    hostPlatform: getHostPlatform(),
  };

  return `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated
 * @noformat
 * @noflow
 */

import {registerTest} from '${setupModulePath}';
import {setConstants} from '@react-native/fantom/src/Constants';

${
  Object.keys(testConfig.flags.jsOnly).length > 0
    ? `import * as ReactNativeFeatureFlags from '${featureFlagsModulePath}';

ReactNativeFeatureFlags.override({
${Object.entries(testConfig.flags.jsOnly)
  .map(([name, value]) => `  ${name}: () => ${JSON.stringify(value)},`)
  .join('\n')}
});`
    : ''
}
${
  Object.keys(testConfig.flags.reactInternal).length > 0
    ? `import ReactNativeInternalFeatureFlags from 'ReactNativeInternalFeatureFlags';
  ${Object.entries(testConfig.flags.reactInternal)
    .map(
      ([name, value]) =>
        `ReactNativeInternalFeatureFlags.${name} = ${JSON.stringify(value)};`,
    )
    .join('\n')}`
    : ''
}

setConstants(${JSON.stringify(constants)});

registerTest(() => require('${testPath}'), ${JSON.stringify(snapshotConfig)});
`;
};
