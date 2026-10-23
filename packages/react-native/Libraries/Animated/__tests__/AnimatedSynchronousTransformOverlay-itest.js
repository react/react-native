/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableSynchronousTransformOverlay:* useSharedAnimatedBackend:* animatedDeferStartOfTimingAnimations:*
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as ReactNativeFeatureFlags from '../../../src/private/featureflags/ReactNativeFeatureFlags';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Animated, Easing, View, useAnimatedValue} from 'react-native';

// Deferred start outputs the initial value on the first animation frame and
// re-anchors timing on the second. This delays animation progress by one
// frame interval (~16ms at 60 fps).
const DEFERRED_START_MS =
  ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations() ? 16 : 0;

const OVERLAY_ENABLED =
  ReactNativeFeatureFlags.enableSynchronousTransformOverlay();

function measure(instance: HostInstance): {pageX: number, pageY: number} {
  let result = {pageX: NaN, pageY: NaN};
  instance.measure((x, y, width, height, pageX, pageY) => {
    result = {pageX, pageY};
  });
  return result;
}

function measureInWindow(instance: HostInstance): {x: number, y: number} {
  let result = {x: NaN, y: NaN};
  instance.measureInWindow((x, y) => {
    result = {x, y};
  });
  return result;
}

/**
 * Native-driven animations write non-layout props like `transform` directly
 * to the mounted views, without committing to the shadow tree. With the
 * `enableSynchronousTransformOverlay` flag, layout queries take those
 * synchronous transforms into account, so they match what is on the screen
 * (which is what e.g. `Pressable` relies on to validate presses).
 */
test('layout queries reflect a natively-driven transform mid-animation', () => {
  let _translateX;
  const viewRef = createRef<HostInstance>();
  const childRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    _translateX = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[{width: 100, height: 100}, {transform: [{translateX}]}]}>
        <View ref={childRef} style={{marginLeft: 10, width: 50, height: 50}} />
      </Animated.View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);
  const childElement = nullthrows(childRef.current);

  expect(viewElement.getBoundingClientRect().x).toBe(0);
  expect(childElement.getBoundingClientRect().x).toBe(10);

  Fantom.runTask(() => {
    Animated.timing(_translateX, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  // The view was moved through the synchronous path only.
  const transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];
  expect(transform.translateX).toBeCloseTo(50, 0.001);

  // Without the overlay the shadow tree is not synchronised yet and the
  // queries still report the committed position. With the overlay they
  // report the position of the mounted view, for the animated view itself
  // and for its descendants alike.
  const expectedX = OVERLAY_ENABLED ? 50 : 0;

  expect(viewElement.getBoundingClientRect().x).toBeCloseTo(expectedX, 0.001);
  expect(measure(viewElement).pageX).toBeCloseTo(expectedX, 0.001);
  expect(measureInWindow(viewElement).x).toBeCloseTo(expectedX, 0.001);

  expect(childElement.getBoundingClientRect().x).toBeCloseTo(
    expectedX + 10,
    0.001,
  );
  expect(measure(childElement).pageX).toBeCloseTo(expectedX + 10, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  // Animation is completed now. C++ Animated commits the final position to
  // the shadow tree, after which the overlay is no longer needed and the
  // queries agree with the committed tree.
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);
  expect(childElement.getBoundingClientRect().x).toBe(110);
});

test('layout queries compose natively-driven transforms of nested views', () => {
  let _outerTranslateX;
  let _innerTranslateY;
  const leafRef = createRef<HostInstance>();
  const innerRef = createRef<HostInstance>();

  function MyApp() {
    const outerTranslateX = useAnimatedValue(0);
    const innerTranslateY = useAnimatedValue(0);
    _outerTranslateX = outerTranslateX;
    _innerTranslateY = innerTranslateY;
    return (
      <Animated.View
        style={[
          {width: 300, height: 300},
          {transform: [{translateX: outerTranslateX}]},
        ]}>
        <Animated.View
          ref={innerRef}
          style={[
            {marginLeft: 20, marginTop: 20, width: 100, height: 100},
            {transform: [{translateY: innerTranslateY}]},
          ]}>
          <View ref={leafRef} style={{marginLeft: 5, width: 10, height: 10}} />
        </Animated.View>
      </Animated.View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const innerElement = nullthrows(innerRef.current);
  const leafElement = nullthrows(leafRef.current);

  expect(leafElement.getBoundingClientRect().x).toBe(25);
  expect(leafElement.getBoundingClientRect().y).toBe(20);

  // Both levels are animated through the synchronous path, each by a
  // different value.
  Fantom.runTask(() => {
    Animated.timing(_outerTranslateX, {
      toValue: 80,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
    Animated.timing(_innerTranslateY, {
      toValue: 60,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  // The leaf has no transform of its own: its position is the composition of
  // the synchronous transforms of both ancestors.
  const expectedOuterX = OVERLAY_ENABLED ? 40 : 0;
  const expectedInnerY = OVERLAY_ENABLED ? 30 : 0;

  const innerRect = innerElement.getBoundingClientRect();
  expect(innerRect.x).toBeCloseTo(20 + expectedOuterX, 0.001);
  expect(innerRect.y).toBeCloseTo(20 + expectedInnerY, 0.001);

  const leafRect = leafElement.getBoundingClientRect();
  expect(leafRect.x).toBeCloseTo(25 + expectedOuterX, 0.001);
  expect(leafRect.y).toBeCloseTo(20 + expectedInnerY, 0.001);
  expect(measure(leafElement).pageX).toBeCloseTo(25 + expectedOuterX, 0.001);
  expect(measure(leafElement).pageY).toBeCloseTo(20 + expectedInnerY, 0.001);

  Fantom.unstable_produceFramesForDuration(500);
  Fantom.runWorkLoop();

  // Both final values are committed.
  expect(leafElement.getBoundingClientRect().x).toBe(105);
  expect(leafElement.getBoundingClientRect().y).toBe(80);
});

test('a natively-driven transform composes with a committed scale of an ancestor', () => {
  let _translateY;
  const innerRef = createRef<HostInstance>();

  function MyApp() {
    const translateY = useAnimatedValue(0);
    _translateY = translateY;
    return (
      // The committed `scale` is applied around the center of the outer view.
      <View style={{width: 200, height: 200, transform: [{scale: 0.5}]}}>
        <Animated.View
          ref={innerRef}
          style={[
            {marginLeft: 20, marginTop: 20, width: 100, height: 100},
            {transform: [{translateY}]},
          ]}
        />
      </View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const innerElement = nullthrows(innerRef.current);

  // (20, 20, 100, 100) scaled by 0.5 around (100, 100).
  let rect = innerElement.getBoundingClientRect();
  expect(rect.x).toBe(60);
  expect(rect.y).toBe(60);
  expect(rect.width).toBe(50);
  expect(rect.height).toBe(50);

  Fantom.runTask(() => {
    Animated.timing(_translateY, {
      toValue: 60,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  // The synchronous translation (30) moves the inner view in the outer view's
  // coordinate space before the committed scale of the outer view applies:
  // (20, 50) scaled by 0.5 around (100, 100) gives (60, 75).
  rect = innerElement.getBoundingClientRect();
  expect(rect.x).toBeCloseTo(60, 0.001);
  expect(rect.y).toBeCloseTo(OVERLAY_ENABLED ? 75 : 60, 0.001);
  expect(rect.width).toBeCloseTo(50, 0.001);
  expect(rect.height).toBeCloseTo(50, 0.001);

  Fantom.unstable_produceFramesForDuration(500);
  Fantom.runWorkLoop();

  // Final value committed: (20, 80) scaled by 0.5 around (100, 100).
  rect = innerElement.getBoundingClientRect();
  expect(rect.x).toBe(60);
  expect(rect.y).toBe(90);
});

test('layout queries reflect a natively-driven transform after unmounting other views', () => {
  let _translateY;
  const viewRef = createRef<HostInstance>();

  function MyApp({showSibling}: {showSibling: boolean}) {
    const translateY = useAnimatedValue(0);
    _translateY = translateY;
    return (
      <>
        {showSibling ? <View style={{width: 10, height: 10}} /> : null}
        <Animated.View
          ref={viewRef}
          style={[{width: 100, height: 100}, {transform: [{translateY}]}]}
        />
      </>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp showSibling={true} />);
  });

  const viewElement = nullthrows(viewRef.current);
  expect(viewElement.getBoundingClientRect().y).toBe(10);

  Fantom.runTask(() => {
    Animated.timing(_translateY, {
      toValue: 100,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  // A commit that deletes other views keeps the overlay entry of the view
  // that is still mounted.
  Fantom.runTask(() => {
    root.render(<MyApp showSibling={false} />);
  });

  // Without the overlay, the committed position is only up to date when the
  // shared Animation Backend is on: its commit hook re-applies the animated
  // value to every React commit.
  const expectedY =
    OVERLAY_ENABLED || ReactNativeFeatureFlags.useSharedAnimatedBackend()
      ? 50
      : 0;
  expect(viewElement.getBoundingClientRect().y).toBeCloseTo(expectedY, 0.001);
});
