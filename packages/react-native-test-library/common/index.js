/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import {NativeModules, Platform} from 'react-native';

export type Greeting = Readonly<{
  name: string,
  language: string,
}>;

export function formatGreeting(g: Greeting): string {
  return `[${g.language}] Hello, ${g.name}!`;
}

export function getVersion(): Promise<string> {
  const TestLibraryCommon = NativeModules.TestLibraryCommon;
  if (TestLibraryCommon == null) {
    return Promise.reject(
      new Error(
        `react-native-test-library-common: native module unavailable on ${Platform.OS}.`,
      ),
    );
  }
  return TestLibraryCommon.version();
}
