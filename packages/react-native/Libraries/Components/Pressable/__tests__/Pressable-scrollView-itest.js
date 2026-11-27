/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags delayPressInInScrollView:true
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';
import * as React from 'react';
import {createRef} from 'react';
import {Pressable, ScrollView} from 'react-native';

function render(inScrollView: boolean, onPressIn: () => void): HostInstance {
  const ref = createRef<HostInstance>();
  const pressable = (
    <Pressable ref={ref} onPressIn={onPressIn} style={{height: 100}} />
  );
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(
      inScrollView ? <ScrollView>{pressable}</ScrollView> : pressable,
    );
  });
  return nullthrows(ref.current);
}

function touch(
  element: HostInstance,
  type: 'onTouchStart' | 'onTouchEnd' | 'onTouchCancel',
): void {
  const point = {identifier: 0, pageX: 5, pageY: 5, timestamp: 0};
  Fantom.dispatchNativeEvent(
    element,
    type,
    {touches: type === 'onTouchStart' ? [point] : [], changedTouches: [point]},
    {category: Fantom.NativeEventCategory.Discrete},
  );
}

describe('<Pressable> in <ScrollView>', () => {
  let timers: Fantom.TimerMock;

  beforeEach(() => {
    timers = Fantom.installTimerMock();
  });

  afterEach(() => {
    timers.runAllTimers();
    timers.uninstall();
  });

  it('delays onPressIn', () => {
    const onPressIn = jest.fn();
    const element = render(true, onPressIn);

    touch(element, 'onTouchStart');
    timers.advanceTimersByTime(129);
    expect(onPressIn).toHaveBeenCalledTimes(0);

    timers.advanceTimersByTime(1);
    expect(onPressIn).toHaveBeenCalledTimes(1);

    touch(element, 'onTouchEnd');
  });

  it('does not call onPressIn when the touch is canceled before the delay', () => {
    const onPressIn = jest.fn();
    const element = render(true, onPressIn);

    touch(element, 'onTouchStart');
    touch(element, 'onTouchCancel');
    timers.runAllTimers();

    expect(onPressIn).toHaveBeenCalledTimes(0);
  });

  it('does not delay onPressIn outside of a scroll view', () => {
    const onPressIn = jest.fn();
    const element = render(false, onPressIn);

    touch(element, 'onTouchStart');
    expect(onPressIn).toHaveBeenCalledTimes(1);

    touch(element, 'onTouchEnd');
  });
});
