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

import {AnimatedEvent} from '../../../../Libraries/Animated/AnimatedEvent';
import AnimatedValue from '../../../../Libraries/Animated/nodes/AnimatedValue';
import {
  areCompositeKeysEqual,
  createCompositeKeyForProps,
} from '../createAnimatedPropsMemoHook';

describe('createCompositeKeyForProps', () => {
  describe('with allowlist', () => {
    it('excludes non-array and non-object allowlisted props', () => {
      const props = {string: 'abc', number: 123, boolean: true, function() {}};
      const allowlist = {
        string: true,
        number: true,
        boolean: true,
        function: true,
      } as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual(null);
    });

    it('does not search non-allowlisted props', () => {
      const getter = jest.fn(() => ({}));
      const props = {
        object: {
          // $FlowExpectedError[unsafe-getters-setters]
          get property() {
            return getter();
          },
        },
      };
      const allowlist = {};
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual(null);
      expect(getter).not.toHaveBeenCalled();
    });

    it('includes allowlisted `AnimatedEvent` props at first depth', () => {
      const props = {
        foo: new AnimatedEvent([], {useNativeDriver: true}),
        bar: new AnimatedEvent([], {useNativeDriver: true}),
      };
      const allowlist = {
        bar: true,
      } as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual({bar: props.bar});
      expect(compositeKey?.bar).toBe(props.bar);
    });

    it('excludes allowlisted `AnimatedEvent` props in the `style` prop', () => {
      const props = {
        style: {
          // This is invalid usage, but including for testing.
          baz: new AnimatedEvent([], {useNativeDriver: true}),
        },
      };
      const allowlist = {
        style: {
          baz: true,
        },
      } as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual(null);
    });

    it('includes allowlisted `AnimatedNode` props', () => {
      const props = {
        foo: new AnimatedValue(1),
        bar: new AnimatedValue(1),
      };
      const allowlist = {
        bar: true,
      } as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual({bar: props.bar});
      expect(compositeKey?.bar).toBe(props.bar);
    });

    it('excludes non-allowlisted `style` props', () => {
      const props = {
        style: {opacity: new AnimatedValue(1)},
      };
      const allowlist = {};
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual(null);
    });

    it('searches the `style` prop for allowlisted `AnimatedNode` instances', () => {
      const opacity = new AnimatedValue(1);
      const rotateY = new AnimatedValue(1);
      const props = {
        style: {opacity, transform: [{rotateX: 1}, {rotateY}, {rotateZ: 1}]},
      };
      const allowlist = {style: {transform: true}} as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual({
        style: {
          transform: [null, {rotateY}, null],
        },
      });
      // $FlowFixMe[prop-missing]
      expect(compositeKey?.style?.transform?.[1]?.rotateY).toBe(rotateY);
    });

    it('flattens the `style` prop before searching it', () => {
      const opacityA = new AnimatedValue(1);
      const opacityB = new AnimatedValue(1);
      const props = {
        style: [{opacity: opacityA}, {opacity: opacityB}],
      };
      const allowlist = {style: {opacity: true}} as const;
      const compositeKey = createCompositeKeyForProps(props, allowlist);

      expect(compositeKey).toEqual({style: {opacity: opacityB}});
      expect(compositeKey?.style?.opacity).toBe(opacityB);
    });
  });

  describe('without allowlist', () => {
    it('excludes non-array and non-object props', () => {
      const props = {string: 'abc', number: 123, boolean: true, function() {}};
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual(null);
    });

    it('includes array props without searching them', () => {
      const props = {array: [{letter: 'a'}, {letter: 'b'}, {letter: 'c'}]};
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({array: props.array});
      expect(compositeKey?.array).toBe(props.array);
    });

    it('includes object props without searching them', () => {
      const props = {object: {foo: [1], bar: [2], baz: [3]}};
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({object: props.object});
      expect(compositeKey?.object).toBe(props.object);
    });

    it('includes `AnimatedEvent` props at first depth', () => {
      const props = {
        foo: new AnimatedEvent([], {useNativeDriver: true}),
        object: {
          bar: new AnimatedEvent([], {useNativeDriver: true}),
        },
      };
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({
        foo: props.foo,
        object: props.object,
      });
      expect(compositeKey?.foo).toBe(props.foo);
      expect(compositeKey?.object).toBe(props.object);
    });

    it('excludes `AnimatedEvent` props in the `style` prop', () => {
      const props = {
        style: {
          // This is invalid usage, but including for testing.
          baz: new AnimatedEvent([], {useNativeDriver: true}),
        },
      };
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual(null);
    });

    it('includes `AnimatedNode` props', () => {
      const foo = new AnimatedValue(1);
      const bar = new AnimatedValue(1);
      const props = {foo, bar};
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({foo, bar});
      expect(compositeKey?.foo).toBe(foo);
      expect(compositeKey?.bar).toBe(bar);
    });

    it('searches the `style` prop for `AnimatedNode` instances', () => {
      const opacity = new AnimatedValue(1);
      const rotateY = new AnimatedValue(1);
      const props = {
        style: {opacity, transform: [{rotateX: 1}, {rotateY}, {rotateZ: 1}]},
      };
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({
        style: {
          opacity,
          transform: [null, {rotateY}, null],
        },
      });
      expect(compositeKey?.style?.opacity).toBe(opacity);
      // $FlowFixMe[prop-missing]
      expect(compositeKey?.style?.transform?.[1]?.rotateY).toBe(rotateY);
    });

    it('flattens the `style` prop before searching it', () => {
      const opacityA = new AnimatedValue(1);
      const opacityB = new AnimatedValue(1);
      const props = {
        style: [{opacity: opacityA}, {opacity: opacityB}],
      };
      const compositeKey = createCompositeKeyForProps(props);

      expect(compositeKey).toEqual({
        style: {opacity: opacityB},
      });
      expect(compositeKey?.style?.opacity).toBe(opacityB);
    });
  });
});

describe('areCompositeKeysEqual', () => {
  it('compares identical keys without traversal', () => {
    const getter = jest.fn(() => ({}));
    const compositeKey = {
      object: {
        // $FlowExpectedError[unsafe-getters-setters]
        get property() {
          return getter();
        },
      },
    };

    expect(areCompositeKeysEqual(compositeKey, compositeKey, null)).toBe(true);
    expect(getter).not.toHaveBeenCalled();
  });

  it('compares null keys', () => {
    const compositeKey = {foo: new AnimatedValue(1)};

    expect(areCompositeKeysEqual(null, null, null)).toBe(true);
    expect(areCompositeKeysEqual(null, compositeKey, null)).toBe(false);
    expect(areCompositeKeysEqual(compositeKey, null, null)).toBe(false);
  });

  it('compares keys with different lengths', () => {
    const compositeKeyA = {foo: new AnimatedValue(1)};
    const compositeKeyB = {
      foo: new AnimatedValue(1),
      bar: new AnimatedValue(1),
    };

    expect(areCompositeKeysEqual(compositeKeyA, compositeKeyB, null)).toBe(
      false,
    );
    expect(areCompositeKeysEqual(compositeKeyB, compositeKeyA, null)).toBe(
      false,
    );
  });

  it('compares keys with `AnimatedNode` instances', () => {
    const foo = new AnimatedValue(1);
    const bar = new AnimatedValue(1);

    expect(areCompositeKeysEqual({foo, bar}, {foo, bar}, null)).toBe(true);
    expect(areCompositeKeysEqual({foo}, {foo: bar}, null)).toBe(false);
  });

  it('compares keys with `AnimatedEvent` instances', () => {
    const foo = new AnimatedEvent([], {useNativeDriver: true});
    const bar = new AnimatedEvent([], {useNativeDriver: true});

    expect(areCompositeKeysEqual({foo, bar}, {foo, bar}, null)).toBe(true);
    expect(areCompositeKeysEqual({foo}, {foo: bar}, null)).toBe(false);
  });

  it('compares keys with `style` props and identical `AnimatedNode`', () => {
    const opacity = new AnimatedValue(1);
    const rotateY = new AnimatedValue(1);
    const compositeKeyA = {
      style: {
        opacity,
        transform: [null, {rotateY}, null],
      },
    };
    const compositeKeyB = {
      style: {
        opacity,
        transform: [null, {rotateY}, null],
      },
    };

    expect(areCompositeKeysEqual(compositeKeyA, compositeKeyB, null)).toBe(
      true,
    );
    expect(areCompositeKeysEqual(compositeKeyB, compositeKeyA, null)).toBe(
      true,
    );
  });

  it('compares keys with `style` props and different `AnimatedNode`', () => {
    const opacity = new AnimatedValue(1);
    const compositeKeyA = {
      style: {
        opacity,
        transform: [null, {rotateY: new AnimatedValue(1)}, null],
      },
    };
    const compositeKeyB = {
      style: {
        opacity,
        transform: [null, {rotateY: new AnimatedValue(1)}, null],
      },
    };

    expect(areCompositeKeysEqual(compositeKeyA, compositeKeyB, null)).toBe(
      false,
    );
    expect(areCompositeKeysEqual(compositeKeyB, compositeKeyA, null)).toBe(
      false,
    );
  });

  it('compares keys with arrays and objects', () => {
    const bar = new AnimatedValue(1);

    // If not in the allowlist, must be `===`.
    expect(areCompositeKeysEqual({foo: [bar]}, {foo: [bar]}, null)).toBe(false);
    expect(areCompositeKeysEqual({foo: {bar}}, {foo: {bar}}, null)).toBe(false);

    // If in the allowlist, arrays and objects are traversed.
    expect(areCompositeKeysEqual({foo: [bar]}, {foo: [bar]}, {foo: true})).toBe(
      true,
    );
    expect(areCompositeKeysEqual({foo: {bar}}, {foo: {bar}}, {foo: true})).toBe(
      true,
    );
  });

  it('compares arrays with identical `AnimatedNode` at different indices', () => {
    const bar = new AnimatedValue(1);

    expect(
      areCompositeKeysEqual({foo: [bar, null]}, {foo: [null, bar]}, null),
    ).toBe(false);
    expect(
      areCompositeKeysEqual(
        {foo: [bar, null]},
        {foo: [null, bar]},
        {foo: true},
      ),
    ).toBe(false);
  });
});
