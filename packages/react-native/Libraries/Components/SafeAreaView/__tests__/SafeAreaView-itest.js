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
import {
  SafeAreaProvider,
  SafeAreaView,
  Text,
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native';

describe('<SafeAreaView>', () => {
  it('renders as a native component with children', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <SafeAreaView>
          <Text>Hello World!</Text>
        </SafeAreaView>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-safeAreaView>
        <rn-paragraph>Hello World!</rn-paragraph>
      </rn-safeAreaView>,
    );
  });
});

describe('<SafeAreaProvider>', () => {
  it('delivers insets and frame to useSafeAreaInsets/useSafeAreaFrame', () => {
    const root = Fantom.createRoot();
    const providerRef = React.createRef<mixed>();

    function Consumer(): React.Node {
      const insets = useSafeAreaInsets();
      const frame = useSafeAreaFrame();
      return (
        <Text>{`insets:${insets.top},${insets.right},${insets.bottom},${insets.left} frame:${frame.width}x${frame.height}`}</Text>
      );
    }

    Fantom.runTask(() => {
      root.render(
        <SafeAreaProvider ref={providerRef}>
          <Consumer />
        </SafeAreaProvider>,
      );
    });

    // Before any insets are reported, the provider renders no children, so the
    // consumer is not mounted and `useSafeAreaInsets` never throws.
    expect(root.getRenderedOutput().toJSX()).toEqual(<rn-safeAreaProvider />);

    Fantom.dispatchNativeEvent(providerRef.current, 'onInsetsChange', {
      insets: {top: 44, right: 2, bottom: 34, left: 1},
      frame: {x: 0, y: 0, width: 390, height: 844},
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-safeAreaProvider>
        <rn-paragraph>insets:44,2,34,1 frame:390x844</rn-paragraph>
      </rn-safeAreaProvider>,
    );
  });
});
