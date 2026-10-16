/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableIntersectionObserverByDefault:true
 * @fantom_flags enableMutationObserverByDefault:true
 * @fantom_flags enableResizeObserverByDefault:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import DOMException from '../../errors/DOMException';
import IntersectionObserver from '../../intersectionobserver/IntersectionObserver';
import IntersectionObserverEntry from '../../intersectionobserver/IntersectionObserverEntry';
import MutationObserver from '../../mutationobserver/MutationObserver';
import structuredClone from '../structuredClone';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

function expectDataCloneError(fn: () => unknown) {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(DOMException);
    expect(error.name).toBe('DataCloneError');
    expect(error.code).toBe(DOMException.DATA_CLONE_ERR);
    return;
  }

  throw new Error('Expected function to throw DataCloneError, but it did not');
}

function createResizeObserverEntryForTest(): ResizeObserverEntry {
  const ref = createRef<HostInstance>();
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(<View style={{height: 10, width: 10}} ref={ref} />);
  });

  const target = ensureInstance(ref.current, HTMLElement);
  const entries: Array<unknown> = [];
  Fantom.runTask(() => {
    const observer = new ResizeObserver((newEntries, self) => {
      entries.push(...newEntries);
      self.disconnect();
    });
    observer.observe(target);
  });

  return ensureInstance(entries[0], ResizeObserverEntry);
}

describe('structuredClone', () => {
  it('clones primitive types', () => {
    expect(structuredClone(undefined)).toBe(undefined);
    expect(structuredClone(null)).toBe(null);

    expect(structuredClone(0)).toBe(0);
    expect(structuredClone(1)).toBe(1);
    expect(Object.is(structuredClone(-0), -0)).toBe(true);

    expect(structuredClone(0n)).toBe(0n);
    expect(structuredClone(1n)).toBe(1n);

    expect(structuredClone(false)).toBe(false);
    expect(structuredClone(true)).toBe(true);

    expect(structuredClone('')).toBe('');
    expect(structuredClone('foo')).toBe('foo');
  });

  it('clones primitive value wrappers', () => {
    // eslint-disable-next-line no-new-wrappers
    const numberValue = new Number(1);
    const numberClone = structuredClone(numberValue);
    expect(numberClone).not.toBe(numberValue);
    expect(numberClone).toBeInstanceOf(Number);
    expect(numberClone.valueOf()).toBe(1);

    // eslint-disable-next-line no-new-wrappers
    const stringValue = new String('foo');
    const stringClone = structuredClone(stringValue);
    expect(stringClone).not.toBe(stringValue);
    expect(stringClone).toBeInstanceOf(String);
    expect(stringClone.valueOf()).toBe('foo');

    // eslint-disable-next-line no-new-wrappers
    const booleanValue = new Boolean(true);
    const booleanClone = structuredClone(booleanValue);
    expect(booleanClone).not.toBe(booleanValue);
    expect(booleanClone).toBeInstanceOf(Boolean);
    expect(booleanClone.valueOf()).toBe(true);

    const bigintValue = Object(1n);
    const bigintClone = structuredClone(bigintValue);
    expect(bigintClone).not.toBe(bigintValue);
    expect(bigintClone).toBeInstanceOf(BigInt);
    expect(bigintClone.valueOf()).toBe(1n);
  });

  it('throws with symbols, functions, WeakMap, WeakSet, Promise', () => {
    expectDataCloneError(() => structuredClone(Symbol()));
    expectDataCloneError(() => structuredClone(Object(Symbol())));
    expectDataCloneError(() => structuredClone(() => {}));
    expectDataCloneError(() => structuredClone(new WeakMap()));
    expectDataCloneError(() => structuredClone(new WeakSet()));
    expectDataCloneError(() => structuredClone(Promise.resolve(4)));
  });

  it('clones simple objects', () => {
    const value = {foo: 'bar'};
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Object);
    expect(clone).toEqual(value);
  });

  it('does NOT clone non-enumerable properties', () => {
    const value = {foo: 'bar'};
    // $FlowExpectedError[prop-missing]
    Object.defineProperty(value, 'other', {enumerable: false, value: 'value'});

    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Object);
    expect('other' in clone).toBe(false);
  });

  it('does NOT clone inherited properties', () => {
    const base = {foo: 'bar'};
    const value = Object.create(base);

    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Object);
    expect('foo' in clone).toBe(false);
  });

  it('clones arrays', () => {
    const value = ['foo', 'bar'];
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Array);
    expect(clone).toEqual(value);
  });

  it('clones arbitrary keys in arrays', () => {
    const value = ['foo', 'bar'];
    // Also arbitrary keys
    // $FlowExpectedError[prop-missing]
    value.key = 'baz';
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Array);
    expect(clone).toEqual(value);
  });

  it('clones maps', () => {
    const value = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Map);
    expect(clone).toEqual(value);
  });

  it('does NOT clone arbitrary keys in maps', () => {
    const value = new Map([
      ['key1', 'value1'],
      ['key2', 'value2'],
      ['key3', 'value3'],
    ]);
    // $FlowExpectedError[prop-missing]
    value.key = 1;
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Map);
    expect(clone.entries()).toEqual(value.entries());
    // $FlowExpectedError[prop-missing]
    expect(clone.key).toBeUndefined();
  });

  it('clones sets', () => {
    const value = new Set(['key1', 'key2', 'key3']);
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Set);
    expect(clone).toEqual(value);
  });

  it('does NOT clone arbitrary keys in sets', () => {
    const value = new Set(['key1', 'key2', 'key3']);
    // $FlowExpectedError[prop-missing]
    value.key = 1;
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Set);
    expect(clone.entries()).toEqual(value.entries());
    // $FlowExpectedError[prop-missing]
    expect(clone.key).toBeUndefined();
  });

  it('clones regular expressions', () => {
    const value = new RegExp('foo', 'g');
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(RegExp);
    expect(clone).toEqual(value);
  });

  it('clones dates', () => {
    const value = new Date('1993-06-11T14:30:45.123Z');
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Date);
    expect(clone).toEqual(value);
  });

  it('clones invalid dates', () => {
    const value = new Date(NaN);
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Date);
    expect(Number.isNaN(clone.getTime())).toBe(true);
  });

  it('clones ArrayBuffer', () => {
    const value = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(ArrayBuffer);
    expect([...new Uint8Array(clone)]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('clones DataView', () => {
    const buffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
    const value = new DataView(buffer);
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(DataView);
    expect([...new Uint8Array(clone.buffer)]).toEqual([0, 1, 2, 3, 4, 5, 6, 7]);
  });

  it('clones typed arrays', () => {
    const value = new Uint32Array([1, 2, 3]);
    const clone = structuredClone(value);
    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Uint32Array);
    expect([...clone]).toEqual([1, 2, 3]);
  });

  it('preserves shared buffers between views', () => {
    const buffer = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]).buffer;
    const value = {
      typedArray: new Uint16Array(buffer, 2, 2),
      dataView: new DataView(buffer, 1, 6),
      buffer,
    };

    const clone = structuredClone(value);
    expect(clone.buffer).not.toBe(buffer);
    expect(clone.dataView.buffer).toBe(clone.buffer);
    expect(clone.typedArray.buffer).toBe(clone.buffer);
    expect(clone.dataView.byteOffset).toBe(value.dataView.byteOffset);
    expect(clone.dataView.byteLength).toBe(value.dataView.byteLength);
    expect(clone.typedArray.byteOffset).toBe(value.typedArray.byteOffset);
    expect(clone.typedArray.length).toBe(value.typedArray.length);
    expect([...clone.typedArray]).toEqual([...value.typedArray]);
  });

  it('clones errors', () => {
    const cause = new Error('cause message');
    const value = new Error('error message', {cause});

    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(Error);
    expect(clone.message).toBe(value.message);
    expect(clone.stack).toBe(value.stack);

    // $FlowExpectedError[incompatible-type]
    const causeClone: Error = clone.cause;
    expect(causeClone).toBeInstanceOf(Error);
    expect(causeClone.message).toBe(cause.message);
    expect(causeClone.stack).toBe(cause.stack);

    // Valid error names
    value.name = 'Error';
    expect(structuredClone(value).name).toBe('Error');
    value.name = 'EvalError';
    expect(structuredClone(value).name).toBe('EvalError');
    value.name = 'RangeError';
    expect(structuredClone(value).name).toBe('RangeError');
    value.name = 'ReferenceError';
    expect(structuredClone(value).name).toBe('ReferenceError');
    value.name = 'SyntaxError';
    expect(structuredClone(value).name).toBe('SyntaxError');
    value.name = 'TypeError';
    expect(structuredClone(value).name).toBe('TypeError');
    value.name = 'URIError';
    expect(structuredClone(value).name).toBe('URIError');

    // Invalid error names
    value.name = 'FooError';
    expect(structuredClone(value).name).toBe('Error');
  });

  it('preserves error subclasses', () => {
    expect(structuredClone(new Error('boom'))).toBeInstanceOf(Error);
    expect(structuredClone(new EvalError('boom'))).toBeInstanceOf(EvalError);
    expect(structuredClone(new RangeError('boom'))).toBeInstanceOf(RangeError);
    expect(structuredClone(new ReferenceError('boom'))).toBeInstanceOf(
      ReferenceError,
    );
    expect(structuredClone(new SyntaxError('boom'))).toBeInstanceOf(
      SyntaxError,
    );
    expect(structuredClone(new TypeError('boom'))).toBeInstanceOf(TypeError);
    expect(structuredClone(new URIError('boom'))).toBeInstanceOf(URIError);
  });

  it('clones aggregate errors', () => {
    const innerError = new TypeError('inner');
    const value = new AggregateError([innerError, {foo: 'bar'}], 'outer');
    const clone = structuredClone(value);
    const clonedErrors = Array.from(clone.errors);
    const clonedInnerError = ensureInstance(clonedErrors[0], TypeError);

    expect(clone).not.toBe(value);
    expect(clone).toBeInstanceOf(AggregateError);
    expect(clone.message).toBe(value.message);
    expect(clone.stack).toBe(value.stack);
    expect(clone.errors).not.toBe(value.errors);
    expect(clonedInnerError).not.toBe(innerError);
    expect(clonedInnerError.message).toBe(innerError.message);
    expect(clonedErrors[1]).toEqual({foo: 'bar'});
  });

  it('clones __proto__ as an own property', () => {
    const value = JSON.parse('{"__proto__":{"foo":"bar"}}');
    const clone = structuredClone(value);
    const clonedValue = nullthrows(
      Object.getOwnPropertyDescriptor(clone, '__proto__'),
    ).value;
    const originalValue = nullthrows(
      Object.getOwnPropertyDescriptor(value, '__proto__'),
    ).value;

    expect(clone.foo).toBeUndefined();
    expect(Object.hasOwn(clone, '__proto__')).toBe(true);
    expect(clonedValue).not.toBe(originalValue);
    expect(clonedValue).toEqual({foo: 'bar'});
  });

  it('clones values deeply', () => {
    const value = {
      obj: {
        arr: ['baz', 'foobar'],
      },
      map: new Map([[new Set(['foo', 'bar']), {key: 'value'}]]),
    };
    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone.obj).not.toBe(value.obj);
    expect(clone.obj.arr).not.toBe(value.obj.arr);
    expect(clone.map).not.toBe(value.map);
    expect([...clone.map.keys()][0]).not.toBe([...value.map.keys()][0]);
    expect(clone).toEqual(value);
  });

  it('handles repeated references', () => {
    const repeatedValue = {foo: 'bar'};
    // eslint-disable-next-line no-new-wrappers
    const repeatedNumber = new Number(3);
    const value = {
      first: repeatedValue,
      second: repeatedValue,
      third: repeatedNumber,
      fourth: repeatedNumber,
    };
    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone.first).not.toBe(value.first);
    expect(clone.second).not.toBe(value.second);
    expect(clone.third).not.toBe(value.third);
    expect(clone.fourth).not.toBe(value.fourth);
    expect(clone.first).toBe(clone.second);
    expect(clone.third).toBe(clone.fourth);
    expect(clone).toEqual(value);
  });

  it('handles circular references', () => {
    const obj: {arr: Array<unknown>} = {arr: []};
    obj.arr.push(obj);
    const map = new Map<string, interface {}>();
    map.set('key', map);
    const set = new Set([map]);
    map.set('set', set);

    const value = {
      obj,
      map,
    };

    const clone = structuredClone(value);

    expect(clone).not.toBe(value);
    expect(clone.obj.arr[0]).toBe(clone.obj);
    expect(clone.map.get('key')).toBe(clone.map);
    // $FlowExpectedError[incompatible-type]
    // $FlowExpectedError[prop-missing]
    expect([...clone.map.get('set')][0]).toBe(clone.map);
  });

  describe('platform objects', () => {
    describe('serializable platform objects', () => {
      it('clones DOMRectReadOnly', () => {
        let value = new DOMRectReadOnly(1, 2, 3, 4);
        let clone = structuredClone(value);
        expect(clone).not.toBe(value);
        expect(clone).toBeInstanceOf(DOMRectReadOnly);
        expect(clone).toEqual(value);
      });

      it('clones DOMRect', () => {
        let value = new DOMRect(1, 2, 3, 4);
        let clone = structuredClone(value);
        expect(clone).not.toBe(value);
        expect(clone).toBeInstanceOf(DOMRect);
        expect(clone).toEqual(value);
      });

      it('clones DOMException', () => {
        const value = new DOMException('error message', 'Error');
        const clone = structuredClone(value);
        expect(clone).not.toBe(value);
        expect(clone).toBeInstanceOf(DOMException);
        expect(clone.name).toEqual(value.name);
        expect(clone.message).toEqual(value.message);
      });
    });

    describe('non-serializable platform objects', () => {
      it('does NOT clone ReadOnlyNode', () => {
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<View ref={ref} />);
        });
        expect(ref.current).not.toBe(null);
        expectDataCloneError(() => structuredClone(ref.current));
      });

      it('does NOT clone EventTarget', () => {
        expectDataCloneError(() => structuredClone(new EventTarget()));
      });

      it('does NOT clone XMLHttpRequest', () => {
        const xhr = new XMLHttpRequest();
        expectDataCloneError(() => structuredClone(xhr));
      });

      it('does NOT clone performance', () => {
        expectDataCloneError(() => structuredClone(performance));
      });

      it('does NOT clone performance.memory', () => {
        // $FlowExpectedError[prop-missing]
        expectDataCloneError(() => structuredClone(performance.memory));
      });

      it('does NOT clone performance.rnStartupTiming', () => {
        expectDataCloneError(() =>
          // $FlowExpectedError[prop-missing]
          structuredClone(performance.rnStartupTiming),
        );
      });

      it('does NOT clone PerformanceEntry', () => {
        // $FlowExpectedError[prop-missing]
        expectDataCloneError(() => structuredClone(performance.mark('foo')));
      });

      it('does NOT clone IntersectionObserver', () => {
        expectDataCloneError(() =>
          structuredClone(new IntersectionObserver(() => {})),
        );
      });

      it('does NOT clone IntersectionObserverEntry', () => {
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<View ref={ref} />);
        });
        expect(ref.current).not.toBe(null);

        const entries: Array<unknown> = [];
        Fantom.runTask(() => {
          const observer = new IntersectionObserver((e, self) => {
            entries.push(...e);
            self.disconnect();
          });

          observer.observe(nullthrows(ref.current));
        });

        const entry = ensureInstance(entries[0], IntersectionObserverEntry);

        expectDataCloneError(() => structuredClone(entry));
      });

      it('does NOT clone MutationObserver', () => {
        expectDataCloneError(() =>
          structuredClone(new MutationObserver(() => {})),
        );
      });

      it('does NOT clone MutationRecord', () => {
        const ref = createRef<HostInstance>();
        const root = Fantom.createRoot();
        Fantom.runTask(() => {
          root.render(<View ref={ref} />);
        });
        expect(ref.current).not.toBe(null);

        const records: Array<unknown> = [];
        Fantom.runTask(() => {
          const observer = new MutationObserver(e => {
            records.push(...e);
          });

          observer.observe(nullthrows(ref.current), {
            childList: true,
          });
        });

        Fantom.runTask(() => {
          root.render(
            <View>
              <View />
            </View>,
          );
        });

        expectDataCloneError(() => structuredClone(records[0]));
      });

      it('does NOT clone ResizeObserver', () => {
        expectDataCloneError(() =>
          structuredClone(new ResizeObserver(() => {})),
        );
      });

      it('does NOT clone ResizeObserverEntry', () => {
        expectDataCloneError(() =>
          structuredClone(createResizeObserverEntryForTest()),
        );
      });

      it('does NOT clone ResizeObserverSize', () => {
        const entry = createResizeObserverEntryForTest();
        const size = ensureInstance(
          entry.contentBoxSize[0],
          ResizeObserverSize,
        );

        expectDataCloneError(() => structuredClone(size));
      });
    });
  });
});
