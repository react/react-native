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
import {InputAccessoryView, View} from 'react-native';

describe('<InputAccessoryView>', () => {
  // `InputAccessoryView` is an iOS-only component. Fantom runs as Android, where
  // it renders nothing.
  it('renders nothing on Android', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <InputAccessoryView nativeID="1">
          <View />
        </InputAccessoryView>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toBeNull();
  });
});
