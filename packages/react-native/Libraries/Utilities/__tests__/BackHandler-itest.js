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
