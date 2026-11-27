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
import {UIManager, View} from 'react-native';

describe('UIManager.hasViewManagerConfig in Fantom', () => {
  it('recognizes components registered by the tester', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(<View nativeID="registered" />);
    });
    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="registered" />,
    );

    expect(UIManager.hasViewManagerConfig('View')).toBe(true);
    expect(UIManager.hasViewManagerConfig('RCTView')).toBe(true);
  });

  it('returns false for an unregistered component', () => {
    expect(UIManager.hasViewManagerConfig('UnregisteredFantomTestView')).toBe(
      false,
    );
  });
});
