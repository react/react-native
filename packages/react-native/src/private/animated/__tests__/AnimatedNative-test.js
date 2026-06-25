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

import {create, unmount, update} from '@react-native/jest-preset/jest/renderer';
import * as React from 'react';
import {createRef} from 'react';
import {format} from 'util';

describe('Native Animated', () => {
  let NativeAnimatedModule: Exclude<TNativeAnimatedModule, null | void>;

  function importModules() {
    return {
      // $FlowFixMe[unsafe-getters-setters]
      get Animated() {
        return require('../../../../Libraries/Animated/Animated').default;
      },
      // $FlowFixMe[unsafe-getters-setters]
      get NativeAnimatedHelper() {
        return require('../NativeAnimatedHelper').default;
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

  describe('Animated Value', () => {
    it('proxies `setValue` correctly', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      const ref = createRef<React.ElementRef<typeof Animated.View>>();

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      await create(<Animated.View ref={ref} style={{opacity}} />);

      expect(ref.current).not.toBeNull();
      jest.spyOn(ref.current, 'setNativeProps');

      opacity.setValue(0.5);

      expect(NativeAnimatedModule.setAnimatedNodeValue).toBeCalledWith(
        expect.any(Number),
        0.5,
      );
      // $FlowFixMe[method-unbinding]
      expect(ref.current?.setNativeProps).not.toHaveBeenCalled();
    });

    it('should set offset', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      opacity.setOffset(10);
      opacity.__makeNative();

      await create(<Animated.View style={{opacity}} />);

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'value', value: 0, offset: 10},
      );
      opacity.setOffset(20);
      expect(NativeAnimatedModule.setAnimatedNodeOffset).toBeCalledWith(
        expect.any(Number),
        20,
      );
    });

    it('should flatten offset', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      opacity.__makeNative();

      await create(<Animated.View style={{opacity}} />);

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'value', value: 0, offset: 0},
      );
      opacity.flattenOffset();
      expect(NativeAnimatedModule.flattenAnimatedNodeOffset).toBeCalledWith(
        expect.any(Number),
      );
    });

    it('should save value on unmount', async () => {
      const {Animated} = importModules();

      jest
        .spyOn(NativeAnimatedModule, 'getValue')
        .mockImplementation((tag, saveCallback) => {
          saveCallback(1);
        });
      const opacity = new Animated.Value(0);

      opacity.__makeNative();

      const root = await create(<Animated.View style={{opacity}} />);
      const tag = opacity.__getNativeTag();

      await unmount(root);
      jest.runAllTicks();
      expect(NativeAnimatedModule.getValue).toBeCalledWith(
        tag,
        expect.any(Function),
      );
      expect(opacity.__getValue()).toBe(1);
    });

    it('should deduct offset when saving value on unmount', async () => {
      const {Animated} = importModules();

      jest
        .spyOn(NativeAnimatedModule, 'getValue')
        .mockImplementation((tag, saveCallback) => {
          // Assume current raw value of value node is 0.5, the NativeAnimated
          // getValue API returns the sum of raw value and offset, so return 1.
          saveCallback(1);
        });
      const opacity = new Animated.Value(0);
      opacity.setOffset(0.5);
      opacity.__makeNative();

      const root = await create(<Animated.View style={{opacity}} />);
      const tag = opacity.__getNativeTag();

      await unmount(root);
      jest.runAllTicks();
      expect(NativeAnimatedModule.getValue).toBeCalledWith(
        tag,
        expect.any(Function),
      );
      expect(opacity.__getValue()).toBe(1);
    });

    it('should extract offset', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      opacity.__makeNative();

      await create(<Animated.View style={{opacity}} />);

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'value', value: 0, offset: 0},
      );
      opacity.extractOffset();
      expect(NativeAnimatedModule.extractAnimatedNodeOffset).toBeCalledWith(
        expect.any(Number),
      );
    });
  });

  describe('Animated Listeners', () => {
    it('should get updates', () => {
      const {Animated, NativeAnimatedHelper} = importModules();

      const value1 = new Animated.Value(0);
      value1.__makeNative();
      const listener = jest.fn();
      const id = value1.addListener(listener);
      expect(
        NativeAnimatedModule.startListeningToAnimatedNodeValue,
      ).toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        value: 42,
        tag: value1.__getNativeTag(),
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toBeCalledWith({value: 42});
      expect(value1.__getValue()).toBe(42);

      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        value: 7,
        tag: value1.__getNativeTag(),
      });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(listener).toBeCalledWith({value: 7});
      expect(value1.__getValue()).toBe(7);

      value1.removeListener(id);
      expect(
        NativeAnimatedModule.stopListeningToAnimatedNodeValue,
      ).toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        value: 1492,
        tag: value1.__getNativeTag(),
      });
      expect(listener).toHaveBeenCalledTimes(2);
      expect(value1.__getValue()).toBe(7);
    });

    it('should removeAll', () => {
      const {Animated, NativeAnimatedHelper} = importModules();

      const value1 = new Animated.Value(0);
      value1.__makeNative();
      const listener = jest.fn();
      [1, 2, 3, 4].forEach(() => value1.addListener(listener));
      expect(
        NativeAnimatedModule.startListeningToAnimatedNodeValue,
      ).toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        value: 42,
        tag: value1.__getNativeTag(),
      });
      expect(listener).toHaveBeenCalledTimes(4);
      expect(listener).toBeCalledWith({value: 42});

      value1.removeAllListeners();
      expect(
        NativeAnimatedModule.stopListeningToAnimatedNodeValue,
      ).toHaveBeenCalledWith(value1.__getNativeTag());

      NativeAnimatedHelper.nativeEventEmitter.emit('onAnimatedValueUpdate', {
        value: 7,
        tag: value1.__getNativeTag(),
      });
      expect(listener).toHaveBeenCalledTimes(4);
    });
  });

  describe('Animated Events', () => {
    it('should map events', async () => {
      const {Animated} = importModules();

      const value = new Animated.Value(0);
      value.__makeNative();
      const event = Animated.event([{nativeEvent: {state: {foo: value}}}], {
        useNativeDriver: true,
      });

      const root = await create(<Animated.View onTouchMove={event} />);
      expect(NativeAnimatedModule.addAnimatedEventToView).toBeCalledWith(
        expect.any(Number),
        'onTouchMove',
        {
          nativeEventPath: ['state', 'foo'],
          animatedValueTag: value.__getNativeTag(),
        },
      );

      expect(
        NativeAnimatedModule.removeAnimatedEventFromView,
      ).not.toHaveBeenCalled();
      await unmount(root);
      expect(NativeAnimatedModule.removeAnimatedEventFromView).toBeCalledWith(
        expect.any(Number),
        'onTouchMove',
        value.__getNativeTag(),
      );
    });

    it('should map AnimatedValueXY', async () => {
      const {Animated} = importModules();

      const value = new Animated.ValueXY({x: 0, y: 0});
      value.__makeNative();
      const event = Animated.event([{nativeEvent: {state: value}}], {
        useNativeDriver: true,
      });

      await create(<Animated.View onTouchMove={event} />);
      (['x', 'y'] as const).forEach((key, idx) =>
        expect(
          NativeAnimatedModule.addAnimatedEventToView,
        ).toHaveBeenNthCalledWith(idx + 1, expect.any(Number), 'onTouchMove', {
          nativeEventPath: ['state', key],
          animatedValueTag: value[key].__getNativeTag(),
        }),
      );
    });

    it('should throw on invalid event path', async () => {
      const {Animated} = importModules();

      const value = new Animated.Value(0);
      value.__makeNative();
      const event = Animated.event([{notNativeEvent: {foo: value}}], {
        useNativeDriver: true,
      });

      const consoleError = console.error;
      jest.spyOn(console, 'error').mockImplementationOnce((...args) => {
        const message = format(...args);
        if (message.includes('The above error occurred in the')) {
          return;
        }
        consoleError(...args);
      });

      await expect(async () => {
        await create(<Animated.View onTouchMove={event} />);
      }).rejects.toThrowError(/nativeEvent/);
      expect(NativeAnimatedModule.addAnimatedEventToView).not.toBeCalled();
    });

    it('should call listeners', () => {
      const {Animated} = importModules();

      const value = new Animated.Value(0);
      value.__makeNative();
      const listener = jest.fn();
      const event = Animated.event([{nativeEvent: {foo: value}}], {
        useNativeDriver: true,
        listener,
      });
      const handler = event.__getHandler();
      handler({nativeEvent: {foo: 42}});
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toBeCalledWith({nativeEvent: {foo: 42}});
    });
  });

  describe('Animated Graph', () => {
    it('creates and detaches nodes', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      const root = await create(<Animated.View style={{opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      expect(NativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(3);
      expect(NativeAnimatedModule.connectAnimatedNodes).toHaveBeenCalledTimes(
        2,
      );

      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'frames',
          frames: expect.any(Array),
          toValue: expect.any(Number),
          iterations: 1,
          deferredStart: false,
        },
        expect.any(Function),
      );

      expect(
        NativeAnimatedModule.disconnectAnimatedNodes,
      ).not.toHaveBeenCalled();
      expect(NativeAnimatedModule.dropAnimatedNode).not.toHaveBeenCalled();

      await unmount(root);
      jest.runAllTicks();
      expect(
        NativeAnimatedModule.disconnectAnimatedNodes,
      ).toHaveBeenCalledTimes(2);
      expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(3);
    });

    it('sends a valid description for value, style and props nodes', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      await create(<Animated.View style={{opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'value', value: 0, offset: 0},
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'style', style: {opacity: expect.any(Number)}},
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'props', props: {style: expect.any(Number)}, rootTag: 0},
      );
    });

    it('sends a valid graph description for Animated.add nodes', async () => {
      const {Animated} = importModules();

      const first = new Animated.Value(1);
      const second = new Animated.Value(2);
      first.__makeNative();
      second.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.add(first, second)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'addition', input: expect.any(Array)},
      );
      const additionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'addition',
        );
      expect(additionCalls.length).toBe(1);
      const additionCall = additionCalls[0];
      const additionNodeTag = additionCall[0];
      const additionConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === additionNodeTag,
        );
      expect(additionConnectionCalls.length).toBe(2);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        additionCall[1].input[0],
        {
          type: 'value',
          value: 1,
          offset: 0,
        },
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        additionCall[1].input[1],
        {
          type: 'value',
          value: 2,
          offset: 0,
        },
      );
    });

    it('sends a valid graph description for Animated.subtract nodes', async () => {
      const {Animated} = importModules();

      const first = new Animated.Value(2);
      const second = new Animated.Value(1);
      first.__makeNative();
      second.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.subtract(first, second)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'subtraction', input: expect.any(Array)},
      );
      const subtractionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'subtraction',
        );
      expect(subtractionCalls.length).toBe(1);
      const subtractionCall = subtractionCalls[0];
      const subtractionNodeTag = subtractionCall[0];
      const subtractionConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === subtractionNodeTag,
        );
      expect(subtractionConnectionCalls.length).toBe(2);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        subtractionCall[1].input[0],
        {
          type: 'value',
          value: 2,
          offset: 0,
        },
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        subtractionCall[1].input[1],
        {
          type: 'value',
          value: 1,
          offset: 0,
        },
      );
    });

    it('sends a valid graph description for Animated.multiply nodes', async () => {
      const {Animated} = importModules();

      const first = new Animated.Value(2);
      const second = new Animated.Value(1);
      first.__makeNative();
      second.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.multiply(first, second)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'multiplication', input: expect.any(Array)},
      );
      const multiplicationCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'multiplication',
        );
      expect(multiplicationCalls.length).toBe(1);
      const multiplicationCall = multiplicationCalls[0];
      const multiplicationNodeTag = multiplicationCall[0];
      const multiplicationConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === multiplicationNodeTag,
        );
      expect(multiplicationConnectionCalls.length).toBe(2);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        multiplicationCall[1].input[0],
        {
          type: 'value',
          value: 2,
          offset: 0,
        },
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        multiplicationCall[1].input[1],
        {
          type: 'value',
          value: 1,
          offset: 0,
        },
      );
    });

    it('sends a valid graph description for Animated.divide nodes', async () => {
      const {Animated} = importModules();

      const first = new Animated.Value(4);
      const second = new Animated.Value(2);
      first.__makeNative();
      second.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.divide(first, second)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'division', input: expect.any(Array)},
      );
      const divisionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'division',
        );
      expect(divisionCalls.length).toBe(1);
      const divisionCall = divisionCalls[0];
      const divisionNodeTag = divisionCall[0];
      const divisionConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === divisionNodeTag,
        );
      expect(divisionConnectionCalls.length).toBe(2);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        divisionCall[1].input[0],
        {
          type: 'value',
          value: 4,
          offset: 0,
        },
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        divisionCall[1].input[1],
        {
          type: 'value',
          value: 2,
          offset: 0,
        },
      );
    });

    it('sends a valid graph description for Animated.modulo nodes', async () => {
      const {Animated} = importModules();

      const value = new Animated.Value(4);
      value.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.modulo(value, 4)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'modulus', modulus: 4, input: expect.any(Number)},
      );
      const moduloCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'modulus',
        );
      expect(moduloCalls.length).toBe(1);
      const moduloCall = moduloCalls[0];
      const moduloNodeTag = moduloCall[0];
      const moduloConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === moduloNodeTag,
        );
      expect(moduloConnectionCalls.length).toBe(1);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        moduloCall[1].input,
        {
          type: 'value',
          value: 4,
          offset: 0,
        },
      );
    });

    it('sends a valid graph description for interpolate() nodes', async () => {
      const {Animated} = importModules();

      const value = new Animated.Value(10);
      value.__makeNative();

      await create(
        <Animated.View
          style={{
            opacity: value.interpolate({
              inputRange: [10, 20],
              outputRange: [0, 1],
            }),
          }}
        />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'value', value: 10, offset: 0},
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {
          type: 'interpolation',
          inputRange: [10, 20],
          outputRange: [0, 1],
          outputType: null,
          extrapolateLeft: 'extend',
          extrapolateRight: 'extend',
        },
      );
      const interpolationNodeTag =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.find(
          call => call[1].type === 'interpolation',
        )[0];
      const valueNodeTag =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.find(
          call => call[1].type === 'value',
        )[0];
      expect(NativeAnimatedModule.connectAnimatedNodes).toBeCalledWith(
        valueNodeTag,
        interpolationNodeTag,
      );
    });

    it('sends a valid graph description for transform nodes', async () => {
      const {Animated} = importModules();

      const translateX = new Animated.Value(0);
      translateX.__makeNative();

      await create(
        <Animated.View style={{transform: [{translateX}, {scale: 2}]}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {
          type: 'transform',
          transforms: [
            {
              nodeTag: expect.any(Number),
              property: 'translateX',
              type: 'animated',
            },
            {
              value: 2,
              property: 'scale',
              type: 'static',
            },
          ],
        },
      );
    });

    it('sends create operations before connect operations for multiple animated style props', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      const borderRadius = new Animated.Value(0);
      await create(<Animated.View style={{borderRadius, opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // $FlowFixMe[prop-missing]
      const createCalls = NativeAnimatedModule.createAnimatedNode.mock.calls;
      const createCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.invocationCallOrder;
      // $FlowFixMe[prop-missing]
      const connectCalls = NativeAnimatedModule.connectAnimatedNodes.mock.calls;
      const connectCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.invocationCallOrder;

      // First value node and style node should both be created before they are connected
      const valueNodeCreateCallIndices = createCalls.reduce(
        (acc, call, index) => {
          call[1].type === 'value' && acc.push(index);
          return acc;
        },
        [],
      );
      const value1NodeCreateCall = createCalls[valueNodeCreateCallIndices[0]];
      const value1NodeTag = value1NodeCreateCall[0];
      const value1NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[0]];

      const styleNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'style',
      );
      const styleNodeCreateCall = createCalls[styleNodeCreateCallIndex];
      const styleNodeTag = styleNodeCreateCall[0];
      const styleNodeCreateInvocationOrder =
        createCallOrder[styleNodeCreateCallIndex];

      const value1StyleConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value1NodeTag && call[1] === styleNodeTag,
      );
      const value1StyleConnectInvocationOrder =
        connectCallOrder[value1StyleConnectCallIndex];

      expect(value1NodeCreateInvocationOrder).toBeLessThan(
        value1StyleConnectInvocationOrder,
      );
      expect(styleNodeCreateInvocationOrder).toBeLessThan(
        value1StyleConnectInvocationOrder,
      );

      // Second value node and style node should both be created before they are connected
      const value2NodeCreateCall = createCalls[valueNodeCreateCallIndices[1]];
      const value2NodeTag = value2NodeCreateCall[0];
      const value2NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[1]];

      const value2StyleConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value2NodeTag && call[1] === styleNodeTag,
      );
      const value2StyleConnectInvocationOrder =
        connectCallOrder[value2StyleConnectCallIndex];

      expect(value2NodeCreateInvocationOrder).toBeLessThan(
        value2StyleConnectInvocationOrder,
      );
      expect(styleNodeCreateInvocationOrder).toBeLessThan(
        value2StyleConnectInvocationOrder,
      );

      // Style node and props node should both be created before they are connected
      const propsNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'props',
      );
      const propsNodeCreateCall = createCalls[propsNodeCreateCallIndex];
      const propsNodeTag = propsNodeCreateCall[0];
      const propsNodeCreateInvocationOrder =
        createCallOrder[propsNodeCreateCallIndex];

      const stylePropsConnectCallIndex = connectCalls.findIndex(
        call => call[0] === styleNodeTag && call[1] === propsNodeTag,
      );
      const stylePropsConnectInvocationOrder =
        connectCallOrder[stylePropsConnectCallIndex];

      expect(styleNodeCreateInvocationOrder).toBeLessThan(
        stylePropsConnectInvocationOrder,
      );
      expect(propsNodeCreateInvocationOrder).toBeLessThan(
        stylePropsConnectInvocationOrder,
      );
    });

    it('sends create operations before connect operations for multiple animated transform props', async () => {
      const {Animated} = importModules();

      const translateX = new Animated.Value(0);
      const translateY = new Animated.Value(0);
      await create(
        <Animated.View
          style={{
            transform: [{translateX: translateX}, {translateY: translateY}],
          }}
        />,
      );

      Animated.timing(translateX, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // $FlowFixMe[prop-missing]
      const createCalls = NativeAnimatedModule.createAnimatedNode.mock.calls;
      const createCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.invocationCallOrder;
      // $FlowFixMe[prop-missing]
      const connectCalls = NativeAnimatedModule.connectAnimatedNodes.mock.calls;
      const connectCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.invocationCallOrder;

      // First value node and transform node should both be created before they are connected
      const valueNodeCreateCallIndices = createCalls.reduce(
        (acc, call, index) => {
          call[1].type === 'value' && acc.push(index);
          return acc;
        },
        [],
      );
      const value1NodeCreateCall = createCalls[valueNodeCreateCallIndices[0]];
      const value1NodeTag = value1NodeCreateCall[0];
      const value1NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[0]];

      const transformNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'transform',
      );
      const transformNodeCreateCall = createCalls[transformNodeCreateCallIndex];
      const transformNodeTag = transformNodeCreateCall[0];
      const transformNodeCreateInvocationOrder =
        createCallOrder[transformNodeCreateCallIndex];

      const value1TransformConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value1NodeTag && call[1] === transformNodeTag,
      );
      const value1TransformConnectInvocationOrder =
        connectCallOrder[value1TransformConnectCallIndex];

      expect(value1NodeCreateInvocationOrder).toBeLessThan(
        value1TransformConnectInvocationOrder,
      );
      expect(transformNodeCreateInvocationOrder).toBeLessThan(
        value1TransformConnectInvocationOrder,
      );

      // Second value node and transform node should both be created before they are connected
      const value2NodeCreateCall = createCalls[valueNodeCreateCallIndices[1]];
      const value2NodeTag = value2NodeCreateCall[0];
      const value2NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[1]];

      const value2TransformConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value2NodeTag && call[1] === transformNodeTag,
      );
      const value2TransformConnectInvocationOrder =
        connectCallOrder[value2TransformConnectCallIndex];

      expect(value2NodeCreateInvocationOrder).toBeLessThan(
        value2TransformConnectInvocationOrder,
      );
      expect(transformNodeCreateInvocationOrder).toBeLessThan(
        value2TransformConnectInvocationOrder,
      );

      // Transform node and style node should both be created before they are connected
      const styleNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'style',
      );
      const styleNodeCreateCall = createCalls[styleNodeCreateCallIndex];
      const styleNodeTag = styleNodeCreateCall[0];
      const styleNodeCreateInvocationOrder =
        createCallOrder[styleNodeCreateCallIndex];

      const transformStyleConnectCallIndex = connectCalls.findIndex(
        call => call[0] === transformNodeTag && call[1] === styleNodeTag,
      );
      const transformStyleConnectInvocationOrder =
        connectCallOrder[transformStyleConnectCallIndex];

      expect(transformNodeCreateInvocationOrder).toBeLessThan(
        transformStyleConnectInvocationOrder,
      );
      expect(styleNodeCreateInvocationOrder).toBeLessThan(
        transformStyleConnectInvocationOrder,
      );

      // Style node and props node should both be created before they are connected
      const propsNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'props',
      );
      const propsNodeCreateCall = createCalls[propsNodeCreateCallIndex];
      const propsNodeTag = propsNodeCreateCall[0];
      const propsNodeCreateInvocationOrder =
        createCallOrder[propsNodeCreateCallIndex];

      const stylePropsConnectCallIndex = connectCalls.findIndex(
        call => call[0] === styleNodeTag && call[1] === propsNodeTag,
      );
      const stylePropsConnectInvocationOrder =
        connectCallOrder[stylePropsConnectCallIndex];

      expect(styleNodeCreateInvocationOrder).toBeLessThan(
        stylePropsConnectInvocationOrder,
      );
      expect(propsNodeCreateInvocationOrder).toBeLessThan(
        stylePropsConnectInvocationOrder,
      );
    });

    it('sends create operations before connect operations for multiple animated props', async () => {
      const {Animated} = importModules();

      const propA = new Animated.Value(0);
      const propB = new Animated.Value(0);
      // $FlowFixMe[incompatible-type]
      await create(<Animated.View propA={propA} propB={propB} />);

      Animated.timing(propA, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // $FlowFixMe[prop-missing]
      const createCalls = NativeAnimatedModule.createAnimatedNode.mock.calls;
      const createCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.invocationCallOrder;
      // $FlowFixMe[prop-missing]
      const connectCalls = NativeAnimatedModule.connectAnimatedNodes.mock.calls;
      const connectCallOrder =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.invocationCallOrder;

      // First value node and props node should both be created before they are connected
      const valueNodeCreateCallIndices = createCalls.reduce(
        (acc, call, index) => {
          call[1].type === 'value' && acc.push(index);
          return acc;
        },
        [],
      );
      const value1NodeCreateCall = createCalls[valueNodeCreateCallIndices[0]];
      const value1NodeTag = value1NodeCreateCall[0];
      const value1NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[0]];

      const propsNodeCreateCallIndex = createCalls.findIndex(
        call => call[1].type === 'props',
      );
      const propsNodeCreateCall = createCalls[propsNodeCreateCallIndex];
      const propsNodeTag = propsNodeCreateCall[0];
      const propsNodeCreateInvocationOrder =
        createCallOrder[propsNodeCreateCallIndex];

      const value1PropsConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value1NodeTag && call[1] === propsNodeTag,
      );
      const value1PropsConnectInvocationOrder =
        connectCallOrder[value1PropsConnectCallIndex];

      expect(value1NodeCreateInvocationOrder).toBeLessThan(
        value1PropsConnectInvocationOrder,
      );
      expect(propsNodeCreateInvocationOrder).toBeLessThan(
        value1PropsConnectInvocationOrder,
      );

      // Second value node and props node should both be created before they are connected
      const value2NodeCreateCall = createCalls[valueNodeCreateCallIndices[1]];
      const value2NodeTag = value2NodeCreateCall[0];
      const value2NodeCreateInvocationOrder =
        createCallOrder[valueNodeCreateCallIndices[1]];

      const value2PropsConnectCallIndex = connectCalls.findIndex(
        call => call[0] === value2NodeTag && call[1] === propsNodeTag,
      );
      const value2PropsConnectInvocationOrder =
        connectCallOrder[value2PropsConnectCallIndex];

      expect(value2NodeCreateInvocationOrder).toBeLessThan(
        value2PropsConnectInvocationOrder,
      );
      expect(propsNodeCreateInvocationOrder).toBeLessThan(
        value2PropsConnectInvocationOrder,
      );
    });

    it('sends a valid graph description for Animated.diffClamp nodes', async () => {
      const {Animated} = importModules();

      const value = new Animated.Value(2);
      value.__makeNative();

      await create(
        <Animated.View style={{opacity: Animated.diffClamp(value, 0, 20)}} />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'diffclamp', input: expect.any(Number), max: 20, min: 0},
      );
      const diffClampCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.filter(
          call => call[1].type === 'diffclamp',
        );
      expect(diffClampCalls.length).toBe(1);
      const diffClampCall = diffClampCalls[0];
      const diffClampNodeTag = diffClampCall[0];
      const diffClampConnectionCalls =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.connectAnimatedNodes.mock.calls.filter(
          call => call[1] === diffClampNodeTag,
        );
      expect(diffClampConnectionCalls.length).toBe(1);
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        diffClampCall[1].input,
        {
          type: 'value',
          value: 2,
          offset: 0,
        },
      );
    });

    it("doesn't call into native API if useNativeDriver is set to false", async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);

      const root = await create(<Animated.View style={{opacity}} />);

      Animated.timing(opacity, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: false,
      }).start();

      await unmount(root);

      expect(NativeAnimatedModule.createAnimatedNode).not.toBeCalled();
    });

    it('fails when trying to run non-native animation on native node', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      const ref = createRef<React.ElementRef<typeof Animated.View>>();

      await create(<Animated.View ref={ref} style={{opacity}} />);

      // Necessary to simulate the native animation.
      expect(ref.current).not.toBeNull();
      // $FlowFixMe[cannot-write]
      // $FlowFixMe[incompatible-use]
      ref.current.setNativeProps = jest.fn();

      Animated.timing(opacity, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }).start();
      jest.runAllTimers();

      expect(
        Animated.timing(opacity, {
          toValue: 4,
          duration: 500,
          useNativeDriver: false,
        }).start,
      ).toThrow(
        'Attempting to run JS driven animation on animated node that has ' +
          'been moved to "native" earlier by starting an animation with ' +
          '`useNativeDriver: true`',
      );
    });

    it('fails for unsupported styles', async () => {
      const {Animated} = importModules();

      const left = new Animated.Value(0);

      await create(<Animated.View style={{left}} />);

      const animation = Animated.timing(left, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      });

      jest.spyOn(console, 'error').mockImplementation(() => {});
      animation.start();
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        "Style property 'left' is not supported by native animated module",
      );
    });

    it('works for any `static` props and styles', async () => {
      const {Animated} = importModules();

      // Passing "unsupported" props should work just fine as long as they are not animated
      const opacity = new Animated.Value(0);
      opacity.__makeNative();

      await create(
        <Animated.View
          removeClippedSubviews={true}
          style={{left: 10, opacity, top: 20}}
        />,
      );

      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'style', style: {opacity: expect.any(Number)}},
      );
      expect(NativeAnimatedModule.createAnimatedNode).toBeCalledWith(
        expect.any(Number),
        {type: 'props', props: {style: expect.any(Number)}, rootTag: 0},
      );
    });
  });

  describe('Animations', () => {
    it('sends a valid timing animation description', () => {
      const {Animated} = importModules();

      const anim = new Animated.Value(0);
      Animated.timing(anim, {
        toValue: 10,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'frames',
          frames: expect.any(Array),
          toValue: expect.any(Number),
          iterations: 1,
          deferredStart: false,
        },
        expect.any(Function),
      );
    });

    it('sends a valid spring animation description', () => {
      const {Animated} = importModules();

      const anim = new Animated.Value(0);
      Animated.spring(anim, {
        toValue: 10,
        friction: 5,
        tension: 164,
        useNativeDriver: true,
      }).start();
      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'spring',
          stiffness: 679.08,
          damping: 16,
          mass: 1,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          toValue: 10,
          iterations: 1,
        },
        expect.any(Function),
      );

      Animated.spring(anim, {
        toValue: 10,
        stiffness: 1000,
        damping: 500,
        mass: 3,
        useNativeDriver: true,
      }).start();
      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'spring',
          stiffness: 1000,
          damping: 500,
          mass: 3,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          toValue: 10,
          iterations: 1,
        },
        expect.any(Function),
      );

      Animated.spring(anim, {
        toValue: 10,
        bounciness: 8,
        speed: 10,
        useNativeDriver: true,
      }).start();
      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'spring',
          damping: 23.05223140901191,
          initialVelocity: 0,
          overshootClamping: false,
          restDisplacementThreshold: 0.001,
          restSpeedThreshold: 0.001,
          stiffness: 299.61882352941177,
          mass: 1,
          toValue: 10,
          iterations: 1,
        },
        expect.any(Function),
      );
    });

    it('sends a valid decay animation description', () => {
      const {Animated} = importModules();

      const anim = new Animated.Value(0);
      Animated.decay(anim, {
        velocity: 10,
        deceleration: 0.1,
        useNativeDriver: true,
      }).start();

      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {type: 'decay', deceleration: 0.1, velocity: 10, iterations: 1},
        expect.any(Function),
      );
    });

    it('works with Animated.loop', () => {
      const {Animated} = importModules();

      const anim = new Animated.Value(0);
      Animated.loop(
        Animated.decay(anim, {
          velocity: 10,
          deceleration: 0.1,
          useNativeDriver: true,
        }),
        {iterations: 10},
      ).start();

      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {type: 'decay', deceleration: 0.1, velocity: 10, iterations: 10},
        expect.any(Function),
      );
    });

    it('sends stopAnimation command to native', () => {
      const {Animated} = importModules();

      const value = new Animated.Value(0);
      const animation = Animated.timing(value, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      });

      animation.start();
      expect(NativeAnimatedModule.startAnimatingNode).toBeCalledWith(
        expect.any(Number),
        expect.any(Number),
        {
          type: 'frames',
          frames: expect.any(Array),
          toValue: expect.any(Number),
          iterations: 1,
          deferredStart: false,
        },
        expect.any(Function),
      );
      const animationId =
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.startAnimatingNode.mock.calls[0][0];

      animation.stop();
      expect(NativeAnimatedModule.stopAnimation).toBeCalledWith(animationId);
    });

    it('calls stopAnimation callback with native value', () => {
      const {Animated} = importModules();

      jest
        .spyOn(NativeAnimatedModule, 'getValue')
        .mockImplementation((tag, saveCallback) => {
          saveCallback(1);
        });

      const anim = new Animated.Value(0);
      Animated.timing(anim, {
        duration: 1000,
        toValue: 1,
        useNativeDriver: true,
      }).start();

      const tag = anim.__getNativeTag();

      let currentValue = 0;
      anim.stopAnimation(value => {
        currentValue = value;
      });

      expect(NativeAnimatedModule.getValue).toBeCalledWith(
        tag,
        expect.any(Function),
      );

      expect(currentValue).toEqual(1);
    });
  });

  describe('Animated Components', () => {
    it('preserves current values on update and unmount', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0);
      opacity.__makeNative();

      const root = await create(<Animated.View style={{opacity}} />);
      expect(NativeAnimatedModule.restoreDefaultValues).not.toHaveBeenCalled();

      await update(root, <Animated.View style={{opacity}} />);
      expect(NativeAnimatedModule.restoreDefaultValues).not.toHaveBeenCalled();

      await unmount(root);
      // Make sure it doesn't get called on unmount.
      expect(NativeAnimatedModule.restoreDefaultValues).not.toHaveBeenCalled();
    });

    it('restores defaults when receiving new animated values', async () => {
      const {Animated} = importModules();

      const opacityA = new Animated.Value(0);
      const opacityB = new Animated.Value(0);
      opacityA.__makeNative();
      opacityB.__makeNative();

      const root = await create(<Animated.View style={{opacity: opacityA}} />);
      expect(NativeAnimatedModule.restoreDefaultValues).not.toHaveBeenCalled();

      await update(root, <Animated.View style={{opacity: opacityB}} />);
      jest.runAllTicks();
      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        1,
      );

      await unmount(root);
      jest.runAllTicks();
      // Make sure it doesn't get called on unmount.
      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        1,
      );
    });

    it('connects the native view on mount and disconnects on unmount', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0, {useNativeDriver: true});

      const root = await create(<Animated.View style={{opacity}} />);

      // AnimatedProps > AnimatedStyle > opacity AnimatedValue
      const propsTag = opacity
        .__getChildren()[0]
        .__getChildren()[0]
        .__getNativeTag();
      expect(NativeAnimatedModule.connectAnimatedNodeToView).toBeCalledWith(
        propsTag,
        1,
      );

      await unmount(root);
      jest.runAllTicks();
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toBeCalledWith(propsTag, 1);
    });

    it('reconnects the native view when the component is remounted', async () => {
      const {Animated} = importModules();

      const opacity = new Animated.Value(0, {useNativeDriver: true});
      const ref = createRef<React.ElementRef<typeof Animated.View>>();
      await create(<Animated.View ref={ref} style={{opacity}} />);

      // AnimatedProps > AnimatedStyle > opacity AnimatedValue
      const propsNode = opacity.__getChildren()[0].__getChildren()[0];
      let propsTag = propsNode.__nativeTag;
      expect(NativeAnimatedModule.connectAnimatedNodeToView).nthCalledWith(
        1,
        propsTag,
        1,
      );

      // Simulate what happens when React.Activity unmounts and remounts
      propsNode.__detach();
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toBeCalledWith(propsTag, 1);

      propsNode.__attach();
      // $FlowFixMe[prop-missing]
      propsNode.setNativeView(ref.current);

      propsTag = propsNode.__nativeTag;
      expect(NativeAnimatedModule.connectAnimatedNodeToView).nthCalledWith(
        2,
        propsTag,
        1,
      );
    });

    it('creates new props, style and transform nodes at update', async () => {
      const {Animated} = importModules();

      const opacityA = new Animated.Value(0, {
        debugID: 'opacityA',
        useNativeDriver: true,
      });
      const opacityB = new Animated.Value(0, {
        debugID: 'opacityB',
        useNativeDriver: true,
      });
      opacityA.__makeNative();
      opacityB.__makeNative();
      const scaleA = new Animated.Value(0, {
        debugID: 'scaleA',
        useNativeDriver: true,
      });
      const scaleB = new Animated.Value(0, {
        debugID: 'scaleB',
        useNativeDriver: true,
      });
      scaleA.__makeNative();
      scaleB.__makeNative();

      expect(NativeAnimatedModule.createAnimatedNode).not.toHaveBeenCalled();

      // 1. First render, both opacity and transform scale are managed by Animated
      const root = await create(
        <Animated.View
          style={{opacity: opacityA, transform: [{scale: scaleA}]}}
        />,
      );

      let createAnimatedNodeCalledTimes = 0;
      let dropAnimatedNodeCalledTimes = 0;

      expect(
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.slice(0, 5),
      ).toEqual([
        [1, {debugID: 'opacityA', offset: 0, type: 'value', value: 0}],
        [4, {debugID: 'scaleA', offset: 0, type: 'value', value: 0}],
        [
          3,
          {
            debugID: undefined,
            transforms: [{nodeTag: 4, property: 'scale', type: 'animated'}],
            type: 'transform',
          },
        ],
        [
          2,
          {
            debugID: undefined,
            style: {
              opacity: 1,
              transform: 3,
            },
            type: 'style',
          },
        ],
        [5, {debugID: undefined, props: {style: 2}, type: 'props', rootTag: 0}],
      ]);

      createAnimatedNodeCalledTimes += 5;

      expect(NativeAnimatedModule.dropAnimatedNode).not.toHaveBeenCalled();
      expect(NativeAnimatedModule.restoreDefaultValues).not.toHaveBeenCalled();
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).not.toHaveBeenCalled();
      expect(
        NativeAnimatedModule.connectAnimatedNodeToView,
      ).toHaveBeenCalledTimes(1);

      // 2. Update the Animated node to control opacity style
      await update(
        root,
        <Animated.View
          style={{opacity: opacityB, transform: [{scale: scaleA}]}}
        />,
      );
      jest.runAllTicks();

      expect(
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.slice(5, 9),
      ).toEqual([
        [6, {debugID: 'opacityB', offset: 0, type: 'value', value: 0}],
        // transform node is still recreated even though `scale` is unchanged
        [
          8,
          {
            debugID: undefined,
            transforms: [{nodeTag: 4, property: 'scale', type: 'animated'}],
            type: 'transform',
          },
        ],
        [
          7,
          {
            debugID: undefined,
            style: {
              opacity: 6,
              transform: 8,
            },
            type: 'style',
          },
        ],
        [9, {debugID: undefined, props: {style: 7}, type: 'props', rootTag: 0}],
      ]);

      createAnimatedNodeCalledTimes += 4;

      expect(
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.dropAnimatedNode.mock.calls.slice(0, 4),
      ).toEqual([[1], [3], [2], [5]]);

      dropAnimatedNodeCalledTimes += 4;

      expect(NativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(
        createAnimatedNodeCalledTimes,
      );
      expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(
        dropAnimatedNodeCalledTimes,
      );

      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        1,
      );
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toHaveBeenCalledTimes(1);
      expect(
        NativeAnimatedModule.connectAnimatedNodeToView,
      ).toHaveBeenCalledTimes(2);

      // 3. Opacity is controlled by React while transform scale is still managed by Animated
      await update(
        root,
        <Animated.View style={{opacity: 1, transform: [{scale: scaleB}]}} />,
      );
      jest.runAllTicks();

      expect(
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.createAnimatedNode.mock.calls.slice(9, 13),
      ).toEqual([
        [10, {debugID: 'scaleB', offset: 0, type: 'value', value: 0}],
        [
          11,
          {
            debugID: undefined,
            transforms: [{nodeTag: 10, property: 'scale', type: 'animated'}],
            type: 'transform',
          },
        ],
        [
          12,
          {
            debugID: undefined,
            style: {
              transform: 11,
            },
            type: 'style',
          },
        ],
        [
          13,
          {debugID: undefined, props: {style: 12}, type: 'props', rootTag: 0},
        ],
      ]);

      createAnimatedNodeCalledTimes += 4;

      expect(
        // $FlowFixMe[prop-missing]
        NativeAnimatedModule.dropAnimatedNode.mock.calls.slice(4, 9),
      ).toEqual([[6], [4], [8], [7], [9]]);

      dropAnimatedNodeCalledTimes += 5;

      expect(NativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(
        createAnimatedNodeCalledTimes,
      );
      expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(
        dropAnimatedNodeCalledTimes,
      );
      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        2,
      );
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toHaveBeenCalledTimes(2);
      expect(
        NativeAnimatedModule.connectAnimatedNodeToView,
      ).toHaveBeenCalledTimes(3);

      // 4. Both opacity and transform scale are controlled by React instead of Animated
      await update(
        root,
        <Animated.View style={{opacity: 1, transform: [{scale: 1}]}} />,
      );
      jest.runAllTicks();

      {
        const droppedTags = [10, 11, 12, 13];
        for (let i = 0; i < droppedTags.length; i++) {
          expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenNthCalledWith(
            i + dropAnimatedNodeCalledTimes + 1,
            droppedTags[i],
          );
        }

        dropAnimatedNodeCalledTimes += droppedTags.length;
      }
      expect(NativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(
        createAnimatedNodeCalledTimes,
      );
      expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(
        dropAnimatedNodeCalledTimes,
      );

      // View is no longer connected to PropsAnimatedNode
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toHaveBeenCalledTimes(3);
      expect(
        NativeAnimatedModule.connectAnimatedNodeToView,
      ).toHaveBeenCalledTimes(3);
      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        3,
      );

      // 5. Unmount
      await unmount(root);
      jest.runAllTicks();
      // No change for Animated nodes on unmount.
      expect(NativeAnimatedModule.createAnimatedNode).toHaveBeenCalledTimes(
        createAnimatedNodeCalledTimes,
      );
      expect(NativeAnimatedModule.dropAnimatedNode).toHaveBeenCalledTimes(
        dropAnimatedNodeCalledTimes,
      );
      expect(
        NativeAnimatedModule.disconnectAnimatedNodeFromView,
      ).toHaveBeenCalledTimes(3);
      expect(
        NativeAnimatedModule.connectAnimatedNodeToView,
      ).toHaveBeenCalledTimes(3);
      expect(NativeAnimatedModule.restoreDefaultValues).toHaveBeenCalledTimes(
        3,
      );
    });
  });
});
