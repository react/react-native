/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

jest.mock('../../EventEmitter/NativeEventEmitter');

const RCTDeviceEventEmitter =
  require('../../EventEmitter/RCTDeviceEventEmitter').default;
const PushNotificationIOS = require('../PushNotificationIOS').default;

describe('PushNotificationIOS event listeners', () => {
  afterEach(() => {
    PushNotificationIOS.removeEventListener('notification');
    PushNotificationIOS.removeEventListener('register');
  });

  it('removes the listener on removeEventListener', () => {
    const handler = jest.fn();
    PushNotificationIOS.addEventListener('register', handler);
    expect(
      RCTDeviceEventEmitter.listenerCount('remoteNotificationsRegistered'),
    ).toBe(1);

    PushNotificationIOS.removeEventListener('register');
    expect(
      RCTDeviceEventEmitter.listenerCount('remoteNotificationsRegistered'),
    ).toBe(0);

    RCTDeviceEventEmitter.emit('remoteNotificationsRegistered', {
      deviceToken: 'token',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('does not leak the previous listener when adding the same type twice', () => {
    const first = jest.fn();
    const second = jest.fn();

    PushNotificationIOS.addEventListener('notification', first);
    PushNotificationIOS.addEventListener('notification', second);

    // The second registration replaces the first one.
    expect(
      RCTDeviceEventEmitter.listenerCount('remoteNotificationReceived'),
    ).toBe(1);

    PushNotificationIOS.removeEventListener('notification');

    // Nothing is left registered, so neither handler can fire any more.
    expect(
      RCTDeviceEventEmitter.listenerCount('remoteNotificationReceived'),
    ).toBe(0);
    RCTDeviceEventEmitter.emit('remoteNotificationReceived', {});
    expect(first).not.toHaveBeenCalled();
    expect(second).not.toHaveBeenCalled();
  });

  it('only invokes the most recently added handler', () => {
    const first = jest.fn();
    const second = jest.fn();

    PushNotificationIOS.addEventListener('register', first);
    PushNotificationIOS.addEventListener('register', second);

    RCTDeviceEventEmitter.emit('remoteNotificationsRegistered', {
      deviceToken: 'token',
    });

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith('token');
  });
});
