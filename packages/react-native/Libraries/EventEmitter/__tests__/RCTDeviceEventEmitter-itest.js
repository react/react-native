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

import {DeviceEventEmitter} from 'react-native';

const TRACE_TAG_REACT = 1 << 13; // eslint-disable-line no-bitwise

function enableTracing() {
  global.nativeTraceIsTracing = jest.fn(() => true);
  global.nativeTraceBeginSection = jest.fn();
  global.nativeTraceEndSection = jest.fn();
}

function disableTracing() {
  delete global.nativeTraceIsTracing;
  delete global.nativeTraceBeginSection;
  delete global.nativeTraceEndSection;
  delete global.__RCTProfileIsProfiling;
}

describe('DeviceEventEmitter', () => {
  afterEach(() => {
    DeviceEventEmitter.removeAllListeners();
    disableTracing();
  });

  it('forwards events and arguments to listeners', () => {
    const listener = jest.fn();
    DeviceEventEmitter.addListener('event', listener);

    DeviceEventEmitter.emit('event', 'one', 2);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('one', 2);
  });

  it('does not call trace sections when tracing is disabled', () => {
    const listener = jest.fn();
    DeviceEventEmitter.addListener('event', listener);

    DeviceEventEmitter.emit('event');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceBeginSection).toBeUndefined();
  });

  it('wraps emit in a trace section when tracing is enabled', () => {
    enableTracing();
    const listener = jest.fn();
    DeviceEventEmitter.addListener('event', listener);

    DeviceEventEmitter.emit('event');

    expect(global.nativeTraceBeginSection).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceBeginSection).toHaveBeenCalledWith(
      TRACE_TAG_REACT,
      'RCTDeviceEventEmitter.emit#event',
      undefined,
    );
    expect(listener).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceEndSection).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceEndSection).toHaveBeenCalledWith(
      TRACE_TAG_REACT,
      undefined,
    );
  });

  it('ends the trace section even when a listener throws', () => {
    enableTracing();
    DeviceEventEmitter.addListener('event', () => {
      throw new Error('boom');
    });

    expect(() => DeviceEventEmitter.emit('event')).toThrow('boom');

    expect(global.nativeTraceBeginSection).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceEndSection).toHaveBeenCalledTimes(1);
  });

  it('traces when __RCTProfileIsProfiling is set and nativeTraceIsTracing is absent', () => {
    global.__RCTProfileIsProfiling = true;
    global.nativeTraceBeginSection = jest.fn();
    global.nativeTraceEndSection = jest.fn();

    DeviceEventEmitter.emit('event');

    expect(global.nativeTraceBeginSection).toHaveBeenCalledTimes(1);
    expect(global.nativeTraceEndSection).toHaveBeenCalledTimes(1);
  });
});
