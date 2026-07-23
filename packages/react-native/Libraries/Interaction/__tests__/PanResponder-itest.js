/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {PanResponderCallbacks} from '../PanResponder';
import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {PanResponder, View} from 'react-native';

function touchAt(
  pageX: number,
  pageY: number,
  timestamp: number,
): {touches: Array<{...}>, changedTouches: Array<{...}>} {
  return {
    touches: [{identifier: 0, pageX, pageY, timestamp}],
    changedTouches: [{identifier: 0, pageX, pageY, timestamp}],
  };
}

function endAt(
  pageX: number,
  pageY: number,
  timestamp: number,
): {touches: Array<{...}>, changedTouches: Array<{...}>} {
  return {
    touches: [],
    changedTouches: [{identifier: 0, pageX, pageY, timestamp}],
  };
}

describe('PanResponder', () => {
  function renderWithHandlers(config: PanResponderCallbacks): HostInstance {
    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      ...config,
    });
    const ref = createRef<HostInstance>();
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <View
          ref={ref}
          style={{width: 100, height: 100}}
          {...panResponder.panHandlers}
        />,
      );
    });
    return nullthrows(ref.current);
  }

  function dispatch(
    element: HostInstance,
    type: string,
    payload: Readonly<{[key: string]: unknown}>,
  ): void {
    Fantom.dispatchNativeEvent(element, type, payload, {
      category: Fantom.NativeEventCategory.Discrete,
    });
  }

  it('grants the responder on touch start', () => {
    const onPanResponderGrant = jest.fn();
    const element = renderWithHandlers({onPanResponderGrant});

    dispatch(element, 'onTouchStart', touchAt(5, 5, 0));
    expect(onPanResponderGrant).toHaveBeenCalledTimes(1);

    dispatch(element, 'onTouchEnd', endAt(5, 5, 100));
  });

  it('reports gesture displacement on move', () => {
    let capturedDx = null;
    let capturedDy = null;
    const onPanResponderMove = jest.fn((event, gestureState) => {
      capturedDx = gestureState.dx;
      capturedDy = gestureState.dy;
    });
    const element = renderWithHandlers({onPanResponderMove});

    dispatch(element, 'onTouchStart', touchAt(0, 0, 0));
    dispatch(element, 'onTouchMove', touchAt(10, 20, 100));

    expect(onPanResponderMove).toHaveBeenCalled();
    expect(capturedDx).toBe(10);
    expect(capturedDy).toBe(20);

    dispatch(element, 'onTouchEnd', endAt(10, 20, 200));
  });

  it('releases the responder on touch end', () => {
    const onPanResponderRelease = jest.fn();
    const element = renderWithHandlers({onPanResponderRelease});

    dispatch(element, 'onTouchStart', touchAt(5, 5, 0));
    dispatch(element, 'onTouchEnd', endAt(5, 5, 100));

    expect(onPanResponderRelease).toHaveBeenCalledTimes(1);
  });

  it('terminates the responder on touch cancel', () => {
    const onPanResponderTerminate = jest.fn();
    const element = renderWithHandlers({onPanResponderTerminate});

    dispatch(element, 'onTouchStart', touchAt(5, 5, 0));
    dispatch(element, 'onTouchCancel', endAt(5, 5, 100));

    expect(onPanResponderTerminate).toHaveBeenCalledTimes(1);
  });

  it('tracks the number of active touches across a gesture', () => {
    let grantTouches = null;
    let releaseTouches = null;
    const element = renderWithHandlers({
      onPanResponderGrant: (event, gestureState) => {
        grantTouches = gestureState.numberActiveTouches;
      },
      onPanResponderRelease: (event, gestureState) => {
        releaseTouches = gestureState.numberActiveTouches;
      },
    });

    dispatch(element, 'onTouchStart', touchAt(5, 5, 0));
    expect(grantTouches).toBe(1);

    dispatch(element, 'onTouchEnd', endAt(5, 5, 100));
    expect(releaseTouches).toBe(0);
  });
});
