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
import {Image} from 'react-native';

const IMAGE1 = require('./img/img1.png');
const IMAGE2 = require('./img/img2.png');

let root;
let testElements: React.MixedElement;

Fantom.unstable_benchmark
  .suite('Image')
  .test.each(
    [100, 1000],
    n => `render ${n.toString()} images with no explicit props`,
    () => {
      Fantom.runTask(() => root.render(testElements));
    },
    n => ({
      beforeAll: () => {
        testElements = (
          <>
            {[...Array(n).keys()].map(i => (
              <Image />
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
    n => `render ${n.toString()} images`,
    () => {
      Fantom.runTask(() => root.render(testElements));
    },
    n => ({
      beforeAll: () => {
        testElements = (
          <>
            {Array.from({length: n}, (_, i) => (
              <Image
                id={String(i)}
                nativeID={String(i)}
                source={i % 2 === 0 ? IMAGE1 : IMAGE2}
                style={{
                  width: i + 1,
                  height: i + 1,
                }}
              />
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
