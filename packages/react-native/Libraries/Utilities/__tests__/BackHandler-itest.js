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

import type {HardwareBackPressEvent} from 'react-native/Libraries/Utilities/BackHandler';

import RCTDeviceEventEmitter from 'react-native/Libraries/EventEmitter/RCTDeviceEventEmitter';
import BackHandler from 'react-native/Libraries/Utilities/BackHandler';
import {HardwareBackPressEvent as HardwareBackPressEventClass} from 'react-native/Libraries/Utilities/HardwareBackPressEvent';

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
    const handler1 = (_event: HardwareBackPressEvent) => {
      callOrder.push('first');
      return false;
    };
    const handler2 = (_event: HardwareBackPressEvent) => {
      callOrder.push('second');
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler1),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler2),
    );

    RCTDeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(callOrder).toEqual(['second']);
  });

  it('calls all handlers when none return true', () => {
    const callOrder: Array<string> = [];
    const handler1 = (_event: HardwareBackPressEvent) => {
      callOrder.push('first');
      return false;
    };
    const handler2 = (_event: HardwareBackPressEvent) => {
      callOrder.push('second');
      return false;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler1),
    );
    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler2),
    );

    RCTDeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(callOrder).toEqual(['second', 'first']);
  });

  it('passes HardwareBackPressEvent to handlers', () => {
    let receivedEvent: ?HardwareBackPressEvent = null;
    const handler = (event: HardwareBackPressEvent) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    RCTDeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 42});

    expect(receivedEvent).toBeInstanceOf(HardwareBackPressEventClass);
  });

  it('event has native timestamp as timeStamp', () => {
    let receivedEvent: ?HardwareBackPressEvent = null;
    const handler = (event: HardwareBackPressEvent) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    RCTDeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 42});

    expect(receivedEvent?.timeStamp).toBe(42);
  });

  it('event falls back to performance.now() when no native timestamp', () => {
    let receivedEvent: ?HardwareBackPressEvent = null;
    const handler = (event: HardwareBackPressEvent) => {
      receivedEvent = event;
      return true;
    };

    subscriptions.push(
      BackHandler.addEventListener('hardwareBackPress', handler),
    );

    const before = performance.now();
    RCTDeviceEventEmitter.emit('hardwareBackPress', null);
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
    const handler = (_event: HardwareBackPressEvent) => {
      called = true;
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', handler);
    sub.remove();

    RCTDeviceEventEmitter.emit('hardwareBackPress', {timeStamp: 100});

    expect(called).toBe(false);
  });
});
