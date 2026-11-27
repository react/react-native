/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @fantom_mode dev
 */

/**
 * We force the DEV mode, because Fusebox infra is not installed in production builds.
 * We want to benchmark the implementation, not the polyfill.
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';

const fn = () => {};

Fantom.unstable_benchmark
  .suite('console.createTask', {
    minIterations: 50000,
    disableOptimizedBuildCheck: true,
  })
  .test('JavaScript shim', () => {
    const task: ConsoleTask = {run: cb => cb()};
    task.run(fn);
  })
  .test('implementation', () => {
    const task = console.createTask('task');
    task.run(fn);
  });
