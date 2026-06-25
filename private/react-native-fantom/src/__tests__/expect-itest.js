/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import * as React from 'react';

function ensureError(fn: () => void): void {
  try {
    fn();
  } catch (e) {
    return;
  }

  throw new Error(`Expected function to throw, but it didn't`);
}

describe('expect', () => {
  test('toThrow', () => {
    expect(() => {
      throw new Error();
    }).toThrow();

    expect(() => {
      throw new Error('error message');
    }).toThrow('error message');

    expect(() => {
      throw new Error('error message');
    }).not.toThrow('error message 2');

    expect(() => {}).not.toThrow();

    ensureError(() => {
      expect(() => {}).toThrow();
    });

    ensureError(() => {
      expect(() => {
        throw new Error();
      }).not.toThrow();
    });
  });

  test('toBe', () => {
    expect(1).toBe(1);
    expect(1).not.toBe(2);

    const obj = {a: 1};
    const obj2 = {a: 1};

    expect(obj).toBe(obj);
    expect(obj).not.toBe(obj2);

    expect(() => {
      expect(obj).not.toBe(obj);
    }).toThrow();

    expect(() => {
      expect(1).not.toBe(1);
    }).toThrow();
  });

  test('toEqual', () => {
    expect(1).toEqual(1);
    expect(1).not.toEqual(2);

    const obj = {a: 1};
    const obj2 = {a: 1};
    const obj3 = {a: 2};

    expect(obj).toEqual(obj);
    expect(obj).toEqual(obj2);
    expect(obj).not.toEqual(obj3);

    expect(null).toEqual(null);
    expect(undefined).toEqual(undefined);
    expect(null).not.toEqual(undefined);

    expect({a: null}).not.toEqual({a: undefined});
    expect({a: undefined}).not.toEqual({});

    expect(() => {
      expect(obj).not.toEqual(obj2);
    }).toThrow();

    expect(() => {
      expect(obj).toEqual(obj3);
    }).toThrow();

    expect(() => {
      expect(1).not.toEqual(1);
    }).toThrow();

    expect(() => {
      expect(null).not.toEqual(null);
    }).toThrow();

    expect(() => {
      expect(undefined).not.toEqual(undefined);
    }).toThrow();

    expect(() => {
      expect({a: undefined}).toEqual({});
    }).toThrow();
  });

  test('toStrictEqual', () => {
    class LaCroix {
      flavor: string;
      constructor(flavor: string) {
        this.flavor = flavor;
      }
    }

    expect({a: undefined, b: 2}).not.toStrictEqual({b: 2});
    expect([2, undefined]).not.toStrictEqual([2]);
    expect([2]).not.toStrictEqual([2, undefined]);
    // This is part of spec https://jestjs.io/docs/expect#tostrictequalvalue
    // eslint-disable-next-line no-sparse-arrays
    expect([, 2]).not.toStrictEqual([undefined, 2]);
    expect(new LaCroix('lemon')).not.toStrictEqual({flavor: 'lemon'});

    expect({a: 1}).toStrictEqual({a: 1});
    expect([2, undefined]).toStrictEqual([2, undefined]);
    // This is part of spec https://jestjs.io/docs/expect#tostrictequalvalue
    // eslint-disable-next-line no-sparse-arrays
    expect([, 1]).toStrictEqual([, 1]);
    expect(new LaCroix('lemon')).toStrictEqual(new LaCroix('lemon'));

    expect(() => {
      expect(new LaCroix('lemon')).toStrictEqual({flavor: 'lemon'});
    }).toThrow();

    expect(() => {
      expect(new LaCroix('lemon')).not.toStrictEqual(new LaCroix('lemon'));
    }).toThrow();
  });

  test('toBeInstanceOf', () => {
    class Class {}

    expect(1).not.toBeInstanceOf(Number);
    expect(1).not.toBeInstanceOf(Class);

    expect(new Class()).toBeInstanceOf(Class);
    expect(new Class()).toBeInstanceOf(Object);
    expect(new Class()).not.toBeInstanceOf(Number);

    expect(() => {
      expect(1).toBeInstanceOf(Number);
    }).toThrow();

    expect(() => {
      expect(new Class()).not.toBeInstanceOf(Class);
    }).toThrow();
  });

  test('toBeCloseTo', () => {
    expect(1).toBeCloseTo(1.001);
    expect(1).toBeCloseTo(1.01, 1);
    expect(1).toBeCloseTo(1.1, 0);

    expect(() => {
      expect(1).toBeCloseTo(1.01);
    }).toThrow();

    expect(() => {
      expect(1).toBeCloseTo(1.1, 1);
    }).toThrow();

    expect(() => {
      expect(1).toBeCloseTo(2, 0);
    }).toThrow();
  });

  test('toBeDefined', () => {
    expect(null).toBeDefined();
    expect(false).toBeDefined();
    expect('value').toBeDefined();
    expect(undefined).not.toBeDefined();

    expect(() => {
      expect({}).not.toBeDefined();
    }).toThrow();

    expect(() => {
      expect(undefined).toBeDefined();
    }).toThrow();
  });

  test('toBeUndefined', () => {
    expect(undefined).toBeUndefined();
    expect(null).not.toBeUndefined();
    expect(false).not.toBeUndefined();
    expect('value').not.toBeUndefined();

    expect(() => {
      expect(undefined).not.toBeUndefined();
    }).toThrow();

    expect(() => {
      expect({}).toBeUndefined();
    }).toThrow();
  });

  test('toBeFalsy', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
    expect(undefined).toBeFalsy();
    expect(NaN).toBeFalsy();
    expect([]).not.toBeFalsy();
    expect(['']).not.toBeFalsy();

    expect(() => {
      expect(true).toBeFalsy();
    }).toThrow();

    expect(() => {
      expect(false).not.toBeFalsy();
    }).toThrow();
  });

  test('toBeTruthy', () => {
    expect(true).toBeTruthy();
    expect([]).toBeTruthy();
    expect('a').toBeTruthy();
    expect(false).not.toBeTruthy();
    expect(0).not.toBeTruthy();
    expect('').not.toBeTruthy();
    expect(null).not.toBeTruthy();
    expect(undefined).not.toBeTruthy();
    expect(NaN).not.toBeTruthy();

    expect(() => {
      expect(false).toBeTruthy();
    }).toThrow();

    expect(() => {
      expect(true).not.toBeTruthy();
    }).toThrow();
  });

  (['toBeCalled', 'toHaveBeenCalled'] as const).map(toHaveBeenCalledAlias =>
    test(toHaveBeenCalledAlias, () => {
      const fn = jest.fn();

      expect(fn).not[toHaveBeenCalledAlias]();

      expect(() => {
        expect(fn)[toHaveBeenCalledAlias]();
      }).toThrow();

      fn();

      expect(fn)[toHaveBeenCalledAlias]();

      expect(() => {
        expect(fn).not[toHaveBeenCalledAlias]();
      }).toThrow();

      // Passing functions that aren't mocks should always fail
      expect(() => {
        expect(() => {})[toHaveBeenCalledAlias]();
      }).toThrow();

      expect(() => {
        expect(() => {}).not[toHaveBeenCalledAlias]();
      }).toThrow();
    }),
  );

  (['toBeCalledTimes', 'toHaveBeenCalledTimes'] as const).map(
    toHaveBeenCalledTimesAlias =>
      test(toHaveBeenCalledTimesAlias, () => {
        const fn = jest.fn();

        expect(fn)[toHaveBeenCalledTimesAlias](0);
        expect(fn).not[toHaveBeenCalledTimesAlias](1);

        expect(() => {
          expect(fn).not[toHaveBeenCalledTimesAlias](0);
        }).toThrow();

        expect(() => {
          expect(fn)[toHaveBeenCalledTimesAlias](1);
        }).toThrow();

        fn();

        expect(fn).not[toHaveBeenCalledTimesAlias](0);
        expect(fn)[toHaveBeenCalledTimesAlias](1);

        expect(() => {
          expect(fn)[toHaveBeenCalledTimesAlias](0);
        }).toThrow();

        expect(() => {
          expect(fn).not[toHaveBeenCalledTimesAlias](1);
        }).toThrow();

        // Passing functions that aren't mocks should always fail
        expect(() => {
          expect(() => {})[toHaveBeenCalledTimesAlias](0);
        }).toThrow();

        expect(() => {
          expect(() => {}).not[toHaveBeenCalledTimesAlias](1);
        }).toThrow();
      }),
  );

  (['toBeCalledWith', 'toHaveBeenCalledWith'] as const).map(
    toHaveBeenCalledWithAlias =>
      test(toHaveBeenCalledWithAlias, () => {
        const fn = jest.fn();

        expect(fn).not[toHaveBeenCalledWithAlias]();

        expect(() => {
          expect(fn)[toHaveBeenCalledWithAlias]();
        }).toThrow();

        fn('happy');
        fn({a: 1}, 2);
        fn(['fantom'], {isAwesome: true});

        expect(fn)[toHaveBeenCalledWithAlias]('happy');
        expect(fn)[toHaveBeenCalledWithAlias]({a: 1}, 2);
        expect(fn)[toHaveBeenCalledWithAlias](['fantom'], {isAwesome: true});
        expect(fn).not[toHaveBeenCalledWithAlias]();
        expect(fn).not[toHaveBeenCalledWithAlias]({a: 1});
        expect(fn).not[toHaveBeenCalledWithAlias]({a: 1}, 2, null);
        expect(fn).not[toHaveBeenCalledWithAlias]({a: 1, b: 2}, 2);

        expect(() => {
          expect(fn).not[toHaveBeenCalledWithAlias]({a: 1}, 2);
        }).toThrow();

        expect(() => {
          expect(fn)[toHaveBeenCalledWithAlias](1);
        }).toThrow();

        // Passing functions that aren't mocks should always fail
        expect(() => {
          expect(() => {})[toHaveBeenCalledWithAlias]();
        }).toThrow();

        expect(() => {
          expect(() => {}).not[toHaveBeenCalledWithAlias]();
        }).toThrow();
      }),
  );

  (['lastCalledWith', 'toHaveBeenLastCalledWith'] as const).map(
    toHaveBeenLastCalledWithAlias =>
      test(toHaveBeenLastCalledWithAlias, () => {
        const fn = jest.fn();

        expect(fn).not[toHaveBeenLastCalledWithAlias]();
        expect(fn).not[toHaveBeenLastCalledWithAlias]({});

        expect(() => {
          expect(fn)[toHaveBeenLastCalledWithAlias]();
        }).toThrow();

        fn('happy');
        expect(fn)[toHaveBeenLastCalledWithAlias]('happy');
        expect(fn).not[toHaveBeenLastCalledWithAlias]();

        fn();
        expect(fn)[toHaveBeenLastCalledWithAlias]();
        expect(fn).not[toHaveBeenLastCalledWithAlias]('happy');

        fn({a: 1}, 2);

        expect(fn)[toHaveBeenLastCalledWithAlias]({a: 1}, 2);
        expect(fn).not[toHaveBeenLastCalledWithAlias]();
        expect(fn).not[toHaveBeenLastCalledWithAlias]({a: 1});
        expect(fn).not[toHaveBeenLastCalledWithAlias]({a: 2}, 2);
        expect(fn).not[toHaveBeenLastCalledWithAlias]({a: 1}, 2, undefined);

        expect(() => {
          expect(fn).not[toHaveBeenLastCalledWithAlias]({a: 1}, 2);
        }).toThrow();

        expect(() => {
          expect(fn)[toHaveBeenLastCalledWithAlias](1);
        }).toThrow();

        // Passing functions that aren't mocks should always fail
        expect(() => {
          expect(() => {})[toHaveBeenLastCalledWithAlias]();
        }).toThrow();

        expect(() => {
          expect(() => {}).not[toHaveBeenLastCalledWithAlias]();
        }).toThrow();
      }),
  );

  (['nthCalledWith', 'toHaveBeenNthCalledWith'] as const).map(
    toHaveBeenNthCalledWithAlias =>
      test(toHaveBeenNthCalledWithAlias, () => {
        const fn = jest.fn();

        expect(fn).not[toHaveBeenNthCalledWithAlias](1);
        expect(fn).not[toHaveBeenNthCalledWithAlias](1, {});

        expect(() => {
          expect(fn)[toHaveBeenNthCalledWithAlias](0);
        }).toThrow();

        expect(() => {
          expect(fn)[toHaveBeenNthCalledWithAlias](1);
        }).toThrow();

        fn('happy');
        fn();
        fn({a: 1}, 2);

        expect(fn)[toHaveBeenNthCalledWithAlias](1, 'happy');
        expect(fn)[toHaveBeenNthCalledWithAlias](2);
        expect(fn)[toHaveBeenNthCalledWithAlias](3, {a: 1}, 2);
        expect(fn).not[toHaveBeenNthCalledWithAlias](1);
        expect(fn).not[toHaveBeenNthCalledWithAlias](3, {a: 1});
        expect(fn).not[toHaveBeenNthCalledWithAlias](3, {a: 2}, 2);
        expect(fn).not[toHaveBeenNthCalledWithAlias](3, {a: 1}, 2, undefined);

        expect(() => {
          expect(fn).not[toHaveBeenNthCalledWithAlias](3, {a: 1}, 2);
        }).toThrow();

        expect(() => {
          expect(fn)[toHaveBeenNthCalledWithAlias](1);
        }).toThrow();

        // Passing functions that aren't mocks should always fail
        expect(() => {
          expect(() => {})[toHaveBeenNthCalledWithAlias](1);
        }).toThrow();

        expect(() => {
          expect(() => {}).not[toHaveBeenNthCalledWithAlias](1);
        }).toThrow();
      }),
  );

  describe('jest.fn()', () => {
    it('tracks execution of functions without implementations', () => {
      const fn = jest.fn();

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      expect(fn()).toBe(undefined);

      expect(fn.mock.calls).toEqual([[]]);
      expect(fn.mock.lastCall).toEqual([]);
      expect(fn.mock.instances).toEqual([undefined]);
      expect(fn.mock.contexts).toEqual([global]);
      expect(fn.mock.contexts[0]).toBe(global);
      expect(fn.mock.results).toEqual([{value: undefined, isThrow: false}]);
    });

    it('tracks execution of methods without implementations', () => {
      const fn = jest.fn();

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      const obj = {fn};
      expect(obj.fn()).toBe(undefined);

      expect(fn.mock.calls).toEqual([[]]);
      expect(fn.mock.lastCall).toEqual([]);
      expect(fn.mock.instances).toEqual([undefined]);
      expect(fn.mock.contexts).toEqual([obj]);
      expect(fn.mock.contexts[0]).toBe(obj);
      expect(fn.mock.results).toEqual([{value: undefined, isThrow: false}]);
    });

    it('tracks constructors without implementations', () => {
      const fn = jest.fn();

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      // $FlowExpectedError[invalid-constructor]
      const instance = new fn();
      expect(instance).toBeInstanceOf(Object);

      expect(fn.mock.calls).toEqual([[]]);
      expect(fn.mock.lastCall).toEqual([]);
      expect(fn.mock.instances).toEqual([instance]);
      expect(fn.mock.instances[0]).toBe(instance);
      expect(fn.mock.contexts).toEqual([instance]);
      expect(fn.mock.contexts[0]).toBe(instance);
      expect(fn.mock.results).toEqual([{value: undefined, isThrow: false}]);
    });

    it('tracks execution of functions with an implementation', () => {
      const fn = jest.fn((a, b) => {
        return a + b;
      });

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      expect(fn(1, 2)).toBe(3);

      expect(fn.mock.calls).toEqual([[1, 2]]);
      expect(fn.mock.lastCall).toEqual([1, 2]);
      expect(fn.mock.instances).toEqual([undefined]);
      expect(fn.mock.contexts).toEqual([global]);
      expect(fn.mock.contexts[0]).toBe(global);
      expect(fn.mock.results).toEqual([{value: 3, isThrow: false}]);
    });

    it('tracks execution of methods with an implementation', () => {
      const fn = jest.fn(function (this: {prop: number}): number {
        return this.prop;
      });

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      const obj = {fn, prop: 2};
      expect(obj.fn()).toBe(2);

      expect(fn.mock.calls).toEqual([[]]);
      expect(fn.mock.lastCall).toEqual([]);
      expect(fn.mock.instances).toEqual([undefined]);
      expect(fn.mock.contexts).toEqual([obj]);
      expect(fn.mock.contexts[0]).toBe(obj);
      expect(fn.mock.results).toEqual([{value: 2, isThrow: false}]);
    });

    it('tracks constructors with an implementation', () => {
      const fn = jest.fn(function (this: {prop: number}) {
        this.prop = 3;
      });

      expect(fn).toBeInstanceOf(Function);

      expect(fn.mock.calls).toEqual([]);
      expect(fn.mock.lastCall).toBe(undefined);
      expect(fn.mock.instances).toEqual([]);
      expect(fn.mock.contexts).toEqual([]);
      expect(fn.mock.results).toEqual([]);

      // $FlowExpectedError[invalid-constructor]
      const instance = new fn();
      expect(instance).toBeInstanceOf(Object);

      expect(instance.prop).toBe(3);

      expect(fn.mock.calls).toEqual([[]]);
      expect(fn.mock.lastCall).toEqual([]);
      expect(fn.mock.instances).toEqual([instance]);
      expect(fn.mock.instances[0]).toBe(instance);
      expect(fn.mock.contexts).toEqual([instance]);
      expect(fn.mock.contexts[0]).toBe(instance);
      expect(fn.mock.results).toEqual([{value: undefined, isThrow: false}]);
    });
  });

  test('toBeNull()', () => {
    expect(null).toBeNull();
    expect('string value').not.toBeNull();

    expect(() => {
      expect(null).not.toBeNull();
    }).toThrow();

    expect(() => {
      expect('string value').toBeNull();
    }).toThrow();
  });

  test('toBeLessThan', () => {
    expect(1).toBeLessThan(2);

    expect(1).not.toBeLessThan(1);

    expect(1).not.toBeLessThan(0);

    expect(() => {
      expect(1).toBeLessThan(0);
    }).toThrow();

    expect(() => {
      expect(1).toBeLessThan(1);
    }).toThrow();

    expect(() => {
      expect(1).not.toBeLessThan(2);
    }).toThrow();

    // Should always throw if the received value isn't a number
    expect(() => {
      expect('string value').toBeLessThan(1);
    }).toThrow();

    expect(() => {
      expect('string value').not.toBeLessThan(1);
    }).toThrow();

    // Should always throw if the expected value isn't a number
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).toBeLessThan('string value');
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).not.toBeLessThan('string value');
    }).toThrow();
  });

  test('toBeLessThanOrEqual', () => {
    expect(1).toBeLessThanOrEqual(1);
    expect(1).toBeLessThanOrEqual(2);

    expect(1).not.toBeLessThanOrEqual(0.8);

    expect(() => {
      expect(1).not.toBeLessThanOrEqual(1);
    }).toThrow();

    expect(() => {
      expect(1).not.toBeLessThanOrEqual(2);
    }).toThrow();

    // Should always throw if the received value isn't a number
    expect(() => {
      expect('string value').toBeLessThanOrEqual(1);
    }).toThrow();

    expect(() => {
      expect('string value').not.toBeLessThanOrEqual(1);
    }).toThrow();

    // Should always throw if the expected value isn't a number
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).toBeLessThanOrEqual('string value');
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).not.toBeLessThanOrEqual('string value');
    }).toThrow();
  });

  test('toBeGreaterThan', () => {
    expect(1).toBeGreaterThan(0);

    expect(1).not.toBeGreaterThan(1);

    expect(1).not.toBeGreaterThan(2);

    expect(() => {
      expect(1).toBeGreaterThan(2);
    }).toThrow();

    expect(() => {
      expect(1).not.toBeGreaterThan(0);
    }).toThrow();

    // Should always throw if the received value isn't a number
    expect(() => {
      expect('string value').toBeGreaterThan(1);
    }).toThrow();

    expect(() => {
      expect('string value').not.toBeGreaterThan(1);
    }).toThrow();

    // Should always throw if the expected value isn't a number
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).toBeGreaterThan('string value');
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).not.toBeGreaterThan('string value');
    }).toThrow();
  });

  test('toBeGreaterThanOrEqual', () => {
    expect(1).toBeGreaterThanOrEqual(0);
    expect(1).toBeGreaterThanOrEqual(1);

    expect(1).not.toBeGreaterThanOrEqual(2);

    expect(() => {
      expect(1).not.toBeGreaterThanOrEqual(0);
    }).toThrow();

    expect(() => {
      expect(1).not.toBeGreaterThanOrEqual(1);
    }).toThrow();

    // Should always throw if the received value isn't a number
    expect(() => {
      expect('string value').toBeGreaterThanOrEqual(1);
    }).toThrow();

    expect(() => {
      expect('string value').not.toBeGreaterThanOrEqual(1);
    }).toThrow();

    // Should always throw if the expected value isn't a number
    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).toBeGreaterThanOrEqual('string value');
    }).toThrow();

    expect(() => {
      // $FlowExpectedError[incompatible-type]
      expect(1).not.toBeGreaterThanOrEqual('string value');
    }).toThrow();
  });

  test('toContain', () => {
    expect('hello').toContain('he');
    expect('hello').not.toContain('lol');
    expect([1, 2, 3]).toContain(1);
    expect([1, 2, 3]).not.toContain(4);

    const obj = {a: 1};
    expect([obj, {a: 2}, {a: 3}]).toContain(obj);
    expect([obj]).not.toContain({a: 1});

    expect(() => {
      expect([]).toContain(obj);
    }).toThrow();

    expect(() => {
      expect('hello').not.toContain('e');
    }).toThrow();
  });

  test('toContainEqual', () => {
    expect('hello').toContainEqual('he');
    expect('hello').not.toContainEqual('lol');
    expect([1, 2, 3]).toContainEqual(1);
    expect([1, 2, 3]).not.toContainEqual(4);

    const obj = {a: 1};
    expect([obj, {a: 2}, {a: 3}]).toContainEqual(obj);
    expect([obj]).toContainEqual({a: 1});
    expect([[obj]]).toContainEqual([{a: 1}]);
    expect([obj]).not.toContainEqual({a: 2});

    expect(() => {
      expect([]).toContainEqual(obj);
    }).toThrow();

    expect(() => {
      expect([{a: 1}]).not.toContainEqual({a: 1});
    }).toThrow();
  });

  test('toHaveLength', () => {
    expect('hello').toHaveLength(5);
    expect('hello').not.toHaveLength(6);
    expect([1, 2, 3]).toHaveLength(3);
    expect([1, 2, 3]).not.toHaveLength(4);

    expect(() => {
      expect('asd').toHaveLength(4);
    }).toThrow();

    expect(() => {
      expect([1]).not.toHaveLength(1);
    }).toThrow();

    // non string/array objects should always throw
    expect(() => {
      expect({length: 1}).toHaveLength(1);
    }).toThrow();
  });

  test('toMatch', () => {
    expect('hello').toMatch('he');
    expect('hello').toMatch(/he/);
    expect('hello').not.toMatch('lol');
    expect('hello').not.toMatch(/lol/);

    expect(() => {
      expect('hello').not.toMatch(/he/);
    }).toThrow('Expected hello not to match /he/');

    // Should always throw if the received value isn't a string
    expect(() => {
      expect(1).toMatch(/e/);
    }).toThrow();

    expect(() => {
      expect('grapefruits').not.toMatch('fruit');
    }).toThrow();
  });

  describe('toMatchSnapshot()', () => {
    test('primitive types', () => {
      expect(undefined).toMatchSnapshot();
      expect(null).toMatchSnapshot();
      expect(true).toMatchSnapshot();
      expect(1).toMatchSnapshot();
      expect(BigInt(1)).toMatchSnapshot();
      expect('foo').toMatchSnapshot();
      expect('foo\nbar').toMatchSnapshot('multiline');
      expect(Symbol('foo')).toMatchSnapshot();
    });

    test('complex types', () => {
      expect({foo: 'bar'}).toMatchSnapshot();
      expect(<span>hello</span>).toMatchSnapshot();
      expect(function foo() {}).toMatchSnapshot();
      expect(new Map([['foo', 'bar']])).toMatchSnapshot();
      expect(new Set([1, 2])).toMatchSnapshot();
      expect(new Date('2025-01-02')).toMatchSnapshot();
      expect(new Error()).toMatchSnapshot();
      expect(new RegExp('asd')).toMatchSnapshot();
      // TODO(T245412835): uncomment this once we support Hermes V1 in OSS fantom.
      // expect(new Promise(() => {})).toMatchSnapshot();
    });

    test('named snapshots', () => {
      expect({a: 'b'}).toMatchSnapshot('named snapshot');
    });
  });

  describe('toMatchInlineSnapshot()', () => {
    test('primitive types', () => {
      expect(42).toMatchInlineSnapshot(`42`);
      expect('hello').toMatchInlineSnapshot(`"hello"`);
      expect(true).toMatchInlineSnapshot(`true`);
      expect(null).toMatchInlineSnapshot(`null`);
      expect(undefined).toMatchInlineSnapshot(`undefined`);
      expect('foo\nbar').toMatchInlineSnapshot(`
        "foo
        bar"
      `);
    });

    test('complex types', () => {
      expect({foo: 'bar'}).toMatchInlineSnapshot(`
        Object {
          "foo": "bar",
        }
      `);
      expect(new Map([['foo', 'bar']])).toMatchInlineSnapshot(`
        Map {
          "foo" => "bar",
        }
      `);
      expect(new Set([1, 2])).toMatchInlineSnapshot(`
        Set {
          1,
          2,
        }
      `);
      expect(new Date('2025-01-02')).toMatchInlineSnapshot(
        `2025-01-02T00:00:00.000Z`,
      );
      expect(new Error()).toMatchInlineSnapshot(`[Error]`);
      expect(new RegExp('asd')).toMatchInlineSnapshot(`/asd/`);
      expect(function foo() {}).toMatchInlineSnapshot(`[Function foo]`);
    });

    test('JSX elements', () => {
      expect(<span>hello</span>).toMatchInlineSnapshot(`
        <span>
          hello
        </span>
      `);
      expect(
        <div>
          <span>nested</span>
        </div>,
      ).toMatchInlineSnapshot(`
        <div>
          <span>
            nested
          </span>
        </div>
      `);
    });
  });
});
