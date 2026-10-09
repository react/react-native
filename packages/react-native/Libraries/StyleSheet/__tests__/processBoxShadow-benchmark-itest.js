/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import processBoxShadow from '../processBoxShadow';
import * as Fantom from '@react-native/fantom';

const REPEATED_BOX_SHADOW =
  '0 1px 2px rgba(0, 0, 0, 0.2), inset 0 0 0 1px #ffffff';

let uniqueInputOffset = 0;

function processRepeatedBoxShadows(count: number): void {
  for (let i = 0; i < count; i++) {
    processBoxShadow(REPEATED_BOX_SHADOW);
  }
}

function processUniqueBoxShadows(count: number): void {
  const offset = uniqueInputOffset;
  uniqueInputOffset += count;
  for (let i = 0; i < count; i++) {
    processBoxShadow(`${(offset + i).toString()}px 1px 2px rgba(0, 0, 0, 0.2)`);
  }
}

Fantom.unstable_benchmark
  .suite('processBoxShadow')
  .test.each(
    [100, 1000],
    count => `process the same string ${count.toString()} times`,
    processRepeatedBoxShadows,
  )
  .test.each(
    [100, 1000],
    count => `process ${count.toString()} unique strings`,
    processUniqueBoxShadows,
  );
