/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {FantomTestConfig} from './getFantomTestConfigs';

import formatFantomConfig from './formatFantomConfig';
import path from 'path';

export const PROJECT_ROOT: string = path.resolve(__dirname, '..', '..', '..');

export const OUTPUT_PATH: string = path.resolve(__dirname, '..', '.out');
export const JS_BUILD_OUTPUT_PATH: string = path.join(OUTPUT_PATH, 'js-builds');
export const NATIVE_BUILD_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'native-builds',
);
export const JS_TRACES_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'js-traces',
);
export const CPP_TRACES_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'cpp-traces',
);
export const JS_HEAP_SNAPSHOTS_OUTPUT_PATH: string = path.join(
  OUTPUT_PATH,
  'js-heap-snapshots',
);

export function getTestBuildOutputPath(): string {
  const fantomRunID = process.env.__FANTOM_RUN_ID__;
  if (fantomRunID == null) {
    throw new Error(
      'Expected Fantom run ID to be set by global setup, but it was not (process.env.__FANTOM_RUN_ID__ is null)',
    );
  }

  return path.join(JS_BUILD_OUTPUT_PATH, fantomRunID);
}

export function buildJSTracesOutputPath({
  testPath,
  testConfig,
  isMultiConfigTest,
}: {
  testPath: string,
  testConfig: FantomTestConfig,
  isMultiConfigTest: boolean,
}): string {
  const fileNameParts = [path.basename(testPath)];

  if (isMultiConfigTest) {
    const configSummary = formatFantomConfig(testConfig, {style: 'short'});
    if (configSummary !== '') {
      fileNameParts.push(configSummary);
    }
  }

  fileNameParts.push(new Date().toISOString());

  const fileName = fileNameParts.join('-') + '.cpuprofile';

  return path.join(JS_TRACES_OUTPUT_PATH, fileName);
}

const JS_HEAP_SNAPSHOT_OUTPUT_PATH_TOKEN = '${timestamp}';

export function buildJSHeapSnapshotsOutputPathTemplate({
  testPath,
  testConfig,
  isMultiConfigTest,
}: {
  testPath: string,
  testConfig: FantomTestConfig,
  isMultiConfigTest: boolean,
}): [string, string] {
  const fileNameParts = [path.basename(testPath)];

  if (isMultiConfigTest) {
    const configSummary = formatFantomConfig(testConfig, {style: 'short'});
    if (configSummary !== '') {
      fileNameParts.push(configSummary);
    }
  }

  fileNameParts.push(JS_HEAP_SNAPSHOT_OUTPUT_PATH_TOKEN);

  const fileName = fileNameParts.join('-') + '.heapsnapshot';

  return [
    path.join(JS_HEAP_SNAPSHOTS_OUTPUT_PATH, fileName),
    JS_HEAP_SNAPSHOT_OUTPUT_PATH_TOKEN,
  ];
}
