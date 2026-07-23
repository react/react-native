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

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {ActivityIndicator} from 'react-native';

function renderSizeOutput(element: React.MixedElement): React.Node {
  const root = Fantom.createRoot();
  Fantom.runTask(() => {
    root.render(element);
  });
  return root.getRenderedOutput({props: ['width', 'height']}).toJSX();
}

describe('ActivityIndicator', () => {
  it('renders the default (small) size', () => {
    expect(renderSizeOutput(<ActivityIndicator />)).toEqual(
      <rn-androidProgressBar width="20" height="20" />,
    );
  });

  it('renders the large size', () => {
    expect(renderSizeOutput(<ActivityIndicator size="large" />)).toEqual(
      <rn-androidProgressBar width="36" height="36" />,
    );
  });

  it('renders a numeric size as an explicit width/height', () => {
    expect(renderSizeOutput(<ActivityIndicator size={42} />)).toEqual(
      <rn-androidProgressBar width="42" height="42" />,
    );
  });

  it('renders with color, animating and hidesWhenStopped props applied', () => {
    // color/animating/hidesWhenStopped are forwarded to the native component;
    // the mounted size still reflects the (default, small) size.
    expect(
      renderSizeOutput(
        <ActivityIndicator
          color="#ff0000"
          animating={false}
          hidesWhenStopped={false}
        />,
      ),
    ).toEqual(<rn-androidProgressBar width="20" height="20" />);
  });
});
