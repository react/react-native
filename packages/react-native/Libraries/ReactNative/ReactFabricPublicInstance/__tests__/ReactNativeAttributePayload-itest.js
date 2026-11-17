/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {AttributeConfiguration} from '../../../Renderer/shims/ReactNativeTypes';

import ReactNativeStyleAttributes from '../../../Components/View/ReactNativeStyleAttributes';
import processColor from '../../../StyleSheet/processColor';

const {create, diff} = require('../ReactNativeAttributePayload');

describe('ReactNativeAttributePayload.create', () => {
  it('should work with simple example', () => {
    expect(create({b: 2, c: 3}, {a: true, b: true})).toEqual({
      b: 2,
    });
  });

  it('should work with complex example', () => {
    const validAttributes: AttributeConfiguration = {
      style: {
        position: true,
        zIndex: true,
        flexGrow: true,
        flexShrink: true,
        flexDirection: true,
        overflow: true,
        backgroundColor: true,
      },
    };

    expect(
      create(
        {
          style: [
            {
              flexGrow: 1,
              flexShrink: 1,
              flexDirection: 'row',
              overflow: 'scroll',
            },
            [
              {position: 'relative', zIndex: 2},
              {flexGrow: 0},
              {backgroundColor: 'red'},
            ],
          ],
        },
        validAttributes,
      ),
    ).toEqual({
      flexGrow: 0,
      flexShrink: 1,
      flexDirection: 'row',
      overflow: 'scroll',
      position: 'relative',
      zIndex: 2,
      backgroundColor: 'red',
    });
  });

  it('should nullify previously defined style prop that is subsequently set to null or undefined', () => {
    expect(
      create({style: [{a: 0}, {a: undefined}]}, {style: {a: true}}),
    ).toEqual({a: null});
    expect(create({style: [{a: 0}, {a: null}]}, {style: {a: true}})).toEqual({
      a: null,
    });
  });

  it('should ignore non-style fields that are set to undefined', () => {
    expect(create({}, {a: true})).toEqual(null);
    expect(create({a: undefined}, {a: true})).toEqual(null);
    expect(create({a: undefined, b: undefined}, {a: true, b: true})).toEqual(
      null,
    );
    expect(
      create({a: undefined, b: undefined, c: 1}, {a: true, b: true}),
    ).toEqual(null);
    expect(
      create({a: undefined, b: undefined, c: 1}, {a: true, b: true, c: true}),
    ).toEqual({c: 1});
    expect(
      create({a: 1, b: undefined, c: 2}, {a: true, b: true, c: true}),
    ).toEqual({a: 1, c: 2});
  });

  it('should ignore invalid fields', () => {
    expect(create({b: 2}, {})).toEqual(null);
  });

  it('should not use the diff attribute', () => {
    const diffA = jest.fn();
    expect(create({a: [2]}, {a: {diff: diffA}})).toEqual({a: [2]});
    expect(diffA).not.toBeCalled();
  });

  it('should use the process attribute', () => {
    const processA = jest.fn(a => a + 1);
    expect(create({a: 2}, {a: {process: processA}})).toEqual({a: 3});
    expect(processA).toBeCalledWith(2);
  });

  it('should use the process attribute for functions as well', () => {
    const process = (x: Object) => x;
    const nextFunction = () => {};
    expect(create({a: nextFunction}, {a: {process}})).toEqual({
      a: nextFunction,
    });
  });

  it('should work with undefined styles', () => {
    expect(create({style: undefined}, {style: {b: true}})).toEqual(null);
    expect(create({style: {a: '#ffffff', b: 1}}, {style: {b: true}})).toEqual({
      b: 1,
    });
  });

  it('should flatten nested styles and predefined styles', () => {
    const validStyleAttribute: AttributeConfiguration = {
      style: {foo: true, bar: true},
    };
    expect(create({style: [{foo: 1}, {bar: 2}]}, validStyleAttribute)).toEqual({
      foo: 1,
      bar: 2,
    });
    expect(create({}, validStyleAttribute)).toEqual(null);
    const barStyle = {
      bar: 3,
    };
    expect(
      create({style: [[{foo: 1}, {foo: 2}], barStyle]}, validStyleAttribute),
    ).toEqual({foo: 2, bar: 3});
  });

  it('should not flatten nested props if attribute config is a primitive or only has diff/process', () => {
    expect(create({a: {foo: 1, bar: 2}}, {a: true})).toEqual({
      a: {foo: 1, bar: 2},
    });
    expect(create({a: [{foo: 1}, {bar: 2}]}, {a: true})).toEqual({
      a: [{foo: 1}, {bar: 2}],
    });
    expect(create({a: {foo: 1, bar: 2}}, {a: {diff: a => a}})).toEqual({
      a: {foo: 1, bar: 2},
    });
    expect(
      create({a: [{foo: 1}, {bar: 2}]}, {a: {diff: a => a, process: a => a}}),
    ).toEqual({a: [{foo: 1}, {bar: 2}]});
  });

  it('handles attributes defined multiple times', () => {
    const validAttributes: AttributeConfiguration = {
      foo: true,
      style: {foo: true},
    };
    expect(create({foo: 4, style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(create({style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(create({style: {foo: 2}, foo: 4}, validAttributes)).toEqual({
      foo: 4,
    });
    expect(create({foo: 4, style: {foo: null}}, validAttributes)).toEqual({
      foo: null, // this should ideally be null.
    });
    expect(
      create({foo: 4, style: [{foo: null}, {foo: 5}]}, validAttributes),
    ).toEqual({
      foo: 5,
    });
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    expect(
      create(
        {
          a: function () {
            return 9;
          },
          b: function () {
            return 3;
          },
        },
        {a: true, b: true},
      ),
    ).toEqual({a: true, b: true});
  });
});

describe('ReactNativeAttributePayload.diff', () => {
  it('should work with simple example', () => {
    expect(diff({a: 1, c: 3}, {b: 2, c: 3}, {a: true, b: true})).toEqual({
      a: null,
      b: 2,
    });
  });

  it('should skip fields that are equal', () => {
    expect(
      diff(
        {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
        {a: 1, b: 'two', c: true, d: false, e: undefined, f: 0},
        {a: true, b: true, c: true, d: true, e: true, f: true},
      ),
    ).toEqual(null);
  });

  it('should remove fields', () => {
    expect(diff({a: 1}, {}, {a: true})).toEqual({a: null});
  });

  it('should remove fields that are set to undefined', () => {
    expect(diff({a: 1}, {a: undefined}, {a: true})).toEqual({a: null});
  });

  it('should ignore invalid fields', () => {
    expect(diff({a: 1}, {b: 2}, {})).toEqual(null);
  });

  it('should use the diff attribute', () => {
    const diffA = jest.fn((a, b) => true);
    const diffB = jest.fn((a, b) => false);
    expect(
      diff(
        {a: [1], b: [3]},
        {a: [2], b: [4]},
        {a: {diff: diffA}, b: {diff: diffB}},
      ),
    ).toEqual({a: [2]});
    expect(diffA).toBeCalledWith([1], [2]);
    expect(diffB).toBeCalledWith([3], [4]);
  });

  it('should not use the diff attribute on addition/removal', () => {
    const diffA = jest.fn();
    const diffB = jest.fn();
    expect(
      diff({a: [1]}, {b: [2]}, {a: {diff: diffA}, b: {diff: diffB}}),
    ).toEqual({a: null, b: [2]});
    expect(diffA).not.toBeCalled();
    expect(diffB).not.toBeCalled();
  });

  it('should do deep diffs of Objects by default', () => {
    expect(
      diff(
        {a: [1], b: {k: [3, 4]}, c: {k: [4, 4]}},
        {a: [2], b: {k: [3, 4]}, c: {k: [4, 5]}},
        {a: true, b: true, c: true},
      ),
    ).toEqual({a: [2], c: {k: [4, 5]}});
  });

  it('should work with undefined styles', () => {
    expect(
      diff(
        {style: {a: '#ffffff', b: 1}},
        {style: undefined},
        {style: {b: true}},
      ),
    ).toEqual({b: null});
    expect(
      diff(
        {style: undefined},
        {style: {a: '#ffffff', b: 1}},
        {style: {b: true}},
      ),
    ).toEqual({b: 1});
    expect(
      diff({style: undefined}, {style: undefined}, {style: {b: true}}),
    ).toEqual(null);
  });

  it('should work with empty styles', () => {
    const validAttributes: AttributeConfiguration = {a: true, b: true};
    expect(diff({a: 1, c: 3}, {}, validAttributes)).toEqual({a: null});
    expect(diff({}, {a: 1, c: 3}, validAttributes)).toEqual({a: 1});
    expect(diff({}, {}, validAttributes)).toEqual(null);
  });

  it('should flatten nested styles and predefined styles', () => {
    const validStyleAttribute: AttributeConfiguration = {
      style: {foo: true, bar: true},
    };

    expect(
      diff({}, {style: [{foo: 1}, {bar: 2}]}, validStyleAttribute),
    ).toEqual({foo: 1, bar: 2});

    expect(
      diff({style: [{foo: 1}, {bar: 2}]}, {}, validStyleAttribute),
    ).toEqual({foo: null, bar: null});

    const barStyle = {
      bar: 3,
    };

    expect(
      diff({}, {style: [[{foo: 1}, {foo: 2}], barStyle]}, validStyleAttribute),
    ).toEqual({foo: 2, bar: 3});
  });

  it('should reset a value to a previous if it is removed', () => {
    const validStyleAttribute: AttributeConfiguration = {
      style: {foo: true, bar: true},
    };

    expect(
      diff(
        {style: [{foo: 1}, {foo: 3}]},
        {style: [{foo: 1}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 1, bar: 2});
  });

  it('should not clear removed props if they are still in another slot', () => {
    const validStyleAttribute: AttributeConfiguration = {
      style: {foo: true, bar: true},
    };

    expect(
      diff(
        {style: [{}, {foo: 3, bar: 2}]},
        {style: [{foo: 3}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 3}); // this should ideally be null. heuristic tradeoff.

    expect(
      diff(
        {style: [{}, {foo: 3, bar: 2}]},
        {style: [{foo: 1, bar: 1}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({bar: 2, foo: 1});
  });

  it('should clear a prop if a later style is explicit null/undefined', () => {
    const validStyleAttribute: AttributeConfiguration = {
      style: {foo: true, bar: true},
    };
    expect(
      diff(
        {style: [{}, {foo: 3, bar: 2}]},
        {style: [{foo: 1}, {bar: 2, foo: null}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null});

    expect(
      diff(
        {style: [{foo: 3}, {foo: null, bar: 2}]},
        {style: [{foo: null}, {bar: 2}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null});

    expect(
      diff(
        {style: [{foo: 1}, {foo: null}]},
        {style: [{foo: 2}, {foo: null}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null}); // this should ideally be null. heuristic.

    // Test the same case with object equality because an early bailout doesn't
    // work in this case.
    const fooObj = {foo: 3};
    expect(
      diff(
        {style: [{foo: 1}, fooObj]},
        {style: [{foo: 2}, fooObj]},
        validStyleAttribute,
      ),
    ).toEqual({foo: 3}); // this should ideally be null. heuristic.

    expect(
      diff(
        {style: [{foo: 1}, {foo: 3}]},
        {style: [{foo: 2}, {foo: undefined}]},
        validStyleAttribute,
      ),
    ).toEqual({foo: null}); // this should ideally be null. heuristic.
  });

  it('handles attributes defined multiple times', () => {
    const validAttributes: AttributeConfiguration = {
      foo: true,
      style: {foo: true},
    };
    expect(diff({}, {foo: 4, style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(diff({foo: 4}, {style: {foo: 2}}, validAttributes)).toEqual({
      foo: 2,
    });
    expect(diff({style: {foo: 2}}, {foo: 4}, validAttributes)).toEqual({
      foo: 4,
    });
  });

  // Function properties are just markers to native that events should be sent.
  it('should convert functions to booleans', () => {
    // Note that if the property changes from one function to another, we don't
    // need to send an update.
    expect(
      diff(
        {
          a: function () {
            return 1;
          },
          b: function () {
            return 2;
          },
          c: 3,
        },
        {
          b: function () {
            return 9;
          },
          c: function () {
            return 3;
          },
        },
        {a: true, b: true, c: true},
      ),
    ).toEqual({a: null, c: true});
  });

  it('should skip changed functions', () => {
    expect(
      diff(
        {
          a: function () {
            return 1;
          },
        },
        {
          a: function () {
            return 9;
          },
        },
        {a: true},
      ),
    ).toEqual(null);
  });

  it('should skip deeply-nested changed functions', () => {
    expect(
      diff(
        {
          wrapper: {
            a: function () {
              return 1;
            },
          },
        },
        {
          wrapper: {
            a: function () {
              return 9;
            },
          },
        },
        {wrapper: true},
      ),
    ).toEqual(null);
  });

  it('should use the process function config when prop is a function', () => {
    const process = jest.fn(a => a);
    const nextFunction = function () {};
    expect(
      diff(
        {
          a: function () {},
        },
        {
          a: nextFunction,
        },
        {a: {process}},
      ),
    ).toEqual({a: nextFunction});
    expect(process).toBeCalled();
  });
});

describe('ReactNativeAttributePayload with conditional style values', () => {
  const DARK = '@media (prefers-color-scheme: dark)';
  const validAttributes: AttributeConfiguration = {
    style: ReactNativeStyleAttributes,
  };
  const white = processColor('white');
  const black = processColor('black');
  const red = processColor('red');
  const conditional = {default: 'white', [DARK]: 'black'};
  // A conditional value, as native gets it.
  const sent = (defaultValue: unknown, value: unknown) => ({
    $conditionalValue: {
      default: defaultValue,
      conditions: [{query: {colorScheme: 'dark'}, value}],
    },
  });
  const whiteOrBlack = sent(white, black);
  const flag = {$hasConditionalValues: true};

  it('create: sends the default and the processed conditions', () => {
    expect(
      create(
        {style: {width: 100, backgroundColor: conditional}},
        validAttributes,
      ),
    ).toEqual({width: 100, backgroundColor: whiteOrBlack, ...flag});
  });

  it('create: a later plain value replaces the conditions', () => {
    // A later plain value wins. The flag stays, and native handles that.
    expect(
      create(
        {style: [{backgroundColor: conditional}, {backgroundColor: 'red'}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: red, ...flag});
  });

  it('create: leaves the value as it is if the style does not allow conditions', () => {
    const value = {default: 1, [DARK]: 0.5};
    expect(create({style: {opacity: value}}, {style: {opacity: true}})).toEqual(
      {opacity: value},
    );
  });

  it('diff: sends nothing when the value is the same', () => {
    expect(
      diff(
        {style: [{backgroundColor: {default: 'white', [DARK]: 'black'}}]},
        {style: [{backgroundColor: {default: 'white', [DARK]: 'black'}}]},
        validAttributes,
      ),
    ).toEqual(null);
  });

  it('diff: sends the default and the conditions when a condition changes', () => {
    expect(
      diff(
        {style: {width: 100, backgroundColor: conditional}},
        {
          style: {
            width: 100,
            backgroundColor: {default: 'white', [DARK]: 'red'},
          },
        },
        validAttributes,
      ),
    ).toEqual({backgroundColor: sent(white, red), ...flag});
  });

  it('diff: sends the plain value when the value stops being conditional', () => {
    expect(
      diff(
        {style: {backgroundColor: conditional}},
        {style: {backgroundColor: 'white'}},
        validAttributes,
      ),
    ).toEqual({backgroundColor: white});
  });

  it('diff: sends the default and the conditions when a value becomes conditional', () => {
    expect(
      diff(
        {style: [{width: 100}, {backgroundColor: 'white'}]},
        {style: [{width: 100}, {backgroundColor: conditional}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: whiteOrBlack, ...flag});
  });

  it('diff: clears the value when the style is removed', () => {
    expect(
      diff({style: {backgroundColor: conditional}}, {}, validAttributes),
    ).toEqual({backgroundColor: null});
  });

  it('diff: a plain value added later in the array replaces the conditions', () => {
    const base = {backgroundColor: conditional};
    expect(
      diff(
        {style: [base]},
        {style: [base, {backgroundColor: 'red'}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: red});
  });

  it('diff: removing a later plain value restores the earlier conditions', () => {
    const base = {backgroundColor: conditional};
    expect(
      diff(
        {style: [base, {backgroundColor: 'red'}]},
        {style: [base]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: whiteOrBlack, ...flag});
  });

  it('diff: an earlier change does not hide a later conditional value', () => {
    const base = {backgroundColor: conditional};
    expect(
      diff(
        {style: [{backgroundColor: 'red'}, base]},
        {style: [{backgroundColor: 'blue'}, base]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: whiteOrBlack, ...flag});
  });

  it('diff: compares conditional values deeply for attributes with a custom diff', () => {
    expect(
      diff(
        {
          style: {
            shadowOffset: {
              default: {width: 1, height: 1},
              [DARK]: {width: 2, height: 2},
            },
          },
        },
        {
          style: {
            shadowOffset: {
              default: {width: 1, height: 1},
              [DARK]: {width: 3, height: 3},
            },
          },
        },
        validAttributes,
      ),
    ).toEqual({
      shadowOffset: sent({width: 1, height: 1}, {width: 3, height: 3}),
      ...flag,
    });
  });

  it('never sends undefined for a conditional value', () => {
    const plain = {backgroundColor: 'red'};
    // A later plain value wins. The flag stays, and native handles that.
    expect(
      diff(
        {style: [{backgroundColor: 'blue'}, plain]},
        {
          style: [
            {backgroundColor: {default: 'notacolor', [DARK]: 'white'}},
            plain,
          ],
        },
        validAttributes,
      ),
    ).toEqual({backgroundColor: red, ...flag});
  });

  it('diff: a changed later plain value replaces earlier conditions', () => {
    // A later plain value wins. The flag stays, and native handles that.
    expect(
      diff(
        {style: [{backgroundColor: 'blue'}, {backgroundColor: 'red'}]},
        {style: [{backgroundColor: conditional}, {backgroundColor: 'green'}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: processColor('green'), ...flag});
  });

  it('create: a user style key cannot set the native keys', () => {
    expect(
      create(
        {
          style: {
            backgroundColor: 'red',
            $hasConditionalValues: true,
            $conditionalValue: {default: 1},
          },
        },
        validAttributes,
      ),
    ).toEqual({backgroundColor: red});
  });

  it('create: leaves a non-style prop with a default key as it is', () => {
    const value = {default: 1};
    expect(
      create(
        {config: value, style: {opacity: 1}},
        {config: true, style: ReactNativeStyleAttributes},
      ),
    ).toEqual({config: value, opacity: 1});
  });

  it('create: sends null for an invalid default', () => {
    expect(
      create(
        {style: {backgroundColor: {default: 'notacolor', [DARK]: 'black'}}},
        validAttributes,
      ),
    ).toEqual({backgroundColor: sent(null, black), ...flag});
  });

  it('create: sends null for a value without a default', () => {
    const errors: Array<unknown> = [];
    const originalError = console.error;
    // $FlowExpectedError[cannot-write]
    console.error = (message: unknown) => {
      errors.push(message);
    };
    try {
      expect(
        create(
          {style: {width: 100, backgroundColor: {[DARK]: 'black'}}},
          validAttributes,
        ),
      ).toEqual({width: 100, backgroundColor: null});
    } finally {
      // $FlowExpectedError[cannot-write]
      console.error = originalError;
    }
    expect(errors.length).toBe(1);
  });

  it('create: sends a default without conditions as a plain value', () => {
    expect(
      create({style: {backgroundColor: {default: 'white'}}}, validAttributes),
    ).toEqual({backgroundColor: white});
  });

  it('create: keeps null values as null', () => {
    expect(
      create(
        {style: {backgroundColor: {default: null, [DARK]: null}}},
        validAttributes,
      ),
    ).toEqual({backgroundColor: sent(null, null), ...flag});
  });

  it('create: sends raw values for a prop without a processor, and each key', () => {
    expect(
      create(
        {
          style: {
            opacity: {default: 1, [DARK]: 0.5},
            backgroundColor: conditional,
          },
        },
        validAttributes,
      ),
    ).toEqual({
      opacity: sent(1, 0.5),
      backgroundColor: whiteOrBlack,
      ...flag,
    });
  });

  it('create: finds conditional values in nested arrays', () => {
    expect(
      create(
        {style: [{width: 1}, [null, [{backgroundColor: conditional}]]]},
        validAttributes,
      ),
    ).toEqual({width: 1, backgroundColor: whiteOrBlack, ...flag});
  });

  it('create: a later explicit undefined clears the value and its conditions', () => {
    // A later plain value wins. The flag stays, and native handles that.
    expect(
      create(
        {style: [{backgroundColor: conditional}, {backgroundColor: undefined}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: null, ...flag});
  });

  it('diff: handles a style that changes between an array and an object', () => {
    expect(
      diff(
        {style: [{backgroundColor: conditional}]},
        {style: {backgroundColor: {default: 'white', [DARK]: 'black'}}},
        validAttributes,
      ),
    ).toEqual(null);
    expect(
      diff(
        {style: {backgroundColor: conditional}},
        {style: [{backgroundColor: conditional}, {backgroundColor: 'red'}]},
        validAttributes,
      ),
    ).toEqual({backgroundColor: red});
    expect(
      diff(
        {style: [{width: 1}, {backgroundColor: 'red'}]},
        {style: {width: 1, backgroundColor: conditional}},
        validAttributes,
      ),
    ).toEqual({backgroundColor: whiteOrBlack, ...flag});
  });

  it('does not carry the flag over to the next payload', () => {
    create({style: {backgroundColor: conditional}}, validAttributes);
    expect(create({style: {backgroundColor: 'red'}}, validAttributes)).toEqual({
      backgroundColor: red,
    });
    diff(
      {style: {backgroundColor: 'red'}},
      {style: {backgroundColor: conditional}},
      validAttributes,
    );
    expect(
      diff(
        {style: {backgroundColor: 'red'}},
        {style: {backgroundColor: 'blue'}},
        validAttributes,
      ),
    ).toEqual({backgroundColor: processColor('blue')});
  });
});
