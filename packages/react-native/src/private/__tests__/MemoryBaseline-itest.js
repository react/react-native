/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_mode *
 * @fantom_disable_coverage
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type Performance from '../webapis/performance/Performance';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';

declare var performance: Performance;

/**
 * These memory limits are set arbitrarily based on the current memory usage,
 * and should be very stable.
 *
 * If you're seeing this test failing after a change, please evaluate whether
 * the memory increase is justified. If it is, you can just update the limits
 * and set a new baseline. Otherwise, please try to optimize your code.
 */
const MEMORY_LIMITS_KB = {
  environmentSetup: {
    dev: 1000,
    opt: 500,
  },
  basicSurfaceRender: {
    dev: 1200,
    opt: 700,
  },
};

function limitFor(scenario: keyof typeof MEMORY_LIMITS_KB): number {
  return MEMORY_LIMITS_KB[scenario][__DEV__ ? 'dev' : 'opt'];
}

function getCurrentMemoryUsageKB(): number {
  global.gc();
  return nullthrows(performance.memory.usedJSHeapSize) / 1024;
}

describe('Memory baseline', () => {
  it(`should be below ${limitFor('environmentSetup')} KB after environment setup`, () => {
    expect(getCurrentMemoryUsageKB()).toBeLessThanOrEqual(
      limitFor('environmentSetup'),
    );
  });

  it(`should be below ${limitFor('basicSurfaceRender')} after basic surface renders`, () => {
    let root: ?Fantom.Root = Fantom.createRoot();

    const View = require('react-native').View;
    const Text = require('react-native').Text;

    Fantom.runTask(() => {
      nullthrows(root).render(
        <View>
          <Text>Hello!</Text>
        </View>,
      );
    });

    expect(getCurrentMemoryUsageKB()).toBeLessThanOrEqual(
      limitFor('basicSurfaceRender'),
    );

    Fantom.runTask(() => {
      nullthrows(root).destroy();
    });

    root = null;

    const baselineAfterBasicRender = getCurrentMemoryUsageKB();

    expect(baselineAfterBasicRender).toBeLessThanOrEqual(
      limitFor('basicSurfaceRender'),
    );

    for (let i = 0; i < 100; i++) {
      root = Fantom.createRoot();

      Fantom.runTask(() => {
        nullthrows(root).render(
          <View>
            <Text>Hello!</Text>
          </View>,
        );
      });

      Fantom.runTask(() => {
        nullthrows(root).destroy();
      });

      root = null;
    }

    const valueAfterSubsequentRenders = getCurrentMemoryUsageKB();

    // All these additional renders that go through the same paths shouldn't
    // increase memory usage by more than 5%, or there's probably a leak.
    expect(valueAfterSubsequentRenders).toBeLessThanOrEqual(
      baselineAfterBasicRender * 1.05,
    );
  });
});
