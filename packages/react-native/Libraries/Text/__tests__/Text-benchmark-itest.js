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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Text} from 'react-native';

let root;
let testElements: React.MixedElement;

Fantom.unstable_benchmark
  .suite('Text')
  .test.each(
    [100, 1000],
    n =>
      `render ${n.toString()} text component instances with no explicit props`,
    () => {
      Fantom.runTask(() => root.render(testElements));
    },
    n => ({
      beforeAll: () => {
        testElements = (
          <>
            {[...Array(n).keys()].map(i => (
              <Text />
            ))}
          </>
        );
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  )
  .test.each(
    [100, 1000],
    n => `render ${n.toString()} text component instances`,
    () => {
      Fantom.runTask(() => root.render(testElements));
    },
    n => ({
      beforeAll: () => {
        testElements = (
          <>
            {[...Array(n).keys()].map(i => (
              <Text
                id={String(i)}
                nativeID={String(i)}
                style={{
                  width: i + 1,
                  height: i + 1,
                }}>{`Text instance ${i}`}</Text>
            ))}
          </>
        );
      },
      beforeEach: () => {
        root = Fantom.createRoot();
      },
      afterEach: () => {
        root.destroy();
      },
    }),
  );
