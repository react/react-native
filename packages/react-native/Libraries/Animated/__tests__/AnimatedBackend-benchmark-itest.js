/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useEffect} from 'react';
import {Animated, View, useAnimatedValue} from 'react-native';
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';

allowStyleProp('height');

function MyApp() {
  return (
    <View
      style={[
        {
          width: 100,
          height: 100,
          opacity: 1,
        },
      ]}
    />
  );
}

function MyAnimatedApp() {
  return (
    <Animated.View
      style={[
        {
          width: 100,
          height: 100,
          opacity: 1,
        },
      ]}
    />
  );
}

function MyAnimatedAppWithOpacityAnimation() {
  const opacity = useAnimatedValue(1);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 0,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width: 100,
          height: 100,
          opacity,
        },
      ]}
    />
  );
}

function MyAnimatedAppWithHeightAnimation() {
  const height = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(height, {
      toValue: 100,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }, [height]);

  return (
    <Animated.View
      style={[
        {
          width: 100,
          height,
        },
      ]}
    />
  );
}

function MyAnimatedAppWithMultipleAnimations() {
  const opacity = useAnimatedValue(1);
  const height = useAnimatedValue(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0.5,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(height, {
        toValue: 100,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, height]);

  return (
    <Animated.View
      style={[
        {
          width: 100,
          height,
          opacity,
        },
      ]}
    />
  );
}

const ARGS = [1, 10, 100];

let root = Fantom.createRoot();
let element: React.MixedElement;

function renderElement() {
  Fantom.runTask(() => root.render(element));
}

function renderAndAnimateElement() {
  Fantom.runTask(() => root.render(element));
  Fantom.unstable_produceFramesForDuration(100);
}

function getOptions(
  numberOfComponents: number,
  Component: React.ComponentType<{}>,
): Fantom.BenchmarkTestOptions {
  return {
    beforeAll: () => {
      element = (
        <>
          {Array.from({length: numberOfComponents}, (_, i) => (
            <Component key={i} />
          ))}
        </>
      );
    },
    beforeEach: () => {
      Fantom.runTask(() => root.render(<></>));
    },
    afterAll: () => {
      // flush pending tasks in message queue
      Fantom.runWorkLoop();
    },
  };
}

Fantom.unstable_benchmark
  .suite('AnimatedBackend')
  .test.each(
    ARGS,
    n => `render ${n} views`,
    renderElement,
    n => getOptions(n, MyApp),
  )
  .test.each(
    ARGS,
    n => `render ${n} animated views (without animations)`,
    renderElement,
    n => getOptions(n, MyAnimatedApp),
  )
  .test.each(
    ARGS,
    n => `render ${n} animated views with opacity animation`,
    renderAndAnimateElement,
    n => getOptions(n, MyAnimatedAppWithOpacityAnimation),
  )
  .test.each(
    ARGS,
    n => `render ${n} animated views with height animation (layout prop)`,
    renderAndAnimateElement,
    n => getOptions(n, MyAnimatedAppWithHeightAnimation),
  )
  .test.each(
    ARGS,
    n => `render ${n} animated views with multiple animations`,
    renderAndAnimateElement,
    n => getOptions(n, MyAnimatedAppWithMultipleAnimations),
  );
