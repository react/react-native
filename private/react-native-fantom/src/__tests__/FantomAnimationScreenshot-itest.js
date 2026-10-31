/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {Root} from '@react-native/fantom';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Animated, Easing, View} from 'react-native';

let root: Root;
let animation: ?Animated.CompositeAnimation;

beforeEach(() => {
  root = Fantom.createRoot({
    viewportWidth: 200,
    viewportHeight: 80,
    devicePixelRatio: 1,
  });
  animation = null;
});

afterEach(() => {
  if (animation != null) {
    Fantom.runTask(() => animation?.stop());
  }
  root.destroy();
});

it('captures the initial, intermediate and final states of a native layout animation', () => {
  const marginLeft = new Animated.Value(0);
  Fantom.runTask(() =>
    root.render(
      <View
        style={{
          flex: 1,
          backgroundColor: 'white',
          padding: 16,
          borderWidth: 1,
          borderColor: '#555555',
        }}>
        <Animated.View
          style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: '#3978b4',
            marginLeft,
          }}
        />
      </View>,
    ),
  );
  const initial = root.takeScreenshot();
  expect(initial).toMatchSnapshot('initial');

  let finished = false;
  Fantom.runTask(() => {
    animation = Animated.timing(marginLeft, {
      toValue: 120,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    });
    animation.start(result => {
      finished = result.finished;
    });
  });
  Fantom.unstable_produceFramesForDuration(500);
  const intermediate = root.takeScreenshot();
  expect(intermediate.isEqual(initial)).toBe(false);
  expect(intermediate).toMatchSnapshot('intermediate');
  expect(finished).toBe(false);

  Fantom.unstable_produceFramesForDuration(600);
  Fantom.runWorkLoop();
  const final = root.takeScreenshot();
  expect(final.isEqual(initial)).toBe(false);
  expect(final.isEqual(intermediate)).toBe(false);
  expect(final).toMatchSnapshot('final');
  expect(finished).toBe(true);
});
