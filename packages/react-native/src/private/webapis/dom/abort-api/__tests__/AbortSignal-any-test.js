/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import {AbortController} from '../AbortController';
import {AbortSignal} from '../AbortSignal';

describe('AbortSignal.any', () => {
  it('aborts the dependent signal even if a source listener stops propagation', () => {
    const source = new AbortController();
    source.signal.addEventListener('abort', event => {
      event.stopImmediatePropagation();
    });
    const signal = AbortSignal.any([source.signal]);

    source.abort('cancelled');

    expect(signal.aborted).toBe(true);
    expect(signal.reason).toBe('cancelled');
  });

  it('marks dependent signals as aborted before dispatching to the source', () => {
    const source = new AbortController();
    let observed;
    source.signal.addEventListener('abort', () => {
      observed = [signal.aborted, signal.reason];
    });
    const signal = AbortSignal.any([source.signal]);

    source.abort('reason');

    expect(observed).toEqual([true, 'reason']);
  });

  it('dispatches to the source and then to its dependents in creation order', () => {
    const first = new AbortController();
    const second = new AbortController();
    const inner = AbortSignal.any([first.signal, second.signal]);
    const outer = AbortSignal.any([inner, inner, first.signal]);
    const unrelated = AbortSignal.any([second.signal]);
    const events: Array<string> = [];
    first.signal.addEventListener('abort', () => {
      events.push('first');
    });
    inner.addEventListener('abort', () => {
      events.push('inner');
    });
    outer.addEventListener('abort', () => {
      events.push('outer');
    });
    unrelated.addEventListener('abort', () => {
      events.push('unrelated');
    });

    first.abort('first reason');
    second.abort('second reason');

    expect(events).toEqual(['first', 'inner', 'outer', 'unrelated']);
    expect(outer.reason).toBe('first reason');
    expect(unrelated.reason).toBe('second reason');
  });

  it('keeps the first reason when a source listener aborts another source', () => {
    const first = new AbortController();
    const second = new AbortController();
    first.signal.addEventListener('abort', () => second.abort('second'));
    const signal = AbortSignal.any([first.signal, second.signal]);
    const listener = jest.fn();
    signal.addEventListener('abort', listener);

    first.abort('first');

    expect(signal.reason).toBe('first');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});
