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
 * @copyright 2014-2015 Gaetan Renaudeau. MIT License.
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
