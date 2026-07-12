/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags useSharedAnimatedBackend:* animatedShouldSyncValueBeforeStartCallback:* animatedDeferStartOfTimingAnimations:*
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
import {allowStyleProp} from 'react-native/Libraries/Animated/NativeAnimatedAllowlist';

// Deferred start outputs the initial value on the first animation frame and
// re-anchors timing on the second. This delays animation progress by one
// frame interval (~16ms at 60 fps).
const DEFERRED_START_MS =
  ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations() ? 16 : 0;

test('moving box by 100 points', () => {
  let _translateX;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    _translateX = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
          },
          {transform: [{translateX}]},
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  expect(viewElement.getBoundingClientRect().x).toBe(0);

  Fantom.runTask(() => {
    Animated.timing(_translateX, {
      toValue: 100,
      duration: 1000, // 1 second
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  // shadow tree is not synchronised yet, position X is still 0.
  expect(viewElement.getBoundingClientRect().x).toBe(0);

  const transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

  // direct manipulation has been applied. 50% through the animation
  // and with linear animation, that is position X = 50.
  expect(transform.translateX).toBeCloseTo(50, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  // Animation is completed now. C++ Animated will commit the final position to the shadow tree.
  // TODO(T232605345): this shouldn't be necessary once we fix Android's race condition.
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);
});

// A native-driven interpolation with a custom `easing` should follow the easing
// curve, not run linearly. The driver animates linearly 0 -> 1; the eased
// interpolation maps it to translateX 0 -> 100 with Easing.quad (t^2). At the
// midpoint (driver = 0.5) the eased value is 0.5^2 * 100 = 25 (a linear mapping
// would be 50). The easing is baked into the native interpolation config as an
// `easingStops` lookup table, so the native driver reproduces the curve.
test('native-driven interpolation honors custom easing', () => {
  let _progress;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const progress = useAnimatedValue(0);
    _progress = progress;
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 100],
      easing: Easing.quad,
    });
    return (
      <Animated.View
        ref={viewRef}
        style={[{width: 100, height: 100}, {transform: [{translateX}]}]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    Animated.timing(_progress, {
      toValue: 1,
      duration: 1000, // 1 second
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  const transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

  // Driver is 50% through (linear timing), but the interpolation's quad easing
  // reshapes it: 0.5^2 * 100 = 25, not the linear 50.
  expect(transform.translateX).toBeCloseTo(25, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  // Animation complete; final committed position is the full 100.
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);
});

// When the easing leaves [0, 1] (Easing.back dips below 0 early), that excursion
// must be preserved even under `extrapolate: 'clamp'`. The driver runs 0 -> 1, so
// the input is always in range — `clamp` should only affect out-of-range *input*,
// never the easing's own excursion. Pre-fix the native driver clamped it away
// (translateX pinned to 0); JS keeps it negative. This guards that parity.
test('native-driven interpolation preserves easing overshoot under clamp', () => {
  let _progress;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const progress = useAnimatedValue(0);
    _progress = progress;
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 100],
      easing: Easing.back(),
      extrapolate: 'clamp',
    });
    return (
      <Animated.View
        ref={viewRef}
        style={[{width: 100, height: 100}, {transform: [{translateX}]}]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    Animated.timing(_progress, {
      toValue: 1,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  });

  // ~20% through: Easing.back(0.2) ≈ -0.046 -> translateX ≈ -4.6, i.e. negative.
  // If the excursion were clamped (the bug), translateX would stay at 0.
  Fantom.unstable_produceFramesForDuration(200 + DEFERRED_START_MS);
  const transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];
  expect(transform.translateX).toBeLessThan(0);

  // Completes at the in-range endpoint (Easing.back(1) === 1 -> 100).
  Fantom.unstable_produceFramesForDuration(800);
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);
});

// Validate that a `useNativeDriver` timing animation does not begin progressing
// until the end of the event loop tick it was started in.
//
// Tested different behavior introduced by `animatedDeferStartOfTimingAnimations`,
// the behavioral difference is animated prop value on the first frame after the tick:
// flag ON -> deferred, not progressed yet, flag OFF -> already progressing.
function startTimingAnimationAndGetTranslateXAfterFirstFrame(): number {
  let _translateX;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    _translateX = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[{width: 100, height: 100}, {transform: [{translateX}]}]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    Animated.timing(_translateX, {
      toValue: 100,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    Fantom.unstable_produceFramesForDuration(500);

    // The UI thread advances while we are still inside the js tick. The animation
    // must not produce any direct manipulation yet, because its mount
    // operations have not been flushed. This holds regardless of the flag.
    expect(() =>
      Fantom.unstable_getDirectManipulationProps(viewElement),
    ).toThrow();
  });

  // Produce the first frame after the tick (~16ms rounds to frame 1).
  Fantom.unstable_produceFramesForDuration(16);
  const translateXAfterFirstFrame =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0]
      .translateX;

  // Drain the animation so it completes and the message queue is empty for the
  // next test.
  Fantom.unstable_produceFramesForDuration(1000);
  Fantom.runWorkLoop();
  expect(viewElement.getBoundingClientRect().x).toBe(100);

  return translateXAfterFirstFrame;
}

if (ReactNativeFeatureFlags.animatedDeferStartOfTimingAnimations()) {
  test('animation does not start before the end of the current event loop tick', () => {
    // With deferred start, the first frame after the tick outputs the initial
    // value and re-anchors timing, so the animation has not progressed yet —
    // no frames were skipped despite the UI thread advancing inside the tick.
    expect(startTimingAnimationAndGetTranslateXAfterFirstFrame()).toBe(0);
  });
} else {
  test('animation might start before the end of the current event loop tick', () => {
    // Without deferred start, the animation begins progressing immediately — it
    // has effectively started before the end of the tick.
    expect(
      startTimingAnimationAndGetTranslateXAfterFirstFrame(),
    ).toBeGreaterThan(0);
  });
}

test('animation driven by onScroll event', () => {
  const scrollViewRef = createRef<HostInstance>();
  const viewRef = createRef<HostInstance>();

  function PressableWithNativeDriver() {
    const currScroll = useAnimatedValue(0);

    return (
      <View style={{flex: 1}}>
        <Animated.View
          ref={viewRef}
          style={{
            position: 'absolute',
            width: 10,
            height: 10,
            transform: [{translateY: currScroll}],
          }}
        />
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: currScroll,
                  },
                },
              },
            ],
            {useNativeDriver: true},
          )}>
          <View style={{height: 1000, width: 100}} />
        </Animated.ScrollView>
      </View>
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<PressableWithNativeDriver />);
  });

  const scrollViewelement = nullthrows(scrollViewRef.current);
  const viewElement = nullthrows(viewRef.current);

  Fantom.scrollTo(scrollViewelement, {
    x: 0,
    y: 100,
  });

  let transform =
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

  expect(transform.translateY).toBeCloseTo(100, 0.001);

  // TODO(T232605345): The following two lines won't be necessary once race condition on Android is fixed
  expect(viewElement.getBoundingClientRect().y).toBe(0);
  Fantom.runWorkLoop();

  expect(viewElement.getBoundingClientRect().y).toBe(100);
});

test('animation driven by onScroll event when animated view is unmounted', () => {
  const scrollViewRef = createRef<HostInstance>();

  component PressableWithNativeDriver(mountAnimatedView: boolean) {
    const currScroll = useAnimatedValue(0);

    return (
      <View style={{flex: 1}}>
        {mountAnimatedView ? (
          <Animated.View
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              transform: [{translateY: currScroll}],
            }}
          />
        ) : null}
        <Animated.ScrollView
          ref={scrollViewRef}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: {
                    y: currScroll,
                  },
                },
              },
            ],
            {useNativeDriver: true},
          )}>
          <View style={{height: 1000, width: 100}} />
        </Animated.ScrollView>
      </View>
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<PressableWithNativeDriver mountAnimatedView={true} />);
  });

  Fantom.runTask(() => {
    root.render(<PressableWithNativeDriver mountAnimatedView={false} />);
  });

  const scrollViewelement = nullthrows(scrollViewRef.current);

  Fantom.scrollTo(scrollViewelement, {
    x: 0,
    y: 50,
  });

  Fantom.runWorkLoop();
});

test('animated opacity', () => {
  let _opacity;
  let _opacityAnimation;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const opacity = useAnimatedValue(1);
    _opacity = opacity;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
            opacity: opacity,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  expect(viewElement.getBoundingClientRect().x).toBe(0);

  Fantom.runTask(() => {
    _opacityAnimation = Animated.timing(_opacity, {
      toValue: 0,
      duration: 30,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(30 + DEFERRED_START_MS);
  expect(Fantom.unstable_getDirectManipulationProps(viewElement).opacity).toBe(
    0,
  );

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _opacityAnimation?.stop();
  });

  expect(root.getRenderedOutput({props: ['opacity']}).toJSX()).toEqual(
    <rn-view opacity="0" />,
  );
});

test('moving box by 50 points with offset 10', () => {
  let _translateX;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const translateX = useAnimatedValue(0);
    _translateX = translateX;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
          },
          {transform: [{translateX}]},
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  expect(viewElement.getBoundingClientRect().x).toBe(0);

  let finishValue = null;

  Fantom.runTask(() => {
    Animated.timing(_translateX, {
      toValue: 50,
      duration: 1000, // 1 second
      useNativeDriver: true,
    }).start(result => {
      finishValue = result;
    });
  });

  Fantom.runTask(() => {
    _translateX.setOffset(10);
  });

  Fantom.unstable_produceFramesForDuration(500);

  // shadow tree is not synchronised yet, position X is still 0.
  expect(viewElement.getBoundingClientRect().x).toBe(0);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0]
      .translateX,
  ).toBeCloseTo(35, 0.001);

  Fantom.unstable_produceFramesForDuration(500);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(viewElement).transform[0]
      .translateX,
  ).toBeCloseTo(60, 0.001);

  // TODO(T232605345): The following line won't be necessary once race condition on Android is fixed.
  Fantom.runWorkLoop();
  expect(root.getRenderedOutput({props: ['transform']}).toJSX()).toEqual(
    <rn-view transform='[{"translateX": 60}]' />,
  );

  expect(finishValue?.finished).toBe(true);
  expect(finishValue?.value).toBe(50); // must not include offset.
  expect(finishValue?.offset).toBe(10);
});

describe('Value.flattenOffset', () => {
  it('accumulates offset with onScroll value', () => {
    const scrollViewRef = createRef<HostInstance>();
    const viewRef = createRef<HostInstance>();
    let _onScroll;

    function PressableWithNativeDriver() {
      _onScroll = useAnimatedValue(0);

      return (
        <View style={{flex: 1}}>
          <Animated.View
            ref={viewRef}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              transform: [{translateY: _onScroll}],
            }}
          />
          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      y: _onScroll,
                    },
                  },
                },
              ],
              {useNativeDriver: true},
            )}>
            <View style={{height: 1000, width: 100}} />
          </Animated.ScrollView>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<PressableWithNativeDriver />);
    });

    const fn = jest.fn();
    Fantom.runTask(() => {
      _onScroll.addListener(fn);
    });

    const scrollViewelement = nullthrows(scrollViewRef.current);
    const viewElement = nullthrows(viewRef.current);

    Fantom.scrollTo(scrollViewelement, {
      x: 0,
      y: 10,
    });

    expect(fn).toBeCalledWith({value: 10});

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
      _onScroll.flattenOffset();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
    });

    expect(fn).toHaveBeenCalledTimes(1);

    let transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    expect(transform.translateY).toBeCloseTo(40, 0.001);
  });
});

describe('Value.extractOffset', () => {
  it('sets the offset value to the base value and resets the base value to zero', () => {
    const scrollViewRef = createRef<HostInstance>();
    const viewRef = createRef<HostInstance>();
    let _onScroll;

    function PressableWithNativeDriver() {
      _onScroll = useAnimatedValue(0);

      return (
        <View style={{flex: 1}}>
          <Animated.View
            ref={viewRef}
            style={{
              position: 'absolute',
              width: 10,
              height: 10,
              transform: [{translateY: _onScroll}],
            }}
          />
          <Animated.ScrollView
            ref={scrollViewRef}
            onScroll={Animated.event(
              [
                {
                  nativeEvent: {
                    contentOffset: {
                      y: _onScroll,
                    },
                  },
                },
              ],
              {useNativeDriver: true},
            )}>
            <View style={{height: 1000, width: 100}} />
          </Animated.ScrollView>
        </View>
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<PressableWithNativeDriver />);
    });

    const fn = jest.fn();
    Fantom.runTask(() => {
      _onScroll.addListener(fn);
    });

    const scrollViewelement = nullthrows(scrollViewRef.current);
    const viewElement = nullthrows(viewRef.current);

    Fantom.scrollTo(scrollViewelement, {
      x: 0,
      y: 10,
    });

    expect(fn).toBeCalledWith({value: 10});

    Fantom.runTask(() => {
      _onScroll.setOffset(15);
      // Sets offset to be 15 + 10 = 25 (this is not observable from JS).
      _onScroll.extractOffset();
    });

    expect(fn).toHaveBeenCalledTimes(1);

    let transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    // Animated value is now 0 but offset is 25. The final value is 25.
    expect(transform.translateY).toBeCloseTo(25, 0.001);

    Fantom.runTask(() => {
      // Sets offset 35, overriding the previous `setOffset`.
      // Due to `extractOffset`, base value was restarted to 0.
      _onScroll.setOffset(35);
    });

    expect(fn).toHaveBeenCalledTimes(1);

    transform =
      // $FlowFixMe[incompatible-use]
      Fantom.unstable_getDirectManipulationProps(viewElement).transform[0];

    // `extractOffset` resets value back to 0.
    // Previously we set offset to 35. The final value is 35.
    expect(transform.translateY).toBeCloseTo(35, 0.001);
  });
});

test('animate layout props', () => {
  const viewRef = createRef<HostInstance>();
  allowStyleProp('height');

  let _animatedHeight;
  let _heightAnimation;

  function MyApp() {
    const animatedHeight = useAnimatedValue(0);
    _animatedHeight = animatedHeight;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: animatedHeight,
          },
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const viewElement = nullthrows(viewRef.current);

  Fantom.runTask(() => {
    _heightAnimation = Animated.timing(_animatedHeight, {
      toValue: 100,
      duration: 10,
      useNativeDriver: true,
    }).start();
  });

  Fantom.unstable_produceFramesForDuration(10 + DEFERRED_START_MS);

  // TODO: this shouldn't be necessary since animation should be stopped after duration
  Fantom.runTask(() => {
    _heightAnimation?.stop();
  });

  // animation backend does not push layut updates through the direct manipulation path
  // also it's changes are not currently reflected in the getFabricUpdateProps method, as
  // it only captures props that are updated through UIManager::updateShadowTree
  if (!ReactNativeFeatureFlags.useSharedAnimatedBackend()) {
    // $FlowFixMe[incompatible-use]
    expect(Fantom.unstable_getDirectManipulationProps(viewElement).height).toBe(
      100,
    );

    expect(Fantom.unstable_getFabricUpdateProps(viewElement).height).toBe(100);
  }

  expect(root.getRenderedOutput({props: ['height']}).toJSX()).toEqual(
    <rn-view height="100" />,
  );
});

test('AnimatedValue.interpolate', () => {
  let _valueX;
  let _interpolatedValueX;
  const viewRef = createRef<HostInstance>();

  function MyApp({outputRangeX}: Readonly<{outputRangeX: number}>) {
    const valueX = useAnimatedValue(0.5, {useNativeDriver: true});
    _valueX = valueX;
    const offset = outputRangeX - 1;
    const interpolatedValueX = valueX.interpolate({
      inputRange: [0, 1],
      outputRange: [offset, 100],
    });
    _interpolatedValueX = interpolatedValueX;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {
            width: 100,
            height: 100,
          },
          {transform: [{translateX: valueX}, {translateY: interpolatedValueX}]},
        ]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp outputRangeX={1} />);
  });

  const viewElement = nullthrows(viewRef.current);

  expect(_valueX?.__getValue()).toBe(0.5);
  expect(_interpolatedValueX?.__getValue()).toBe(50);
  expect(
    JSON.stringify(
      Fantom.unstable_getDirectManipulationProps(viewElement).transform,
    ),
  ).toBe('[{"translateX":0.5},{"translateY":50}]');
  expect(viewElement.getBoundingClientRect().x).toBe(0.5);
  expect(viewElement.getBoundingClientRect().y).toBe(50);

  Fantom.runTask(() => {
    root.render(<MyApp outputRangeX={51} />);
  });

  expect(_valueX?.__getValue()).toBe(0.5);
  expect(_interpolatedValueX?.__getValue()).toBe(75);
  expect(
    JSON.stringify(
      Fantom.unstable_getDirectManipulationProps(viewElement).transform,
    ),
  ).toBe('[{"translateX":0.5},{"translateY":75}]');
  expect(viewElement.getBoundingClientRect().x).toBe(0.5);
  // TODO (T248792461) this doesn't work with animation backend, because the commit hook overrides the value from the second render.
  // The value displayed on the screen will be correct, but getBoundingClientRect will see the old shadow node
  if (!ReactNativeFeatureFlags.useSharedAnimatedBackend()) {
    expect(viewElement.getBoundingClientRect().y).toBe(75);
  }
});

test('Animated.sequence', () => {
  let _translateY;
  let _isSequenceFinished = false;
  const elementRef = createRef<HostInstance>();

  function MyApp() {
    const translateY = useAnimatedValue(0, {useNativeDriver: true});
    _translateY = translateY;

    return (
      <View>
        <Animated.View
          ref={elementRef}
          style={[
            {
              position: 'absolute',
              width: 100,
              height: 100,
            },
            {
              transform: [
                {
                  translateY: translateY.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -16],
                  }),
                },
              ],
            },
          ]}
        />
      </View>
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const element = nullthrows(elementRef.current);

  expect(element.getBoundingClientRect().y).toBe(0);

  Fantom.runTask(() => {
    Animated.sequence([
      Animated.timing(_translateY, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(_translateY, {
        toValue: 0,
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) {
        _isSequenceFinished = true;
      }
    });
  });

  Fantom.unstable_produceFramesForDuration(500 + DEFERRED_START_MS);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(element).transform[0].translateY,
  ).toBeCloseTo(-16, 0.001);

  Fantom.runWorkLoop(); // React update to sync end state of 1st timing animation in sequence

  expect(_isSequenceFinished).toBe(false);

  expect(
    // $FlowFixMe[incompatible-use]
    Fantom.unstable_getDirectManipulationProps(element).transform[0].translateY,
  ).toBeCloseTo(0, 0.001);

  // TODO(T232605345): The following two lines won't be necessary once race condition on Android is fixed
  expect(element.getBoundingClientRect().y).toBe(-16);
  Fantom.runWorkLoop();
  expect(element.getBoundingClientRect().y).toBe(0);

  expect(_isSequenceFinished).toBe(true);
});

// Regression test for native-driver completion-callback ordering.
//
// `Animation.__startAnimationIfNative` must sync the JS-side AnimatedValue
// with the post-animation value BEFORE firing the user's `start({finished})`
// callback. Otherwise, code that reads the AnimatedValue from inside the
// callback — or from any React re-render the callback triggers — observes the
// pre-animation value and renders stale style (e.g. a `scaleX` interpolation
// that resolves to the starting `outputRange[0]` instead of the final
// `outputRange[1]`).
//
// The fix is gated behind `animatedShouldSyncValueBeforeStartCallback`. This
// test runs under both flag values (via `@fantom_flags ...:*`) and asserts:
//   - flag OFF: bug is present (callback observes pre-animation value).
//   - flag ON : bug is fixed   (callback observes post-animation value).
test('useNativeDriver: JS-side _value is synced before the completion callback fires', () => {
  let _value;
  let _valueInCallback = null;
  let _interpolationInCallback = null;

  function MyApp() {
    const value = useAnimatedValue(0);
    _value = value;
    const scaleX = value.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
    });
    return (
      <Animated.View
        style={[{width: 100, height: 100}, {transform: [{scaleX}]}]}
      />
    );
  }

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  Fantom.runTask(() => {
    Animated.timing(_value, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start(({finished}) => {
      if (finished) {
        // $FlowFixMe[prop-missing] _value is internal but stable for testing.
        _valueInCallback = _value._value;
        // $FlowFixMe[prop-missing]
        _interpolationInCallback = _value
          .interpolate({inputRange: [0, 1], outputRange: [0.5, 1]})
          .__getValue();
      }
    });
  });

  Fantom.unstable_produceFramesForDuration(150);
  Fantom.runWorkLoop();

  if (ReactNativeFeatureFlags.animatedShouldSyncValueBeforeStartCallback()) {
    // With the fix: the callback observes the post-animation value.
    expect(_valueInCallback).toBe(1);
    expect(_interpolationInCallback).toBe(1);
  } else {
    // Without the fix: the callback observes the pre-animation value.
    // interp(0) = outputRange[0] = 0.5.
    expect(_valueInCallback).toBe(0);
    expect(_interpolationInCallback).toBe(0.5);
  }
});
