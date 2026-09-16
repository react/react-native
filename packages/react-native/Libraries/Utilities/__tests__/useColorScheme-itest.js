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

describe('useColorScheme', () => {
  const originalGetColorScheme = Appearance.getColorScheme;

  afterEach(() => {
    // $FlowFixMe[cannot-write]
    Appearance.getColorScheme = originalGetColorScheme;
  });

  it('returns the color scheme reported by Appearance', () => {
    const getColorScheme = jest.fn(() => 'dark');
    // $FlowFixMe[cannot-write]
    Appearance.getColorScheme = getColorScheme;

    let observed;
    function TestComponent() {
      observed = useColorScheme();
      return <View />;
    }

    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<TestComponent />);
    });

    expect(getColorScheme).toHaveBeenCalled();
    expect(observed).toBe('dark');
  });

  it('throws when called outside of a component', () => {
    let error;
    try {
      // $FlowFixMe[react-rule-hook]
      useColorScheme();
    } catch (e) {
      error = e;
    }

    expect(error?.message).toContain(
      'Invalid hook call. Hooks can only be called inside of the body of a function component.',
    );
  });
});
