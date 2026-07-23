/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {useState} from 'react';
import {Animated, useAnimatedColor, useAnimatedValueXY} from 'react-native';

describe('useAnimatedColor', () => {
  it('drives backgroundColor and returns a stable value across re-renders', () => {
    const colors: Array<Animated.Color> = [];
    let forceRender: ?() => void;

    function MyApp() {
      const [, setTick] = useState(0);
      forceRender = () => setTick(tick => tick + 1);
      const color = useAnimatedColor('rgba(1, 2, 3, 1)');
      colors.push(color);
      return (
        <Animated.View
          style={{width: 10, height: 10, backgroundColor: color}}
        />
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyApp />);
    });

    expect(
      root.getRenderedOutput({props: ['backgroundColor']}).toJSX(),
    ).toEqual(<rn-view backgroundColor="rgba(1, 2, 3, 1)" />);

    // Re-render: the hook must return the same memoized instance.
    Fantom.runTask(() => {
      nullthrows(forceRender)();
    });

    expect(colors.length).toBeGreaterThan(1);
    expect(colors[colors.length - 1]).toBe(colors[0]);
  });
});

describe('useAnimatedValueXY', () => {
  it('drives a translate transform and returns a stable value across re-renders', () => {
    const values: Array<Animated.ValueXY> = [];
    let value: ?Animated.ValueXY;
    let forceRender: ?() => void;

    function MyApp() {
      const [, setTick] = useState(0);
      forceRender = () => setTick(tick => tick + 1);
      const xy = useAnimatedValueXY({x: 0, y: 0});
      value = xy;
      values.push(xy);
      return (
        <Animated.View
          style={{
            width: 100,
            height: 100,
            transform: xy.getTranslateTransform(),
          }}
        />
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyApp />);
    });

    // Stable instance across re-renders.
    Fantom.runTask(() => {
      nullthrows(forceRender)();
    });
    expect(values.length).toBeGreaterThan(1);
    expect(values[values.length - 1]).toBe(values[0]);

    // Updating the value updates both translate axes.
    Fantom.runTask(() => {
      nullthrows(value).setValue({x: 50, y: 20});
    });

    const transform = JSON.parse(
      root.getRenderedOutput({props: ['transform']}).toJSONObject().props
        .transform,
    );
    expect(transform).toEqual([{translateX: 50}, {translateY: 20}]);
  });
});
