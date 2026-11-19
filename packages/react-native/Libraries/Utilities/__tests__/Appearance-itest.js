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

import View from '../../Components/View/View';
import * as Appearance from '../Appearance';
import useColorScheme from '../useColorScheme';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {DeviceEventEmitter} from 'react-native';

const NativeAppearance = require('../NativeAppearance');

// Fantom has no native Appearance module, so a fake one is installed before
// `Appearance` lazily reads it.
// $FlowFixMe[cannot-write]
NativeAppearance.default = {
  getColorScheme: () => 'dark',
  setColorScheme: jest.fn(),
  addListener: jest.fn(),
  removeListeners: jest.fn(),
};

describe('Appearance', () => {
  it('notifies change listeners when setColorScheme changes the scheme', () => {
    expect(Appearance.getColorScheme()).toBe('dark');

    const listener = jest.fn();
    const subscription = Appearance.addChangeListener(listener);

    Appearance.setColorScheme('light');

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith({colorScheme: 'light'});

    DeviceEventEmitter.emit('appearanceChanged', {colorScheme: 'light'});
    Appearance.setColorScheme('light');

    expect(listener).toHaveBeenCalledTimes(1);

    DeviceEventEmitter.emit('appearanceChanged', {colorScheme: 'dark'});

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith({colorScheme: 'dark'});
    expect(Appearance.getColorScheme()).toBe('dark');

    subscription.remove();
  });

  it('updates useColorScheme in the same task as setColorScheme', () => {
    let observed;
    function TestComponent() {
      observed = useColorScheme();
      return <View />;
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<TestComponent />);
    });

    expect(observed).toBe('dark');

    Fantom.runTask(() => {
      Appearance.setColorScheme('light');
    });

    expect(observed).toBe('light');
  });
});
