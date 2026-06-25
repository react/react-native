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

import NativeAnimatedHelper from '../../../src/private/animated/NativeAnimatedHelper';
import AnimatedValue from '../nodes/AnimatedValue';

describe('AnimatedValue', () => {
  // Fantom uses the real native animated module and does not support
  // `jest.spyOn`, so we wrap the relevant `NativeAnimatedHelper.API` methods
  // with call-through mocks that count invocations and restore them afterwards.
  const restoreAPI: Array<() => void> = [];

  function spyOnAPI(name: string) {
    // $FlowFixMe[invalid-computed-prop]
    const original = NativeAnimatedHelper.API[name];
    const spy = jest.fn((...args: Array<unknown>) =>
      original.apply(NativeAnimatedHelper.API, args),
    );
    // $FlowFixMe[prop-missing]
    // $FlowFixMe[cannot-write]
    NativeAnimatedHelper.API[name] = spy;
    restoreAPI.push(() => {
      // $FlowFixMe[prop-missing]
      // $FlowFixMe[cannot-write]
      NativeAnimatedHelper.API[name] = original;
    });
    return spy;
  }

  function createNativeAnimatedValue(): AnimatedValue {
    return new AnimatedValue(0, {useNativeDriver: true});
  }

  function emitMockUpdate(
    node: AnimatedValue,
    mockValue: number,
    mockOffset: number,
  ): void {
    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
      tag: nativeTag,
      value: mockValue,
      offset: mockOffset,
    });
  }

  beforeEach(() => {
    spyOnAPI('createAnimatedNode');
    spyOnAPI('dropAnimatedNode');
    spyOnAPI('startListeningToAnimatedNodeValue');
    spyOnAPI('setWaitingForIdentifier');
    spyOnAPI('unsetWaitingForIdentifier');
  });

  afterEach(() => {
    while (restoreAPI.length > 0) {
      restoreAPI.pop()?.();
    }
  });

  it('emits update events for listeners added', () => {
    const callback = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();
    const id = node.addListener(callback);

    const nativeTag = node.__nativeTag;
    expect(nativeTag).not.toBe(undefined);

    emitMockUpdate(node, 123, 50);
    expect(callback).toBeCalledTimes(1);

    node.removeListener(id);

    emitMockUpdate(node, 456, 60);
    expect(callback).toBeCalledTimes(1);
  });

  it('creates a native node when adding a listener', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).not.toBeCalled();

    const id = node.addListener(jest.fn());
    node.removeListener(id);
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
  });

  it('drops a created native node on detach', () => {
    const node = createNativeAnimatedValue();
    node.__attach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(0);

    node.addListener(jest.fn());
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(0);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);
    expect(NativeAnimatedHelper.API.dropAnimatedNode).toBeCalledTimes(1);
  });

  it('emits update events for listeners added after re-attach', () => {
    const callbackA = jest.fn();
    const node = createNativeAnimatedValue();
    node.__attach();

    node.addListener(callbackA);
    emitMockUpdate(node, 123, 50);
    expect(callbackA).toBeCalledTimes(1);

    node.__detach();
    expect(NativeAnimatedHelper.API.createAnimatedNode).toBeCalledTimes(1);

    const callbackB = jest.fn();
    node.__attach();
    node.addListener(callbackB);

    emitMockUpdate(node, 456, 60);
    expect(callbackA).toBeCalledTimes(1);
    expect(callbackB).toBeCalledTimes(1);
  });

  describe('when NativeAnimatedHelper.API.startListeningToAnimatedNodeValue is called', () => {
    it('starts listening when addListener is called after __makeNative', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.__makeNative();
      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(1);
    });

    it('starts listening when __makeNative is called after addListener', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.__makeNative();

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(1);
    });

    it('does not start listening to node when not native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.__attach();
      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);

      node.addListener(() => {});

      expect(
        NativeAnimatedHelper.API.startListeningToAnimatedNodeValue,
      ).toBeCalledTimes(0);
    });
  });

  describe('when extractOffset is called', () => {
    it('flushes changes to native immediately when native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: true});

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        0,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(0);

      node.extractOffset();

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        1,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(1);
    });

    it('does not flush changes when not native', () => {
      const node = new AnimatedValue(0, {useNativeDriver: false});

      node.extractOffset();

      expect(NativeAnimatedHelper.API.setWaitingForIdentifier).toBeCalledTimes(
        0,
      );
      expect(
        NativeAnimatedHelper.API.unsetWaitingForIdentifier,
      ).toBeCalledTimes(0);
    });
  });

  describe('when receiving an update event', () => {
    it('calls __onAnimatedValueUpdateReceived with value and offset', () => {
      const callback = jest.fn();
      const node = createNativeAnimatedValue();
      node.__attach();
      node.addListener(callback);

      const nativeTag = node.__nativeTag;
      expect(nativeTag).not.toBe(undefined);

      emitMockUpdate(node, 123, 50);

      // $FlowFixMe[method-unbinding]
      const original = node.__onAnimatedValueUpdateReceived;
      const spy = jest.fn((...args: Array<unknown>) =>
        original.apply(node, args),
      );
      // $FlowFixMe[cannot-write]
      node.__onAnimatedValueUpdateReceived = spy;

      const mockValue = 100;
      const mockOffset = 50;

      emitMockUpdate(node, mockValue, mockOffset);

      expect(spy).toHaveBeenCalledWith(mockValue, mockOffset);
      // $FlowFixMe[cannot-write]
      node.__onAnimatedValueUpdateReceived = original;
    });
  });
});
