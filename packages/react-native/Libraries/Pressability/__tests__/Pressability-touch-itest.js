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

import type {PressabilityConfig} from '../Pressability';
import type {HostInstance} from 'react-native';

import usePressability from '../usePressability';
import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {View} from 'react-native';

function touchPayload(
  identifier: number = 0,
  pageX: number = 5,
  pageY: number = 5,
): {touches: Array<{...}>, changedTouches: Array<{...}>} {
  return {
    touches: [{identifier, pageX, pageY, timestamp: 0}],
    changedTouches: [{identifier, pageX, pageY, timestamp: 0}],
  };
}

function touchEndPayload(identifier: number = 0): {
  touches: Array<{...}>,
  changedTouches: Array<{...}>,
} {
  return {
    touches: [],
    changedTouches: [{identifier, pageX: 5, pageY: 5, timestamp: 200}],
  };
}

function PressabilityTestView({
  config,
  ...viewProps
}: {
  config: PressabilityConfig,
  ref?: React.RefSetter<HostInstance>,
  style?: {height: number, width: number},
}) {
  const eventHandlers = usePressability(config);
  return <View {...viewProps} {...eventHandlers} />;
}

function renderPressability(config: PressabilityConfig): HostInstance {
  const ref = createRef<HostInstance>();
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      <PressabilityTestView
        ref={ref}
        config={config}
        style={{height: 100, width: 100}}
      />,
    );
  });
  return nullthrows(ref.current);
}

function touchStart(element: HostInstance): void {
  Fantom.dispatchNativeEvent(element, 'onTouchStart', touchPayload(), {
    category: Fantom.NativeEventCategory.Discrete,
  });
}

function touchEnd(element: HostInstance): void {
  Fantom.dispatchNativeEvent(element, 'onTouchEnd', touchEndPayload(), {
    category: Fantom.NativeEventCategory.Discrete,
  });
}

describe('Pressability (touch)', () => {
  let timers: Fantom.TimerMock;

  beforeEach(() => {
    timers = Fantom.installTimerMock();
  });

  afterEach(() => {
    timers.uninstall();
  });

  it('fires onPressIn on touch start and onPressOut/onPress on touch end', () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    const onPress = jest.fn();

    const element = renderPressability({onPressIn, onPressOut, onPress});

    touchStart(element);
    expect(onPressIn).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(0);

    touchEnd(element);
    // Flush the minimum-press-duration timer that gates onPressOut.
    timers.runAllTimers();

    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPressOut).toHaveBeenCalledTimes(1);
  });

  it('fires onLongPress after the long press delay and suppresses onPress', () => {
    const onLongPress = jest.fn();
    const onPress = jest.fn();

    const element = renderPressability({onLongPress, onPress});

    touchStart(element);
    // Default long press delay is 500ms.
    timers.advanceTimersByTime(500);
    expect(onLongPress).toHaveBeenCalledTimes(1);

    touchEnd(element);
    timers.runAllTimers();

    // A long press does not additionally fire onPress.
    expect(onPress).toHaveBeenCalledTimes(0);
  });

  it('delays onPressIn when delayPressIn is set', () => {
    const onPressIn = jest.fn();

    const element = renderPressability({
      onPressIn,
      delayPressIn: 200,
    });

    touchStart(element);
    expect(onPressIn).toHaveBeenCalledTimes(0);

    timers.advanceTimersByTime(200);
    expect(onPressIn).toHaveBeenCalledTimes(1);

    // Release the responder to clean up global responder state.
    touchEnd(element);
    timers.runAllTimers();
  });

  it('does not fire onPress when the responder is terminated', () => {
    const onPress = jest.fn();
    const onPressIn = jest.fn();

    const element = renderPressability({onPress, onPressIn});

    touchStart(element);
    expect(onPressIn).toHaveBeenCalledTimes(1);

    Fantom.dispatchNativeEvent(element, 'onTouchCancel', touchEndPayload(), {
      category: Fantom.NativeEventCategory.Discrete,
    });
    timers.runAllTimers();

    expect(onPress).toHaveBeenCalledTimes(0);
  });
});
