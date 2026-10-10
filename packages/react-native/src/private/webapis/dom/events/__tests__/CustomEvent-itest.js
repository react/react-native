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

describe('CustomEvent', () => {
  it('extends Event', () => {
    const event = new CustomEvent('foo', {
      bubbles: true,
      cancelable: true,
      composed: true,
      detail: null,
    });

    expect(event.type).toBe('foo');
    expect(event.bubbles).toBe(true);
    expect(event.cancelable).toBe(true);
    expect(event.composed).toBe(true);
    expect(event).toBeInstanceOf(Event);
  });

  it('allows passing a detail value', () => {
    const detail = Symbol('detail');

    const event = new CustomEvent('foo', {detail});

    expect(event.detail).toBe(detail);
  });

  it('does NOT allow changing the detail value after construction', () => {
    const detail = Symbol('detail');

    const event = new CustomEvent('foo', {detail});

    expect(() => {
      'use strict';
      // Use strict mode to throw an error instead of silently failing
      // $FlowExpectedError[cannot-write]
      event.detail = 'bar';
    }).toThrow();
  });
});
