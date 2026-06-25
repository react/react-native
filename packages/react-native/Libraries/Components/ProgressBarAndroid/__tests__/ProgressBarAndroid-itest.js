/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {ProgressBarAndroid} from 'react-native';

describe('<ProgressBarAndroid>', () => {
  it('should render as expected', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <ProgressBarAndroid styleAttr="Horizontal" indeterminate={true} />,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(<rn-androidProgressBar />);
  });
});
