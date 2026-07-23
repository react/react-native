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

import type {Greeting} from '../common';

import {formatGreeting} from '../common';
import {NativeModules, Platform} from 'react-native';

export function greet(g: Greeting): Promise<string> {
  const TestLibraryApple = NativeModules.TestLibraryApple;
  if (TestLibraryApple == null) {
    return Promise.reject(
      new Error(
        `react-native-test-library-apple: native module unavailable on ${Platform.OS}. This package is iOS-only; install a platform-specific sibling (e.g. react-native-test-library-android) for cross-platform coverage.`,
      ),
    );
  }
  return TestLibraryApple.echo(formatGreeting(g));
}
