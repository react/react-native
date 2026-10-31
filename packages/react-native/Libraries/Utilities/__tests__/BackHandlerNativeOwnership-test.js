/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 * Licensed under the MIT license in the root directory of this source tree.
 * @flow strict-local
 * @format
 */

jest.mock('../../NativeModules/specs/NativeDeviceEventManager', () => ({
  setNativeNavigationEnabled: jest.fn(),
  invokeDefaultBackPressHandler: jest.fn(),
}));

describe('native Back ownership', () => {
  let BackHandler;
  let native;
  beforeEach(() => {
    jest.resetModules();
    BackHandler = require('../BackHandler.android').default;
    native = require('../../NativeModules/specs/NativeDeviceEventManager');
  });

  it('preserves default ownership without native calls', () => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => false,
    );
    subscription.remove();
    expect(native.setNativeNavigationEnabled).not.toHaveBeenCalled();
  });

  it('includes already registered handlers atomically when opting in', () => {
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => false,
    );
    BackHandler.setNativeNavigationEnabled(true);
    expect(native.setNativeNavigationEnabled.mock.calls).toEqual([
      [true, true],
    ]);
    subscription.remove();
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      false,
    );
  });

  it('retains JS ownership until the last unique handler is removed', () => {
    BackHandler.setNativeNavigationEnabled(true);
    const handler = () => false;
    const first = BackHandler.addEventListener('hardwareBackPress', handler);
    const duplicate = BackHandler.addEventListener(
      'hardwareBackPress',
      handler,
    );
    const second = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    first.remove();
    duplicate.remove();
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      true,
    );
    second.remove();
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      false,
    );
    expect(native.setNativeNavigationEnabled.mock.calls).toHaveLength(5);
  });

  it('keeps fallback ordering stable when ownership changes', () => {
    const order = [];
    const fallback = BackHandler.addEventListener('hardwareBackPress', () => {
      order.push('router');
      return true;
    });
    let consume = false;
    BackHandler.addEventListener('hardwareBackPress', () => {
      order.push('overlay');
      return consume;
    });
    BackHandler.setNativeNavigationEnabled(true);
    fallback.setNativeNavigationFallback(true);
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      true,
    );
    const emitter = require('../../EventEmitter/RCTDeviceEventEmitter').default;
    emitter.emit('hardwareBackPress');
    expect(order).toEqual(['overlay', 'router']);
    order.length = 0;
    consume = true;
    fallback.setNativeNavigationFallback(false);
    fallback.setNativeNavigationFallback(true);
    emitter.emit('hardwareBackPress');
    expect(order).toEqual(['overlay']);
  });

  it('uses the native default when JS and router fallback both decline', () => {
    BackHandler.setNativeNavigationEnabled(true);
    BackHandler.addEventListener('hardwareBackPress', () => false, {
      nativeNavigationFallback: true,
    });
    BackHandler.addEventListener('hardwareBackPress', () => false);
    require('../../EventEmitter/RCTDeviceEventEmitter').default.emit(
      'hardwareBackPress',
    );
    expect(native.invokeDefaultBackPressHandler).toHaveBeenCalledTimes(1);
  });

  it('delegated fallback alone does not block native preview', () => {
    BackHandler.setNativeNavigationEnabled(true);
    const fallback = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
      {nativeNavigationFallback: true},
    );
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      false,
    );
    fallback.setNativeNavigationFallback(false);
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      true,
    );
    fallback.remove();
    fallback.setNativeNavigationFallback(false);
    expect(native.setNativeNavigationEnabled).toHaveBeenLastCalledWith(
      true,
      false,
    );
  });

  it('restores legacy mode and stops reporting subscription changes', () => {
    BackHandler.setNativeNavigationEnabled(true);
    BackHandler.setNativeNavigationEnabled(false);
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => true,
    );
    subscription.remove();
    expect(native.setNativeNavigationEnabled.mock.calls).toEqual([
      [true, false],
      [false, false],
    ]);
  });
});
