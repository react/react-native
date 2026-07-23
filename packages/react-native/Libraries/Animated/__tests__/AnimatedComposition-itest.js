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

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Animated, useAnimatedValue} from 'react-native';

// Renders an <Animated.View> whose translateX is driven by `makeNode(base)` and
// returns the base AnimatedValue plus the mounted element so tests can mutate the
// base and observe the derived value on the shadow tree.
function renderWithDerivedTranslateX(
  makeNode: (base: Animated.Value) => Animated.WithAnimatedValue<number>,
): {
  base: Animated.Value,
  element: HostInstance,
  root: Fantom.Root,
} {
  let base: ?Animated.Value;
  const viewRef = createRef<HostInstance>();

  function MyApp() {
    const value = useAnimatedValue(0);
    base = value;
    return (
      <Animated.View
        ref={viewRef}
        style={[
          {width: 100, height: 100},
          {transform: [{translateX: makeNode(value)}]},
        ]}
      />
    );
  }

  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<MyApp />);
  });

  const element = nullthrows(viewRef.current);
  return {base: nullthrows(base), element, root};
}

function getTranslateX(root: Fantom.Root): number {
  const output = root.getRenderedOutput({props: ['transform']}).toJSONObject();
  const transform = JSON.parse(output.props.transform);
  return transform[0].translateX;
}

describe('Animated.subtract', () => {
  it('computes the difference of two values and reacts to updates', () => {
    const {base, root} = renderWithDerivedTranslateX(value =>
      Animated.subtract(100, value),
    );

    expect(getTranslateX(root)).toBe(100);

    Fantom.runTask(() => {
      base.setValue(30);
    });

    expect(getTranslateX(root)).toBe(70);
  });
});

describe('Animated.divide', () => {
  it('computes the quotient of two values and reacts to updates', () => {
    const {base, root} = renderWithDerivedTranslateX(value =>
      Animated.divide(value, 2),
    );

    Fantom.runTask(() => {
      base.setValue(20);
    });
    expect(getTranslateX(root)).toBe(10);

    Fantom.runTask(() => {
      base.setValue(80);
    });

    expect(getTranslateX(root)).toBe(40);
  });

  it('returns 0 instead of Infinity when dividing by zero', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <Animated.View style={{width: Animated.divide(10, 0), height: 100}} />,
      );
    });
    expect(
      Number(
        root.getRenderedOutput({props: ['width']}).toJSONObject().props.width,
      ),
    ).toBe(0);
  });
});

describe('Animated.modulo', () => {
  it('wraps values into the [0, modulus) range for positive and negative inputs', () => {
    const {base, root} = renderWithDerivedTranslateX(value =>
      Animated.modulo(value, 10),
    );

    Fantom.runTask(() => {
      base.setValue(25);
    });
    expect(getTranslateX(root)).toBe(5);

    Fantom.runTask(() => {
      base.setValue(-3);
    });
    // ((-3 % 10) + 10) % 10 === 7
    expect(getTranslateX(root)).toBe(7);
  });
});

describe('Animated.diffClamp', () => {
  it('clamps the accumulated delta between min and max', () => {
    const base = new Animated.Value(0);
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <Animated.View
          style={{width: Animated.diffClamp(base, 0, 20), height: 100}}
        />,
      );
    });

    // `width` (unlike a zero `translateX`) is preserved in the rendered output,
    // so the accumulated, clamped value is observed publicly.
    const getWidth = () =>
      Number(
        root.getRenderedOutput({props: ['width']}).toJSONObject().props.width,
      );

    expect(getWidth()).toBe(0);

    // Increase beyond max: 0 + 100 clamped to 20.
    Fantom.runTask(() => base.setValue(100));
    expect(getWidth()).toBe(20);

    // Decrease by 30: 20 + (70 - 100) = -10, clamped to 0.
    Fantom.runTask(() => base.setValue(70));
    expect(getWidth()).toBe(0);

    // Increase by 5: 0 + (75 - 70) = 5, within range.
    Fantom.runTask(() => base.setValue(75));
    expect(getWidth()).toBe(5);
  });
});

describe('Animated.add and Animated.multiply', () => {
  it('compose additions and multiplications', () => {
    const {base, root} = renderWithDerivedTranslateX(value =>
      Animated.add(Animated.multiply(value, 2), 10),
    );

    Fantom.runTask(() => {
      base.setValue(20);
    });

    // 20 * 2 + 10 = 50
    expect(getTranslateX(root)).toBe(50);
  });
});

describe('Animated tracking (toValue is an AnimatedNode)', () => {
  it('follows the target value when animating toward another AnimatedValue', () => {
    let follower: ?Animated.Value;
    let leader: ?Animated.Value;
    const viewRef = createRef<HostInstance>();

    function MyApp() {
      const followerValue = useAnimatedValue(0);
      const leaderValue = useAnimatedValue(0);
      follower = followerValue;
      leader = leaderValue;
      return (
        <Animated.View
          ref={viewRef}
          style={[
            {width: 100, height: 100},
            {transform: [{translateX: followerValue}]},
          ]}
        />
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyApp />);
    });

    Fantom.runTask(() => {
      Animated.timing(nullthrows(follower), {
        toValue: nullthrows(leader),
        duration: 100,
        useNativeDriver: false,
      }).start();
    });

    Fantom.runTask(() => {
      nullthrows(leader).setValue(50);
    });

    Fantom.unstable_produceFramesForDuration(200);
    Fantom.runWorkLoop();

    expect(getTranslateX(root)).toBeCloseTo(50, 1);
  });

  it('follows the target value on the native driver', () => {
    let follower: ?Animated.Value;
    let leader: ?Animated.Value;
    let animation: ?Animated.CompositeAnimation;
    const viewRef = createRef<HostInstance>();

    function MyApp() {
      const followerValue = useAnimatedValue(0);
      const leaderValue = useAnimatedValue(0);
      follower = followerValue;
      leader = leaderValue;
      return (
        <Animated.View
          ref={viewRef}
          style={[
            {width: 100, height: 100},
            {transform: [{translateX: followerValue}]},
          ]}
        />
      );
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<MyApp />);
    });
    const element = nullthrows(viewRef.current);

    Fantom.runTask(() => {
      animation = Animated.timing(nullthrows(follower), {
        toValue: nullthrows(leader),
        duration: 100,
        useNativeDriver: true,
      });
      animation.start();
    });

    Fantom.runTask(() => {
      nullthrows(leader).setValue(50);
    });

    Fantom.unstable_produceFramesForDuration(200);
    Fantom.runWorkLoop();

    expect(element.getBoundingClientRect().x).toBeCloseTo(50, 0);

    Fantom.runTask(() => {
      nullthrows(animation).stop();
    });
    Fantom.runTask(() => {
      root.render(<Animated.View style={{width: 1, height: 1}} />);
    });
    Fantom.unstable_produceFramesForDuration(16);
    Fantom.runWorkLoop();
  });
});

// Exercises the native-config, interpolation and detach paths of the
// composition nodes (the JS `__getValue` path is covered by the tests above).
describe('composition nodes: native driver, interpolation and detach', () => {
  const factories = [
    {
      name: 'add',
      make: (base: Animated.Value) => Animated.add(base, 10),
      expected: 60,
    },
    {
      name: 'subtract',
      make: (base: Animated.Value) => Animated.subtract(base, 10),
      expected: 40,
    },
    {
      name: 'multiply',
      make: (base: Animated.Value) => Animated.multiply(base, 2),
      expected: 100,
    },
    {
      name: 'divide',
      make: (base: Animated.Value) => Animated.divide(base, 2),
      expected: 25,
    },
    {
      name: 'modulo',
      make: (base: Animated.Value) => Animated.modulo(base, 7),
      expected: 50 % 7,
    },
    {
      name: 'diffClamp',
      make: (base: Animated.Value) => Animated.diffClamp(base, 0, 100),
      expected: 50,
    },
  ];

  for (const {name, make, expected} of factories) {
    it(`${name} runs on the native driver, interpolates, and detaches`, () => {
      let base: ?Animated.Value;
      const viewRef = createRef<HostInstance>();

      function MyApp() {
        const value = useAnimatedValue(0);
        base = value;
        const node = make(value);
        return (
          <Animated.View
            ref={viewRef}
            style={[
              {width: 100, height: 100},
              // `interpolate` on the composed node (bound to opacity) and the
              // node itself (bound to translateX) exercise the interpolation
              // and native-config paths.
              {
                opacity: node.interpolate({
                  inputRange: [0, 1000],
                  outputRange: [0.5, 1],
                  extrapolate: 'clamp',
                }),
              },
              {transform: [{translateX: node}]},
            ]}
          />
        );
      }

      const root = Fantom.createRoot();
      Fantom.runTask(() => {
        root.render(<MyApp />);
      });
      const element = nullthrows(viewRef.current);

      let animation: ?Animated.CompositeAnimation;
      Fantom.runTask(() => {
        animation = Animated.timing(nullthrows(base), {
          toValue: 50,
          duration: 100,
          useNativeDriver: true,
        });
        animation.start();
      });
      Fantom.unstable_produceFramesForDuration(200);
      Fantom.runWorkLoop();

      expect(element.getBoundingClientRect().x).toBeCloseTo(expected, 0);

      // Stop the animation and re-render without the node to detach the
      // composition graph and drain pending work.
      Fantom.runTask(() => {
        nullthrows(animation).stop();
      });
      Fantom.runTask(() => {
        root.render(<Animated.View style={{width: 1, height: 1}} />);
      });
      Fantom.unstable_produceFramesForDuration(16);
      Fantom.runWorkLoop();
    });
  }
});
