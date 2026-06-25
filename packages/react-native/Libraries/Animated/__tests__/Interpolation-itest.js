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

import type {
  InterpolationConfigSupportedOutputType,
  InterpolationConfigType,
} from '../nodes/AnimatedInterpolation';

import {PlatformColor} from '../../../Libraries/StyleSheet/PlatformColorValueTypes';
import Easing from '../Easing';
import AnimatedInterpolation from '../nodes/AnimatedInterpolation';

function createInterpolation<T extends InterpolationConfigSupportedOutputType>(
  config: InterpolationConfigType<T>,
): number => T {
  let parentValue = null;
  const interpolation = new AnimatedInterpolation(
    // $FlowFixMe[incompatible-type]
    {__getValue: () => parentValue},
    config,
  );
  return input => {
    parentValue = input;
    return interpolation.__getValue();
  };
}

describe('Interpolation', () => {
  const originalConsoleWarn = console.warn;

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    console.warn = originalConsoleWarn;
  });

  it('should work with defaults', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });

    expect(interpolation(0)).toBe(0);
    expect(interpolation(0.5)).toBe(0.5);
    expect(interpolation(0.8)).toBe(0.8);
    expect(interpolation(1)).toBe(1);
  });

  it('should work with output range', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [100, 200],
    });

    expect(interpolation(0)).toBe(100);
    expect(interpolation(0.5)).toBe(150);
    expect(interpolation(0.8)).toBe(180);
    expect(interpolation(1)).toBe(200);
  });

  it('should work with input range', () => {
    const interpolation = createInterpolation({
      inputRange: [100, 200],
      outputRange: [0, 1],
    });

    expect(interpolation(100)).toBe(0);
    expect(interpolation(150)).toBe(0.5);
    expect(interpolation(180)).toBe(0.8);
    expect(interpolation(200)).toBe(1);
  });

  it('should throw for non monotonic input ranges', () => {
    expect(
      () =>
        // $FlowFixMe[incompatible-type]
        new AnimatedInterpolation(null, {
          inputRange: [0, 2, 1],
          outputRange: [0, 1, 2],
        }),
    ).toThrow();

    expect(
      () =>
        // $FlowFixMe[incompatible-type]
        new AnimatedInterpolation(null, {
          inputRange: [0, 1, 2],
          outputRange: [0, 3, 1],
        }),
    ).not.toThrow();
  });

  it('should work with empty input range', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 10, 10],
      outputRange: [1, 2, 3],
      extrapolate: 'extend',
    });

    expect(interpolation(0)).toBe(1);
    expect(interpolation(5)).toBe(1.5);
    expect(interpolation(10)).toBe(2);
    expect(interpolation(10.1)).toBe(3);
    expect(interpolation(15)).toBe(3);
  });

  it('should work with empty output range', () => {
    const interpolation = createInterpolation({
      inputRange: [1, 2, 3],
      outputRange: [0, 10, 10],
      extrapolate: 'extend',
    });

    expect(interpolation(0)).toBe(-10);
    expect(interpolation(1.5)).toBe(5);
    expect(interpolation(2)).toBe(10);
    expect(interpolation(2.5)).toBe(10);
    expect(interpolation(3)).toBe(10);
    expect(interpolation(4)).toBe(10);
  });

  it('should work with easing', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
      easing: Easing.quad,
    });

    expect(interpolation(0)).toBe(0);
    expect(interpolation(0.5)).toBe(0.25);
    expect(interpolation(0.9)).toBe(0.81);
    expect(interpolation(1)).toBe(1);
  });

  it('should work with extrapolate', () => {
    let interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'extend',
      easing: Easing.quad,
    });

    expect(interpolation(-2)).toBe(4);
    expect(interpolation(2)).toBe(4);

    interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
      easing: Easing.quad,
    });

    expect(interpolation(-2)).toBe(0);
    expect(interpolation(2)).toBe(1);

    interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'identity',
      easing: Easing.quad,
    });

    expect(interpolation(-2)).toBe(-2);
    expect(interpolation(2)).toBe(2);
  });

  it('should work with keyframes without extrapolate', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 10, 100, 1000],
      outputRange: [0, 5, 50, 500],
    });

    expect(interpolation(-5)).toBe(-2.5);
    expect(interpolation(0)).toBe(0);
    expect(interpolation(5)).toBe(2.5);
    expect(interpolation(10)).toBe(5);
    expect(interpolation(50)).toBe(25);
    expect(interpolation(100)).toBe(50);
    expect(interpolation(500)).toBe(250);
    expect(interpolation(1000)).toBe(500);
    expect(interpolation(2000)).toBe(1000);
  });

  it('should work with keyframes with extrapolate', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1, 2],
      outputRange: [0.2, 1, 0.2],
      extrapolate: 'clamp',
    });

    expect(interpolation(5)).toBeCloseTo(0.2);
  });

  it('should throw for an infinite input range', () => {
    expect(
      () =>
        // $FlowFixMe[incompatible-type]
        new AnimatedInterpolation(null, {
          inputRange: [-Infinity, Infinity],
          outputRange: [0, 1],
        }),
    ).toThrow();

    expect(
      () =>
        // $FlowFixMe[incompatible-type]
        new AnimatedInterpolation(null, {
          inputRange: [-Infinity, 0, Infinity],
          outputRange: [1, 2, 3],
        }),
    ).not.toThrow();
  });

  it('should work with negative infinite', () => {
    const interpolation = createInterpolation({
      inputRange: [-Infinity, 0],
      outputRange: [-Infinity, 0],
      easing: Easing.quad,
      extrapolate: 'identity',
    });

    expect(interpolation(-Infinity)).toBe(-Infinity);
    expect(interpolation(-100)).toBeCloseTo(-10000);
    expect(interpolation(-10)).toBeCloseTo(-100);
    expect(interpolation(0)).toBeCloseTo(0);
    expect(interpolation(1)).toBeCloseTo(1);
    expect(interpolation(100)).toBeCloseTo(100);
  });

  it('should work with positive infinite', () => {
    const interpolation = createInterpolation({
      inputRange: [5, Infinity],
      outputRange: [5, Infinity],
      easing: Easing.quad,
      extrapolate: 'identity',
    });

    expect(interpolation(-100)).toBeCloseTo(-100);
    expect(interpolation(-10)).toBeCloseTo(-10);
    expect(interpolation(0)).toBeCloseTo(0);
    expect(interpolation(5)).toBeCloseTo(5);
    expect(interpolation(6)).toBeCloseTo(5 + 1);
    expect(interpolation(10)).toBeCloseTo(5 + 25);
    expect(interpolation(100)).toBeCloseTo(5 + 95 * 95);
    expect(interpolation(Infinity)).toBe(Infinity);
  });

  it('should work with output ranges as string', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 100, 200, 0)', 'rgba(50, 150, 250, 0.4)'],
    });

    // $FlowFixMe[incompatible-call]
    expect(interpolation(0)).toBe('rgba(0, 100, 200, 0)');
    // $FlowFixMe[incompatible-call]
    expect(interpolation(0.5)).toBe('rgba(25, 125, 225, 0.2)');
    // $FlowFixMe[incompatible-call]
    expect(interpolation(1)).toBe('rgba(50, 150, 250, 0.4)');
  });

  it('should work with output ranges as short hex string', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['#024', '#9BF'],
    });

    expect(interpolation(0)).toBe('rgba(0, 34, 68, 1)');
    expect(interpolation(0.5)).toBe('rgba(77, 111, 162, 1)');
    expect(interpolation(1)).toBe('rgba(153, 187, 255, 1)');
  });

  it('should work with output ranges as long hex string', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['#FF9500', '#87FC70'],
    });

    expect(interpolation(0)).toBe('rgba(255, 149, 0, 1)');
    expect(interpolation(0.5)).toBe('rgba(195, 201, 56, 1)');
    expect(interpolation(1)).toBe('rgba(135, 252, 112, 1)');
  });

  it('should work with output ranges with mixed hex and rgba strings', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['rgba(100, 120, 140, .4)', '#87FC70'],
    });

    expect(interpolation(0)).toBe('rgba(100, 120, 140, 0.4)');
    expect(interpolation(0.5)).toBe('rgba(118, 186, 126, 0.7)');
    expect(interpolation(1)).toBe('rgba(135, 252, 112, 1)');
  });

  it('should work with negative and decimal values in string ranges', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['-100.5deg', '100deg'],
    });

    expect(interpolation(0)).toBe('-100.5deg');
    expect(interpolation(0.5)).toBe('-0.25deg');
    expect(interpolation(1)).toBe('100deg');
  });

  it('should crash when chaining an interpolation that returns a string', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [0, 1],
    });
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      interpolation('45rad');
    }).toThrow();
  });

  it('should support a mix of color patterns', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1, 2],
      outputRange: ['rgba(0, 100, 200, 0)', 'rgb(50, 150, 250)', 'red'],
    });

    expect(interpolation(0)).toBe('rgba(0, 100, 200, 0)');
    expect(interpolation(0.5)).toBe('rgba(25, 125, 225, 0.5)');
    expect(interpolation(1.5)).toBe('rgba(153, 75, 125, 1)');
    expect(interpolation(2)).toBe('rgba(255, 0, 0, 1)');
  });

  it('should crash when defining output range with different pattern', () => {
    expect(() =>
      createInterpolation({
        inputRange: [0, 1],
        outputRange: ['20deg', '30rad'],
      }),
    ).toThrow();
  });

  it('should interpolate values with arbitrary suffixes', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['-10foo', '10foo'],
    });

    expect(interpolation(0)).toBe('-10foo');
    expect(interpolation(0.5)).toBe('0foo');
  });

  it('should interpolate numeric values of arbitrary format', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['M20,20L20,80L80,80L80,20Z', 'M40,40L33,60L60,60L65,40Z'],
    });

    expect(interpolation(0)).toBe('M20,20L20,80L80,80L80,20Z');
    expect(interpolation(0.5)).toBe('M30,30L26.5,70L70,70L72.5,30Z');
  });

  it('should round the alpha channel of a color to the nearest thousandth', () => {
    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: ['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 1)'],
    });

    expect(interpolation(1e-12)).toBe('rgba(0, 0, 0, 0)');
    expect(interpolation(2 / 3)).toBe('rgba(0, 0, 0, 0.667)');
  });

  it('should work with PlatformColor', () => {
    const mockWarn = jest.fn();
    // $FlowFixMe[cannot-write]
    console.warn = mockWarn;

    const interpolation = createInterpolation({
      inputRange: [0, 1],
      outputRange: [
        PlatformColor('@android:color/white'),
        PlatformColor('@android:color/darker_gray'),
      ],
    });

    // NativeColorValue is deferred to the native side to interpolate
    expect(interpolation(0)).toStrictEqual(
      PlatformColor('@android:color/white'),
    );
    expect(interpolation(2 / 3)).toStrictEqual(
      PlatformColor('@android:color/white'),
    );
    expect(mockWarn).toBeCalledWith(
      'PlatformColor interpolation should happen natively, here we fallback to the closest color',
    );
    expect(interpolation(1)).toStrictEqual(
      PlatformColor('@android:color/darker_gray'),
    );
  });

  for (const [label, outputRange, expected] of [
    ['radians', ['1rad', '2rad'], [1, 2]],
    ['degrees', ['90deg', '180deg'], [Math.PI / 2, Math.PI]],
    ['numbers', [1024, Math.PI], [1024, Math.PI]],
    ['unknown', ['5foo', '10foo'], ['5foo', '10foo']],
  ]) {
    it(`should convert ${label} to numbers in the native config`, () => {
      const config = new AnimatedInterpolation(
        // $FlowFixMe[incompatible-type]
        {},
        // $FlowFixMe[incompatible-call]
        {inputRange: [0, 1], outputRange},
      ).__getNativeConfig();
      expect(config.outputRange).toEqual(expected);
    });
  }
});

describe('Interpolation easingStops (native easing baking)', () => {
  // Returns the non-uniform [position, value] easing stops emitted in the native
  // config for an eased numeric interpolation (or undefined when no easing).
  function getEasingStops(
    config: InterpolationConfigType<number>,
  ): ?Array<[number, number]> {
    return new AnimatedInterpolation(
      // $FlowFixMe[incompatible-type]
      {},
      config,
    ).__getNativeConfig().easingStops;
  }

  // Mirrors the native easeRatio(): binary-search the bracketing stops and
  // linearly interpolate. Out-of-[0,1] ratios pass through (extrapolation).
  function reconstructEaseRatio(
    stops: Array<[number, number]>,
  ): (ratio: number) => number {
    return ratio => {
      if (stops.length < 2 || ratio < 0 || ratio > 1) {
        return ratio;
      }
      const upper = stops.findIndex(stop => stop[0] > ratio);
      if (upper === -1) {
        return stops[stops.length - 1][1];
      }
      if (upper === 0) {
        return stops[0][1];
      }
      const [xLo, yLo] = stops[upper - 1];
      const [xHi, yHi] = stops[upper];
      if (xHi === xLo) {
        return yHi;
      }
      return yLo + (yHi - yLo) * ((ratio - xLo) / (xHi - xLo));
    };
  }

  // Max error, in OUTPUT units, between the baked stops and the true easing
  // curve across the [0, 1] domain (sampled finely). This is what actually
  // shows up on screen, e.g. pixels for a translate.
  function maxOutputError(
    easing: (input: number) => number,
    span: number,
  ): number {
    const stops = getEasingStops({
      inputRange: [0, 1],
      outputRange: [0, span],
      easing,
    });
    if (stops == null) {
      throw new Error('expected easingStops to be emitted');
    }
    const approx = reconstructEaseRatio(stops);
    let maxErr = 0;
    for (let i = 0; i <= 1000; i++) {
      const t = i / 1000;
      const err = Math.abs(approx(t) - easing(t)) * span;
      if (err > maxErr) {
        maxErr = err;
      }
    }
    return maxErr;
  }

  // Computed once; reused for both the exact-output and the stop-count assertions.
  const customLinear = getEasingStops({
    inputRange: [0, 1],
    outputRange: [0, 100],
    easing: (t: number) => t,
  });
  const quad = getEasingStops({
    inputRange: [0, 1],
    outputRange: [0, 100],
    easing: Easing.quad,
  });
  const bounce = getEasingStops({
    inputRange: [0, 1],
    outputRange: [0, 100],
    easing: Easing.bounce,
  });
  const sine = getEasingStops({
    inputRange: [0, 1],
    outputRange: [0, 10],
    easing: Easing.inOut(Easing.sin),
  });

  it('omits easingStops when easing is linear by identity or absent', () => {
    const base = {inputRange: [0, 1], outputRange: [0, 100]};
    expect(getEasingStops(base)).toBe(undefined);
    expect(getEasingStops({...base, easing: Easing.linear})).toBe(undefined);
  });

  it('bakes the curve into exact stops whose count adapts to curvature', () => {
    // A custom linear fn (not the Easing.linear reference, so not short-circuited)
    // collapses to the two endpoints: every interior sample lies on the chord.
    expect(customLinear).toEqual([
      [0, 0],
      [1, 1],
    ]);

    // Constant-curvature quad -> RDP's midpoint splitting yields uniform 1/16
    // spacing; each value is the eased ratio (k/16)^2, independent of span.
    expect(quad).toEqual([
      [0, 0],
      [0.0625, 0.00390625],
      [0.125, 0.015625],
      [0.1875, 0.03515625],
      [0.25, 0.0625],
      [0.3125, 0.09765625],
      [0.375, 0.140625],
      [0.4375, 0.19140625],
      [0.5, 0.25],
      [0.5625, 0.31640625],
      [0.625, 0.390625],
      [0.6875, 0.47265625],
      [0.75, 0.5625],
      [0.8125, 0.66015625],
      [0.875, 0.765625],
      [0.9375, 0.87890625],
      [1, 1],
    ]);

    // A sine S-curve is placed non-uniformly: stops cluster at the two bends and
    // leave a large gap across the near-linear middle (0.35 -> 0.62).
    expect(sine).toEqual([
      [0, 0],
      [0.10546875, 0.02719633730973936],
      [0.21875, 0.1134947733186315],
      [0.34765625, 0.26973064452088],
      [0.62109375, 0.6856585969759188],
      [0.7421875, 0.8447702723685335],
      [0.875, 0.9619397662556434],
      [1, 1],
    ]);

    // Stop count rises with curvature — 2 (flat) -> 17 (quad) -> 45 (bounce) —
    // and is always bounded by the dense-sample budget (256 + 1 = 257).
    expect(bounce?.length).toBe(45);
    expect(bounce?.length).toBeLessThanOrEqual(257);
  });

  it('grows the stop count with output span, capped by the tolerance floor', () => {
    // Bigger span -> smaller tolerance -> more stops for the same curve...
    expect(
      getEasingStops({
        inputRange: [0, 1],
        outputRange: [0, 10],
        easing: Easing.quad,
      })?.length,
    ).toBe(9);
    expect(quad?.length).toBe(17); // span 100, computed once above
    expect(
      getEasingStops({
        inputRange: [0, 1],
        outputRange: [0, 1000],
        easing: Easing.quad,
      })?.length,
    ).toBe(33);
    // ...until epsilon hits its floor: a smooth curve caps out (65) rather than
    // densifying toward the dense-sample budget.
    expect(
      getEasingStops({
        inputRange: [0, 1],
        outputRange: [0, 100000],
        easing: Easing.quad,
      })?.length,
    ).toBe(65);
  });

  it('keeps on-screen error ~sub-pixel until the tolerance floor', () => {
    // Below the floor (span up to ~2500) error stays sub-pixel as span grows.
    for (const span of [1, 10, 100, 1000]) {
      expect(maxOutputError(Easing.quad, span)).toBeLessThan(0.3);
    }
    // Past the floor the error grows only with the floor tolerance (1e-4): ~1px
    // at span 10000, not the tens a fixed-resolution LUT would accumulate.
    expect(maxOutputError(Easing.quad, 10000)).toBeLessThan(1.5);
  });
});
