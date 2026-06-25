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

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';
import setUpIntersectionObserver from 'react-native/src/private/setup/setUpIntersectionObserver';
import setUpMutationObserver from 'react-native/src/private/setup/setUpMutationObserver';
import EventTarget from 'react-native/src/private/webapis/dom/events/EventTarget';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';
import DOMException from 'react-native/src/private/webapis/errors/DOMException';
import IntersectionObserver from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserver';
import IntersectionObserverEntry from 'react-native/src/private/webapis/intersectionobserver/IntersectionObserverEntry';
import MutationObserver from 'react-native/src/private/webapis/mutationobserver/MutationObserver';
import structuredClone from 'react-native/src/private/webapis/structuredClone/structuredClone';

setUpIntersectionObserver();
setUpMutationObserver();

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

describe('structuredClone', () => {
  it('clones primitive types', () => {
    expect(structuredClone(undefined)).toBe(undefined);
    expect(structuredClone(null)).toBe(null);

    expect(structuredClone(0)).toBe(0);
    expect(structuredClone(1)).toBe(1);

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
  });

  it('throws with symbols, functions, WeakMap, WeakSet, Promise', () => {
    expectDataCloneError(() => structuredClone(Symbol()));
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

          observer.observe(ensureInstance(ref.current, ReactNativeElement));
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

          observer.observe(ensureInstance(ref.current, ReactNativeElement), {
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
    });
  });
});
