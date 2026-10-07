/**
 * Portions Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

/**
 * BezierEasing - use bezier curve for transition easing function
 * https://github.com/gre/bezier-easing
 * @copyright 2014-2026 Gaetan Renaudeau. MIT License.
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import bezier from '../bezier';

const identity = function (x: number) {
  return x;
};

function assertClose(a: number, b: number, precision: number = 3) {
  expect(a).toBeCloseTo(b, precision);
}

function makeAssertCloseWithPrecision(precision: number) {
  return function (a: number, b: number) {
    assertClose(a, b, precision);
  };
}

function allEquals(
  be1: (x: number) => number,
  be2: (x: number) => number,
  samples: number,
  assertion: $FlowFixMe,
) {
  if (!assertion) {
    assertion = assertClose;
  }
  for (let i = 0; i <= samples; ++i) {
    const x = i / samples;
    assertion(be1(x), be2(x));
  }
}

function repeat(n: number) {
  return function (f: () => void) {
    for (let i = 0; i < n; ++i) {
      f();
    }
  };
}

describe('bezier', function () {
  it('should be a function', function () {
    expect(typeof bezier === 'function').toBe(true);
  });
  it('should creates an object', function () {
    expect(typeof bezier(0, 0, 1, 1) === 'function').toBe(true);
  });
  it('should fail with wrong arguments', function () {
    expect(function () {
      bezier(0.5, 0.5, -5, 0.5);
    }).toThrow();
    expect(function () {
      bezier(0.5, 0.5, 5, 0.5);
    }).toThrow();
    expect(function () {
      bezier(-2, 0.5, 0.5, 0.5);
    }).toThrow();
    expect(function () {
      bezier(2, 0.5, 0.5, 0.5);
    }).toThrow();
  });
  describe('linear curves', function () {
    it('should be linear', function () {
      allEquals(bezier(0, 0, 1, 1), bezier(1, 1, 0, 0), 100);
      allEquals(bezier(0, 0, 1, 1), identity, 100);
    });
  });
  describe('common properties', function () {
    it('should be the right value at extremes', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = 2 * Math.random() - 0.5,
          c = Math.random(),
          d = 2 * Math.random() - 0.5;
        const easing = bezier(a, b, c, d);
        expect(easing(0)).toBe(0);
        expect(easing(1)).toBe(1);
      });
    });

    it('should approach the projected value of its x=y projected curve', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = Math.random(),
          c = Math.random(),
          d = Math.random();
        const easing = bezier(a, b, c, d);
        const projected = bezier(b, a, d, c);
        const composed = function (x: number) {
          return projected(easing(x));
        };
        allEquals(identity, composed, 100, makeAssertCloseWithPrecision(2));
      });
    });
  });
  describe('precision', function () {
    it('should match points of the curve', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = 2 * Math.random() - 0.5,
          c = Math.random(),
          d = 2 * Math.random() - 0.5;
        const easing = bezier(a, b, c, d);
        for (let i = 1; i < 100; ++i) {
          const t = i / 100;
          const x =
            3 * a * t * (1 - t) * (1 - t) + 3 * c * t * t * (1 - t) + t * t * t;
          const y =
            3 * b * t * (1 - t) * (1 - t) + 3 * d * t * t * (1 - t) + t * t * t;
          assertClose(easing(x), y, 8);
        }
      });
    });
    it('should be precise near the extremes', function () {
      // x(t) = t³, y(t) = t² (3 - 2t)
      const easing = bezier(0, 0, 0, 1);
      for (const t of [1e-6, 1e-3, 0.999]) {
        // relative precision
        assertClose(easing(t * t * t) / (t * t * (3 - 2 * t)), 1, 10);
      }
      expect(easing(Number.MIN_VALUE)).toBeGreaterThan(0);
    });
    it('should be monotonic on steep curves', function () {
      const easing = bezier(1, 0, 0, 1);
      let previous = 0;
      for (let i = 1; i <= 10000; ++i) {
        const y = easing(0.49 + (0.02 * i) / 10000);
        expect(y).toBeGreaterThanOrEqual(previous);
        previous = y;
      }
    });
  });
  describe('outside of [0, 1]', function () {
    it('should saturate to 0 / 1', function () {
      const easing = bezier(0.25, 0.1, 0.25, 1);
      expect(easing(-0.5)).toBe(0);
      expect(easing(1.5)).toBe(1);
      expect(Number.isNaN(easing(NaN))).toBe(true);
    });
    it('should keep linear curves as the identity', function () {
      expect(bezier(0.3, 0.3, 0.6, 0.6)(-0.5)).toBe(-0.5);
    });
  });
  describe('two same instances', function () {
    it('should be strictly equals', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = 2 * Math.random() - 0.5,
          c = Math.random(),
          d = 2 * Math.random() - 0.5;
        allEquals(bezier(a, b, c, d), bezier(a, b, c, d), 100, 0);
      });
    });
  });
  describe('symmetric curves', function () {
    it('should have a central value y~=0.5 at x=0.5', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = 2 * Math.random() - 0.5,
          c = 1 - a,
          d = 1 - b;
        const easing = bezier(a, b, c, d);
        assertClose(easing(0.5), 0.5, 2);
      });
    });
    it('should be symmetrical', function () {
      repeat(10)(function () {
        const a = Math.random(),
          b = 2 * Math.random() - 0.5,
          c = 1 - a,
          d = 1 - b;
        const easing = bezier(a, b, c, d);
        const sym = function (x: number) {
          return 1 - easing(1 - x);
        };
        allEquals(easing, sym, 100, makeAssertCloseWithPrecision(2));
      });
    });
  });
});
