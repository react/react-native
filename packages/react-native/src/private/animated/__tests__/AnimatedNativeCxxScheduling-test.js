/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof TNativeAnimatedModule from '../../specs_DEPRECATED/modules/NativeAnimatedModule';

import {create} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';

// The C++ backend flushes batched native operations on a microtask
// (`scheduleQueueFlush` -> `queueMicrotask`), so drain it before asserting.
const flushMicrotasks = (): Promise<void> => Promise.resolve();

describe('Native Animated scheduling (cxxNativeAnimatedEnabled)', () => {
  let NativeAnimatedModule: Exclude<TNativeAnimatedModule, null | void>;

  function importModules() {
    return {
      // $FlowFixMe[unsafe-getters-setters]
      get Animated() {
        return require('../../../../Libraries/Animated/Animated').default;
      },
      // $FlowFixMe[unsafe-getters-setters]
      get ReactNativeFeatureFlags() {
        return require('../../featureflags/ReactNativeFeatureFlags');
      },
    };
  }

  beforeEach(() => {
    jest.resetModules();
    jest.restoreAllMocks();
    jest
      .mock('../../../../Libraries/BatchedBridge/NativeModules', () => ({
        __esModule: true,
        default: {
          NativeAnimatedModule: {},
          PlatformConstants: {
            getConstants() {
              return {};
            },
          },
        },
      }))
      .mock('../../specs_DEPRECATED/modules/NativeAnimatedModule')
      .mock('../../../../Libraries/EventEmitter/NativeEventEmitter')
      // findNodeHandle is imported from RendererProxy so mock that whole module.
      .setMock('../../../../Libraries/ReactNative/RendererProxy', {
        findNodeHandle: () => 1,
      });

    NativeAnimatedModule =
      // $FlowFixMe[incompatible-type]
      require('../../specs_DEPRECATED/modules/NativeAnimatedModule').default;
    // $FlowFixMe[cannot-write]
    // $FlowFixMe[incompatible-use]
    // $FlowFixMe[unsafe-object-assign]
    Object.assign(NativeAnimatedModule, {
      getValue: jest.fn(),
      addAnimatedEventToView: jest.fn(),
      connectAnimatedNodes: jest.fn(),
      connectAnimatedNodeToView: jest.fn(),
      createAnimatedNode: jest.fn(),
      disconnectAnimatedNodeFromView: jest.fn(),
      disconnectAnimatedNodes: jest.fn(),
      dropAnimatedNode: jest.fn(),
      extractAnimatedNodeOffset: jest.fn(),
      flattenAnimatedNodeOffset: jest.fn(),
      removeAnimatedEventFromView: jest.fn(),
      restoreDefaultValues: jest.fn(),
      setAnimatedNodeOffset: jest.fn(),
      setAnimatedNodeValue: jest.fn(),
      startAnimatingNode: jest.fn(),
      startListeningToAnimatedNodeValue: jest.fn(),
      stopAnimation: jest.fn(),
      stopListeningToAnimatedNodeValue: jest.fn(),
    });
  });

  it('runs with cxxNativeAnimatedEnabled forced on', () => {
    const {ReactNativeFeatureFlags} = importModules();
    expect(ReactNativeFeatureFlags.cxxNativeAnimatedEnabled()).toBe(true);
  });

  it('batches a synchronous Animated operation and flushes it on a microtask', async () => {
    const {Animated} = importModules();

    const opacity = new Animated.Value(0);
    opacity.__makeNative();
    await create(<Animated.View style={{opacity}} />);

    // With the C++ backend a synchronous Animated call is batched rather than
    // dispatched inline...
    opacity.setValue(0.5);
    expect(NativeAnimatedModule.setAnimatedNodeValue).not.toHaveBeenCalled();

    // ...and reaches the native module once the microtask drains, with the same
    // arguments the inline (platform) backend would have sent.
    await flushMicrotasks();
    expect(NativeAnimatedModule.setAnimatedNodeValue).toHaveBeenCalledWith(
      expect.any(Number),
      0.5,
    );
  });

  it('batches a native-driven animation start and flushes it on a microtask', async () => {
    const {Animated} = importModules();

    const opacity = new Animated.Value(0);
    // Mount first so the style/props nodes are already created and flushed; this
    // isolates the `startAnimatingNode` operation produced by `start()` below
    // (otherwise `create()` would drain the flush before we can observe it).
    await create(<Animated.View style={{opacity}} />);

    // Starting a native-driven animation batches `startAnimatingNode` rather
    // than dispatching it inline...
    Animated.timing(opacity, {
      toValue: 10,
      duration: 1000,
      useNativeDriver: true,
    }).start();
    expect(NativeAnimatedModule.startAnimatingNode).not.toHaveBeenCalled();

    // ...and it reaches the native module once the microtask drains.
    await flushMicrotasks();
    expect(NativeAnimatedModule.startAnimatingNode).toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(Number),
      expect.objectContaining({type: 'frames'}),
      expect.any(Function),
    );
  });
});
