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

import {HardwareBackPressEvent} from '../HardwareBackPressEvent';
import {BackHandler, DeviceEventEmitter} from 'react-native';

type BackPressHandler = Parameters<typeof BackHandler.addEventListener>[1];
type HardwareBackPressEventType = Parameters<BackPressHandler>[0];

describe('BackHandler', () => {
  const subscriptions: Array<{remove: () => void, ...}> = [];

  afterEach(() => {
    for (const sub of subscriptions) {
      sub.remove();
    }
    subscriptions.length = 0;
  });

  it('calls handlers in reverse order (LIFO)', () => {
    const callOrder: Array<string> = [];
    const handler1 = (_event: HardwareBackPressEventType) => {
      callOrder.push('first');
      return false;
    };
    const handler2 = (_event: HardwareBackPressEventType) => {
      callOrder.push('second');
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler1),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler2),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(callOrder).toEqual(['second']);
  });

  it('calls all handlers when none return true', () => {
    const callOrder: Array<string> = [];
    const handler1 = (_event: HardwareBackPressEventType) => {
      callOrder.push('first');
      return false;
    };
    const handler2 = (_event: HardwareBackPressEventType) => {
      callOrder.push('second');
      return false;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler1),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler2),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(callOrder).toEqual(['second', 'first']);
  });

  it('passes HardwareBackPressEvent to handlers', () => {
    let receivedEvent: ?HardwareBackPressEventType = null;
    const handler = (event: HardwareBackPressEventType) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 42});

    expect(receivedEvent).toBeInstanceOf(HardwareBackPressEvent);
  });

  it('event has native timestamp as timeStamp', () => {
    let receivedEvent: ?HardwareBackPressEventType = null;
    const handler = (event: HardwareBackPressEventType) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 42});

    expect(receivedEvent?.timeStamp).toBe(42);
  });

  it('event falls back to performance.now() when no native timestamp', () => {
    let receivedEvent: ?HardwareBackPressEventType = null;
    const handler = (event: HardwareBackPressEventType) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    const before = performance.now();
    DeviceEventEmitter.emit('hardwareBackPress', null);
    const after = performance.now();

    const timeStamp = receivedEvent?.timeStamp;
    expect(timeStamp).not.toBeNull();
    if (timeStamp != null) {
      expect(timeStamp).toBeGreaterThanOrEqual(before);
      expect(timeStamp).toBeLessThanOrEqual(after);
    }
  });

  it('removes handler on subscription.remove()', () => {
    let called = false;
    const handler = (_event: HardwareBackPressEventType) => {
      called = true;
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    sub.remove();

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(called).toBe(false);
  });
});

// Fantom has no DeviceEventManager native module, so the request BackHandler
// sends to native can't be observed. These cases cover the parts of the
// `intercept` option that are visible through the public API: it must not
// change which handlers run, or how often.
describe('BackHandler intercept option', () => {
  const subscriptions: Array<{remove: () => void, ...}> = [];

  afterEach(() => {
    for (const sub of subscriptions) {
      sub.remove();
    }
    subscriptions.length = 0;
  });

  it('calls a handler added with intercept', () => {
    let called = false;
    const handler = (_event: HardwareBackPressEventType) => {
      called = true;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler, {
        intercept: true,
      }),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(called).toBe(true);
  });

  it('keeps reverse order across listeners with and without intercept', () => {
    const callOrder: Array<string> = [];
    const handler1 = (_event: HardwareBackPressEventType) => {
      callOrder.push('first');
      return false;
    };
    const handler2 = (_event: HardwareBackPressEventType) => {
      callOrder.push('second');
      return false;
    };
    const handler3 = (_event: HardwareBackPressEventType) => {
      callOrder.push('third');
      return false;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler1, {
        intercept: true,
      }),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler2),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler3, {
        intercept: true,
      }),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(callOrder).toEqual(['third', 'second', 'first']);
  });

  it('runs the same handlers after setInterceptEnabled', () => {
    const callOrder: Array<string> = [];
    const intercepting = BackHandler.addEventListener(
      'hardwareBackPress',
      (_event: HardwareBackPressEventType) => {
        callOrder.push('intercepting');
        return false;
      },
      {intercept: true},
    );
    const plain = BackHandler.addEventListener(
      'hardwareBackPress',
      (_event: HardwareBackPressEventType) => {
        callOrder.push('plain');
        return false;
      },
    );
    subscriptions.push(intercepting, plain);

    intercepting.setInterceptEnabled(false);
    plain.setInterceptEnabled(true);
    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    intercepting.setInterceptEnabled(true);
    plain.setInterceptEnabled(false);
    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 200});

    expect(callOrder).toEqual([
      'plain',
      'intercepting',
      'plain',
      'intercepting',
    ]);
  });

  it('does not bring back a removed listener on setInterceptEnabled', () => {
    let called = false;
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      (_event: HardwareBackPressEventType) => {
        called = true;
        return true;
      },
    );
    subscription.remove();

    subscription.setInterceptEnabled(true);
    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(called).toBe(false);
  });

  it('calls the same handler once when added twice', () => {
    let calls = 0;
    const handler = (_event: HardwareBackPressEventType) => {
      calls++;
      return false;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler, {
        intercept: true,
      }),
    );

    DeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(calls).toBe(1);
  });
});
