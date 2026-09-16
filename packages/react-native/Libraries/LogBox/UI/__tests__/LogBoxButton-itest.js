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

import Text from '../../../Text/Text';
import LogBoxButton from '../LogBoxButton';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';

describe('LogBoxButton', () => {
  it('should render only a view without an onPress', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxButton
          backgroundColor={{
            default: 'black',
            pressed: 'red',
          }}>
          <Text>Press me</Text>
        </LogBoxButton>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });

  it('should render Pressable and pass through props', () => {
    const root = Fantom.createRoot();
    Fantom.runTask(() => {
      root.render(
        <LogBoxButton
          backgroundColor={{
            default: 'black',
            pressed: 'red',
          }}
          hitSlop={{}}
          onPress={() => {}}>
          <Text>Press me</Text>
        </LogBoxButton>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toMatchSnapshot();
  });
});
