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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Animated} from 'react-native';
import AnimatedProps from 'react-native/Libraries/Animated/nodes/AnimatedProps';
import NativeAnimatedHelper from 'react-native/src/private/animated/NativeAnimatedHelper';

function mockNativeAnimatedHelperAPI() {
  const mocks = {
    connectAnimatedNodeToView: jest.fn(),
    disconnectAnimatedNodeFromView: jest.fn(),
  };
  // $FlowFixMe[cannot-write] - Switch to `jest.spyOn` when supported.
  // $FlowFixMe[unsafe-object-assign]
  Object.assign(NativeAnimatedHelper.API, mocks);
  return mocks;
}

test('connects and disconnects views', () => {
  const mocks = mockNativeAnimatedHelperAPI();
  const opacity = new Animated.Value(0);

  const root = Fantom.createRoot();

  Fantom.runTask(() => {
    root.render(<Animated.View style={{opacity}} />);
  });
  expect(mocks.connectAnimatedNodeToView).not.toBeCalled();
  expect(mocks.disconnectAnimatedNodeFromView).not.toBeCalled();

  Fantom.runTask(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  });
  expect(mocks.connectAnimatedNodeToView).toBeCalledTimes(1);
  expect(mocks.disconnectAnimatedNodeFromView).not.toBeCalled();

  Fantom.runTask(() => {
    root.destroy();
  });

  expect(mocks.connectAnimatedNodeToView).toBeCalledTimes(1);
  expect(mocks.disconnectAnimatedNodeFromView).toBeCalledTimes(1);

  // TODO: investigate why previous task enqueues more tasks.
  Fantom.runWorkLoop();
});

describe('AnimatedProps#__getValue', () => {
  function getValue(inputProps: {[string]: unknown}) {
    const animatedProps = new AnimatedProps(inputProps, jest.fn());
    return animatedProps.__getValue();
  }

  test('returns original `style` if it has no nodes', () => {
    const style = {color: 'red'};
    expect(getValue({style}).style).toBe(style);
  });

  test('returns original `style` for invalid style values', () => {
    const values = [undefined, null, function () {}, true, 123, 'foo'];
    for (const value of values) {
      expect(getValue({style: value})).toEqual({style: value});
    }
  });
});
