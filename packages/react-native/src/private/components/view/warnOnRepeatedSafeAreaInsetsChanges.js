/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {SafeAreaInsetsChangeEvent} from '../../../../Libraries/Types/CoreEventTypes';

const DISPATCH_WINDOW_MS = 1000;
const MAX_DISPATCHES_PER_WINDOW = 10;

type DispatchRate = {
  count: number,
  windowStart: number,
  warned: boolean,
};

const dispatchRates: WeakMap<interface {}, DispatchRate> = new WeakMap();

/**
 * Wraps an `experimental_onSafeAreaInsetsChange` handler with a development
 * check for a view that reports insets over and over.
 *
 * The system UI does not move many times a second, so a sustained stream of
 * events means the layout is feeding the insets back into the position of the
 * observed view: it pads itself by the insets it reports, which moves it, which
 * changes its insets. Every one of those events renders synchronously, blocking
 * the UI thread, so the loop is paid for in frames.
 */
export default function warnOnRepeatedSafeAreaInsetsChanges(
  onSafeAreaInsetsChange: (event: SafeAreaInsetsChangeEvent) => unknown,
): (event: SafeAreaInsetsChangeEvent) => unknown {
  return event => {
    // The target identifies the view without keeping it alive; events dispatched
    // without one are simply not counted.
    const target = event.target;
    if (target != null && typeof target === 'object') {
      warnIfDispatchingTooOften(target);
    }
    return onSafeAreaInsetsChange(event);
  };
}

function warnIfDispatchingTooOften(target: interface {}): void {
  const now = performance.now();
  let dispatchRate: ?DispatchRate = dispatchRates.get(target);
  if (dispatchRate == null) {
    const newDispatchRate: DispatchRate = {
      count: 0,
      windowStart: now,
      warned: false,
    };
    dispatchRates.set(target, newDispatchRate);
    dispatchRate = newDispatchRate;
  }
  if (dispatchRate.warned) {
    return;
  }
  if (now - dispatchRate.windowStart > DISPATCH_WINDOW_MS) {
    dispatchRate.windowStart = now;
    dispatchRate.count = 0;
  }
  dispatchRate.count++;
  if (dispatchRate.count > MAX_DISPATCHES_PER_WINDOW) {
    dispatchRate.warned = true;
    console.warn(
      `\`experimental_onSafeAreaInsetsChange\` fired more than ${MAX_DISPATCHES_PER_WINDOW} ` +
        `times in ${DISPATCH_WINDOW_MS}ms on a single view. The safe area insets of a view ` +
        'only change when the system UI moves or the view does, so this is usually a loop: ' +
        'the view is laid out from the insets it reports, which moves it, which changes its ' +
        'insets. Each event renders synchronously, so the loop costs frames.',
    );
  }
}
